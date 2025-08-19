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

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('email, title')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      throw new Error('Listing not found or could not retrieve author email.');
    }
    
    const toEmail = listing.email;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not set in environment variables. Cannot send email.');
    }

    const listingLink = `https://dolciincontri.it/listing/${listingId}`;

    const emailHtml = `
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="font-size: 24px; font-weight: bold; color: #E54A70; margin: 0;">❤️ Dolci Incontri</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      Ciao ${fromEmail},<br><br>
      Ho visto il tuo annuncio su Dolci Incontri:<br>
      <a href="${listingLink}" style="color: #E54A70; text-decoration: underline;">${listing.title}</a><br><br>
      Vorrei chiederti:<br>
      <p style="white-space: pre-wrap; margin: 0;">${message}</p><br>
      A presto su Dolci Incontri!
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Dolci Incontri <onboarding@resend.dev>',
        to: [toEmail],
        subject: `Nuova risposta per il tuo annuncio: "${listing.title}"`,
        html: emailHtml,
        reply_to: fromEmail,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Resend API Error:', errorData);
      throw new Error('Failed to send email via Resend.');
    }

    return new Response(JSON.stringify({ success: true, message: 'Reply sent successfully.' }), {
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