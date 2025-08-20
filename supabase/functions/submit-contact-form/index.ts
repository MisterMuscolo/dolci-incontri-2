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
    const { name, email, subject, message } = await req.json();

    if (!email || !message) {
      throw new Error('Missing required fields: email, message');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current user ID if authenticated
    let userId = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    // Insert message into contact_messages table
    const { error: insertError } = await supabaseAdmin
      .from('contact_messages')
      .insert({
        user_id: userId,
        name: name || 'Anonimo',
        email: email,
        subject: subject || 'Nessun oggetto',
        message: message,
        status: 'pending',
      });

    if (insertError) {
      console.error('Error inserting contact message:', insertError.message);
      throw new Error(`Failed to save contact message: ${insertError.message}`);
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const adminEmail = Deno.env.get('ADMIN_CONTACT_EMAIL') || 'admin@incontridolci.com'; // Use a configurable admin email

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not set. Email notification will not be sent.');
    } else {
      const emailHtml = `
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="font-size: 24px; font-weight: bold; color: #E54A70; margin: 0;">❤️ Incontri Dolci</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p>Ciao Team di Supporto,</p>
        <p>Hai ricevuto un nuovo messaggio dal form di contatto:</p>
        <ul>
          <li><strong>Nome:</strong> ${name || 'N/D'}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Oggetto:</strong> ${subject || 'N/D'}</li>
        </ul>
        <p><strong>Messaggio:</strong></p>
        <p style="white-space: pre-wrap; border: 1px solid #eee; padding: 15px; border-radius: 8px; background-color: #f9f9f9;">${message}</p>

        <div style="border: 1px solid #eee; padding: 15px; margin-top: 30px; border-radius: 8px; background-color: #f9f9f9;">
          <p style="font-size: 14px; color: #555; text-align: center; margin: 0;">
            Questo è un messaggio automatico. Rispondi direttamente all'email del mittente.
          </p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <div style="text-align: center;">
          <a href="https://incontridolci.com/termini" style="color: #E54A70; text-decoration: underline; margin: 0 10px;">Termini e Condizioni</a>
          <a href="https://incontridolci.com/privacy" style="color: #E54A70; text-decoration: underline; margin: 0 10px;">Privacy Policy</a>
          <a href="https://incontridolci.com/contatti" style="color: #E54A70; text-decoration: underline; margin: 0 10px;">Contatti</a>
        </div>
      `;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Incontri Dolci <onboarding@resend.dev>',
          to: [adminEmail],
          subject: `Nuovo messaggio di contatto da ${email}`,
          html: emailHtml,
          reply_to: email, // Allow admin to reply directly to the sender
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Resend API Error sending contact form notification:', errorData);
        // Do not throw error here, as the message is already saved in DB
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Contact message submitted successfully.' }), {
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