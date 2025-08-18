import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { listingId, message, fromEmail } = await req.json();

    if (!listingId || !message || !fromEmail) {
      throw new Error('Missing required fields: listingId, message, fromEmail');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .select('email')
      .eq('id', listingId)
      .single();

    if (error || !listing) {
      throw new Error('Listing not found or could not retrieve author email.');
    }
    
    const toEmail = listing.email;

    // In a real application, you would integrate an email service like Resend, SendGrid, or Postmark here.
    // For now, we'll simulate the email sending process.
    console.log(`--- SIMULATING EMAIL SEND ---`);
    console.log(`Recipient: ${toEmail}`);
    console.log(`Sender: ${fromEmail}`);
    console.log(`Listing ID: ${listingId}`);
    console.log(`Message: ${message}`);
    console.log(`-----------------------------`);

    return new Response(JSON.stringify({ success: true, message: 'Reply sent successfully (simulated).' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})