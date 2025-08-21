import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'npm:stripe@16.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packageId, couponCode } = await req.json(); // couponCode is now optional

    if (!packageId) {
      throw new Error('Missing packageId (Stripe Price ID)');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Retrieve the price object from Stripe
    const price = await stripe.prices.retrieve(packageId, { expand: ['product'] });

    if (!price || price.type !== 'one_time' || price.currency !== 'eur' || price.unit_amount === null) {
      throw new Error('Invalid or unsupported Stripe Price ID.');
    }

    const product = price.product as Stripe.Product;
    const credits = price.metadata?.credits ? parseInt(price.metadata.credits as string, 10) : 0;
    const packageName = product.name;

    let finalAmountInCents = price.unit_amount;
    let appliedCouponId: string | null = null;
    let appliedCouponType: string | null = null;

    // If a coupon code is provided, attempt to apply it
    if (couponCode) {
      const supabaseAdmin = createClient( // Use admin client to bypass RLS for coupon validation here
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .single();

      if (couponError || !coupon) {
        // Do not throw an error here, just proceed without coupon
        console.warn(`Coupon "${couponCode}" not found or invalid: ${couponError?.message}`);
      } else {
        // Perform server-side validation for the coupon
        if (!coupon.is_active) {
          console.warn(`Coupon "${couponCode}" is not active.`);
        } else if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          console.warn(`Coupon "${couponCode}" is expired.`);
        } else if (coupon.type === 'single_use') {
          // Check if single-use coupon has already been used by the current user
          const supabaseClient = createClient( // Use user's client for RLS on used_coupons
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
          );
          const { data: { user } } = await supabaseClient.auth.getUser();
          if (!user) {
            console.warn('User not authenticated for single-use coupon check.');
          } else {
            const { data: usedCoupon, error: usedCouponError } = await supabaseClient
              .from('used_coupons')
              .select('id')
              .eq('coupon_id', coupon.id)
              .eq('user_id', user.id)
              .single();

            if (usedCouponError && usedCouponError.code !== 'PGRST116') { // PGRST116 means no rows found
              console.error(`Error checking used coupon: ${usedCouponError.message}`);
            }
            if (usedCoupon) {
              console.warn(`Single-use coupon "${couponCode}" already used by user ${user.id}.`);
              // Do not apply coupon if already used
              coupon = null; // Invalidate coupon for this transaction
            }
          }
        } else if (coupon.type === 'reusable' && coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses) {
          console.warn(`Reusable coupon "${couponCode}" has reached max uses.`);
          // Do not apply coupon if max uses reached
          coupon = null; // Invalidate coupon for this transaction
        }

        // Apply discount if coupon is still valid after all checks
        if (coupon) {
          if (coupon.discount_type === 'percentage') {
            finalAmountInCents = Math.round(price.unit_amount * (1 - coupon.discount_value / 100));
          } else if (coupon.discount_type === 'flat_amount') {
            finalAmountInCents = price.unit_amount - Math.round(coupon.discount_value * 100);
          }
          finalAmountInCents = Math.max(0, finalAmountInCents); // Ensure amount doesn't go below zero
          appliedCouponId = coupon.id;
          appliedCouponType = coupon.type;
          console.log(`Coupon "${couponCode}" applied. Original amount: ${price.unit_amount}, Final amount: ${finalAmountInCents}`);
        }
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmountInCents,
      currency: 'eur',
      metadata: {
        priceId: price.id,
        credits: credits,
        packageName: packageName,
        couponId: appliedCouponId || '', // Store coupon ID if applied
        couponType: appliedCouponType || '', // Store coupon type if applied
      },
    });

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});