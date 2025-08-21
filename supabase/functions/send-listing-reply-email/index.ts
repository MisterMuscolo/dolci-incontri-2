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
    console.log('Received payload for send-listing-reply-email:', { listingId, senderEmail, messageContent });

    if (!listingId) {
      throw new Error('Missing required field: listingId');
    }
    if (!senderEmail) {
      throw new Error('Missing required field: senderEmail');
    }
    if (!messageContent) {
      throw new Error('Missing required field: messageContent');
    }

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
      console.error('Error fetching listing details in Edge Function:', listingError?.message);
      throw new Error('Listing not found or creator email not available.');
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { data, error: resendError } = await resend.emails.send({
      from: 'Incontri Dolci <noreply@incontridolci.it>',
      to: [listing.email],
      reply_to: senderEmail,
      subject: `Nuova risposta al tuo annuncio: "${listing.title}"`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 28px; font-weight: bold; color: #E54A70;">
              <span style="font-size: 32px;">❤️</span>
              <span>Incontri Dolci</span>
            </div>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

          <p>Ciao,</p>
          <p>Hai ricevuto una nuova risposta al tuo annuncio "<strong>${listing.title}</strong>" da parte di <strong>${senderEmail}</strong>.</p>
          <p style="font-weight: bold; margin-top: 20px;">Messaggio:</p>
          <div style="background-color: #f9f9f9; border-left: 4px solid #E54A70; padding: 15px; margin: 10px 0; border-radius: 4px;">
            <p style="margin: 0;">${messageContent.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="margin-top: 20px;">Puoi rispondere direttamente a questa email per contattare l'utente.</p>

          <div style="background-color: #f0f8ff; border: 1px solid #d0e8ff; padding: 20px; margin: 30px 0; text-align: center; border-radius: 8px;">
            <p style="font-size: 1.1em; font-weight: bold; color: #333;">Hai bisogno di assistenza?</p>
            <p style="margin-top: 10px; color: #555;">Non esitare a contattare il nostro team di supporto per qualsiasi domanda o problema.</p>
            </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

          <div style="text-align: center; margin-top: 20px;">
            <a href="https://incontridolci.it/termini" style="display: inline-block; background-color: #f0f0f0; color: #333; padding: 8px 15px; margin: 5px; text-decoration: none; border-radius: 5px; border: 1px solid #ddd;">Termini e Condizioni</a>
            <a href="https://incontridolci.it/privacy" style="display: inline-block; background-color: #f0f0f0; color: #333; padding: 8px 15px; margin: 5px; text-decoration: none; border-radius: 5px; border: 1px solid #ddd;">Privacy Policy</a>
          </div>

          <p style="text-align: center; font-size: 0.8em; color: #888; margin-top: 20px;">
            © ${new Date().getFullYear()} Incontri Dolci. Tutti i diritti riservati.
          </p>
        </div>
      `,
    });

    if (resendError) {
      console.error('Error sending email via Resend in Edge Function:', resendError);
      throw new Error(`Failed to send email: ${resendError.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Email sent successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function caught error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});