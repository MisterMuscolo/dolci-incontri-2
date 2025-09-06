import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      throw new Error('Missing Turnstile token');
    }

    const CLOUDFLARE_TURNSTILE_SECRET_KEY = Deno.env.get('CLOUDFLARE_TURNSTILE_SECRET_KEY');

    if (!CLOUDFLARE_TURNSTILE_SECRET_KEY) {
      throw new Error('Cloudflare Turnstile Secret Key not configured.');
    }

    const formData = new FormData();
    formData.append('secret', CLOUDFLARE_TURNSTILE_SECRET_KEY);
    formData.append('response', token);

    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const result = await fetch(url, {
      body: formData,
      method: 'POST',
    });

    const outcome = await result.json();

    if (!outcome.success) {
      console.error('Turnstile verification failed:', outcome['error-codes']);
      throw new Error('Turnstile verification failed.');
    }

    return new Response(JSON.stringify({ success: true }), {
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