import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from 'npm:resend@3.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listingId, senderEmail, messageContent } = await req.json();
    console.log('Received payload for send-listing-reply-email:', { listingId, senderEmail, messageContent }); // Log del payload ricevuto

    if (!listingId) {
      throw new Error('Missing required field: listingId');
    }
    if (!senderEmail) {
      throw new Error('Missing required field: senderEmail');
    }
    if (!messageContent) {
      throw new Error('Missing required field: messageContent');
    }

    // Use the service role key to fetch listing details, bypassing RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('title, email')
      .eq('id', listingId)
      .single();

    if (listingError || !listing || !listing.email) {
      console.error('Error fetching listing details in Edge Function:', listingError?.message); // Log dell'errore di fetching
      throw new Error('Listing not found or creator email not available.');
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { data, error: resendError } = await resend.emails.send({
      from: 'Incontri Dolci <noreply@incontridolci.com>', // Replace with your verified Resend domain
      to: [listing.email],
      reply_to: senderEmail, // Set reply-to to the sender's email
      subject: `Nuova risposta al tuo annuncio: "${listing.title}"`,
      html: `
        <p>Ciao,</p>
        <p>Hai ricevuto una nuova risposta al tuo annuncio "${listing.title}" da parte di ${senderEmail}.</p>
        <p><strong>Messaggio:</strong></p>
        <p>${messageContent.replace(/\n/g, '<br>')}</p>
        <p>Puoi rispondere direttamente a questa email per contattare l'utente.</p>
        <p>Grazie,<br>Il team di Incontri Dolci</p>
      `,
    });

    if (resendError) {
      console.error('Error sending email via Resend in Edge Function:', resendError); // Log dell'errore di Resend
      throw new Error(`Failed to send email: ${resendError.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Email sent successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function caught error:', error.message); // Log dell'errore catturato
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});