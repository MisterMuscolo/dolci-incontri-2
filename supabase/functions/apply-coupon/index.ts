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

    // Handle single-use coupons
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

    // If all checks pass, return the coupon details for application
    return new Response(JSON.stringify({
      success: true,
      couponId: coupon.id,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      couponType: coupon.type,
      message: 'Coupon applicato con successo!'
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