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
    const { couponId } = await req.json();

    if (!couponId) {
      throw new Error('Missing required field: couponId');
    }

    // Create a Supabase client with the user's JWT for RLS checks
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the current user (caller of the function)
    const { data: { user: callerUser } } = await supabaseClient.auth.getUser();

    if (!callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No user session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Check if the caller is an admin
    const { data: callerProfile, error: callerProfileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (callerProfileError || callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Only admins can delete coupons' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Use the service role key for the actual delete to bypass RLS for admin action
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: deleteError } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (deleteError) {
      throw new Error(`Failed to delete coupon: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Coupon deleted successfully' }), {
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