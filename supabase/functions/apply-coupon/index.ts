import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { couponCode } = await req.json();

    if (!couponCode) {
      throw new Error('Missing required field: couponCode');
    }

    // Create a Supabase client with the user's JWT for RLS checks
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: User must be authenticated to apply a coupon' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Fetch the coupon using the user's client (RLS will filter for applicable coupons)
    const { data: coupon, error: couponError } = await supabaseClient
      .from('coupons')
      .select('*')
      .eq('code', couponCode)
      .single();

    if (couponError || !coupon) {
      throw new Error('Coupon non valido o scaduto.');
    }

    // Additional checks not covered by RLS (e.g., max_uses for reusable coupons)
    if (!coupon.is_active) {
      throw new Error('Coupon non attivo.');
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      throw new Error('Coupon scaduto.');
    }
    if (coupon.applies_to_user_id && coupon.applies_to_user_id !== user.id) {
      throw new Error('Questo coupon non è valido per il tuo account.');
    }

    // Check if single-use coupon has already been used by the current user
    if (coupon.type === 'single_use') {
      const { data: usedCoupon, error: usedCouponError } = await supabaseClient
        .from('used_coupons')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', user.id)
        .single();

      if (usedCouponError && usedCouponError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw new Error(`Error checking used coupon: ${usedCouponError.message}`);
      }
      if (usedCoupon) {
        throw new Error('Questo coupon è già stato utilizzato.');
      }
    }

    // Handle reusable coupons with max_uses
    if (coupon.type === 'reusable' && coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses) {
      throw new Error('Questo coupon ha raggiunto il numero massimo di utilizzi.');
    }

    // NEW LOGIC: If discount_type is 'credits', add credits to user profile
    if (coupon.discount_type === 'credits') {
      const supabaseAdmin = createClient( // Use admin client to bypass RLS for credit update
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Fetch user's current credits
      const { data: profile, error: fetchProfileError } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (fetchProfileError || !profile) {
        throw new Error('User profile not found for credit update.');
      }

      const newCredits = profile.credits + coupon.discount_value;

      // Update user's credits
      const { error: updateCreditsError } = await supabaseAdmin
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      if (updateCreditsError) {
        throw new Error(`Failed to add credits: ${updateCreditsError.message}`);
      }

      // Log the transaction
      const { error: transactionError } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: coupon.discount_value,
          type: 'coupon_credit_add', // New transaction type
          package_name: `Coupon: ${coupon.code}`,
        });

      if (transactionError) {
        console.error('Failed to log credit transaction for coupon:', transactionError.message);
      }
    }

    // Record that the user has applied/discovered this coupon
    // Use the user's client for this insert, as RLS on `user_coupons` will allow it.
    const { error: userCouponInsertError } = await supabaseClient
      .from('user_coupons')
      .insert({
        user_id: user.id,
        coupon_id: coupon.id,
      });

    if (userCouponInsertError) {
      // If the error is a unique constraint violation (user already applied this coupon),
      // we can treat it as a success for the "application" part, but inform the user.
      if (userCouponInsertError.code === '23505') { // Unique violation error code
        console.warn(`Coupon ${coupon.code} already applied by user ${user.id}.`);
        // We can still proceed to return success, as the coupon is valid and "known" by the user.
      } else {
        throw new Error(`Failed to record coupon application: ${userCouponInsertError.message}`);
      }
    }
    // END NEW LOGIC

    // If all checks pass, return the coupon details for application
    return new Response(JSON.stringify({
      success: true,
      couponId: coupon.id,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      couponType: coupon.type,
      message: coupon.discount_type === 'credits' ? `Hai ricevuto ${coupon.discount_value} crediti!` : 'Coupon applicato con successo!'
    }), {
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