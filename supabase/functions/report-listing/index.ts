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
    const { listingId, reporterEmail, reportMessage } = await req.json();
    console.log('Received report:', { listingId, reporterEmail, reportMessage });

    if (!listingId || !reporterEmail || !reportMessage) {
      console.error('Missing required fields for report.');
      throw new Error('Missing required fields: listingId, reporterEmail, reportMessage');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch listing details to include in the report email
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('title')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      console.error('Error fetching listing for report:', listingError?.message);
      throw new Error('Listing not found or could not retrieve its title.');
    }
    console.log('Listing found:', listing.title);
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    console.log('RESEND_API_KEY status:', resendApiKey ? 'Set' : 'Not Set');

    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set in environment variables.');
      throw new Error('RESEND_API_KEY is not set in environment variables. Cannot send email.');
    }

    const listingLink = `https://incontridolci.com/listing/${listingId}`; // Adjust domain as needed

    const emailHtml = `
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="font-size: 24px; font-weight: bold; color: #E54A70; margin: 0;">❤️ Incontri Dolci</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p>Ciao Team di Supporto,</p>
      <p>È stata inviata una segnalazione per l'annuncio:</p>
      <ul>
        <li><strong>Titolo:</strong> ${listing.title}</li>
        <li><strong>ID Annuncio:</strong> ${listingId}</li>
        <li><strong>Link Annuncio:</strong> <a href="${listingLink}" style="color: #E54A70; text-decoration: underline;">${listingLink}</a></li>
        <li><strong>Email del Segnalatore:</strong> ${reporterEmail}</li>
      </ul>
      <p><strong>Messaggio di Segnalazione:</strong></p>
      <p style="white-space: pre-wrap; border: 1px solid #eee; padding: 15px; border-radius: 8px; background-color: #f9f9f9;">${reportMessage}</p>

      <div style="border: 1px solid #eee; padding: 15px; margin-top: 30px; border-radius: 8px; background-color: #f9f9f9;">
        <p style="font-size: 14px; color: #555; text-align: center; margin: 0;">
          Questo è un messaggio automatico. Non rispondere a questa email.
        </p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <div style="text-align: center;">
        <a href="https://incontridolci.com/termini" style="color: #E54A70; text-decoration: underline; margin: 0 10px;">Termini e Condizioni</a>
        <a href="https://incontridolci.com/privacy" style="color: #E54A70; text-decoration: underline; margin: 0 10px;">Privacy Policy</a>
        <a href="https://incontridolci.com/contatti" style="color: #E54A70; text-decoration: underline; margin: 0 10px;">Contatti</a>
      </div>
    `;

    console.log('Attempting to send email via Resend...');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Incontri Dolci <onboarding@resend.dev>', // Sender email
        to: ['support@incontridolci.com'], // Recipient email for support
        subject: `Segnalazione Annuncio: ${listing.title} (ID: ${listingId})`,
        html: emailHtml,
        reply_to: reporterEmail, // Allow support to reply directly to the reporter
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Resend API Error:', res.status, errorData);
      throw new Error(`Failed to send email via Resend: ${errorData.message || JSON.stringify(errorData)}`);
    }

    console.log('Email sent successfully.');
    return new Response(JSON.stringify({ success: true, message: 'Report sent successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})