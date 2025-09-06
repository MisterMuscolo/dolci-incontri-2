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
    const { userId, amount, packageName, couponId, couponType } = await req.json(); // Added couponId, couponType

    if (!userId || typeof amount !== 'number' || !packageName) {
      throw new Error('Missing required fields: userId, amount, packageName');
    }

    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user's current credits
    const { data: profile, error: fetchProfileError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchProfileError || !profile) {
      throw new Error('User profile not found.');
    }

    const newCredits = profile.credits + amount;
    if (newCredits < 0) {
      throw new Error('Cannot set negative credits.');
    }

    // Update user's credits
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update user credits: ${updateError.message}`);
    }

    // Log the transaction
    const { error: transactionError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        type: 'purchase',
        package_name: packageName,
      });

    if (transactionError) {
      console.error('Failed to log credit transaction:', transactionError.message);
      // For simplicity, we'll just log this error for now.
    }

    // Mark coupon as used if applicable
    if (couponId && couponType) {
      if (couponType === 'single_use') {
        const { error: usedCouponInsertError } = await supabaseAdmin
          .from('used_coupons')
          .insert({ coupon_id: couponId, user_id: userId });
        if (usedCouponInsertError) {
          console.error('Failed to log single-use coupon usage:', usedCouponInsertError.message);
        }
        // Rimosso: Non disattivare globalmente i coupon monouso qui.
        // const { error: updateCouponStatusError } = await supabaseAdmin
        //   .from('coupons')
        //   .update({ is_active: false })
        //   .eq('id', couponId);
        // if (updateCouponStatusError) {
        //   console.error('Failed to mark single-use coupon as inactive:', updateCouponStatusError.message);
        // }
      } else if (couponType === 'reusable') {
        // Fetch current usage_count and then increment
        const { data: currentCoupon, error: fetchCouponError } = await supabaseAdmin
          .from('coupons')
          .select('usage_count')
          .eq('id', couponId)
          .single();

        if (fetchCouponError || !currentCoupon) {
          console.error('Failed to fetch coupon for usage increment:', fetchCouponError?.message);
        } else {
          const { error: couponUpdateError } = await supabaseAdmin
            .from('coupons')
            .update({ usage_count: currentCoupon.usage_count + 1 })
            .eq('id', couponId);
          if (couponUpdateError) {
            console.error('Failed to increment reusable coupon usage count:', couponUpdateError.message);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, newCredits: newCredits }), {
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