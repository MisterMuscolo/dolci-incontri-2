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
    const { newUserEmail } = await req.json();
    console.log('Received payload for send-admin-new-user-email:', { newUserEmail });

    if (!newUserEmail) {
      throw new Error('Missing required field: newUserEmail');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all admin and supporto emails
    const { data: adminProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .or('role.eq.admin,role.eq.supporto');

    if (profilesError) {
      console.error('Error fetching admin/support profiles:', profilesError.message);
      throw new Error('Failed to fetch admin/support emails.');
    }

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      console.warn('No admin or support emails found to send notification.');
      return new Response(JSON.stringify({ success: true, message: 'No admin/support emails found, skipping notification.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { data, error: resendError } = await resend.emails.send({
      from: 'IncontriDolci <noreply@incontridolci.it>',
      to: adminEmails,
      subject: `Nuova Registrazione Utente su IncontriDolci: ${newUserEmail}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 28px; font-weight: bold; color: #E54A70;">
              <span style="font-size: 32px;">❤️</span>
              <span>IncontriDolci</span>
            </div>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

          <p>Ciao Admin,</p>
          <p>Un nuovo utente si è appena registrato su IncontriDolci:</p>
          <p style="font-weight: bold; margin-top: 20px;">Dettagli Utente:</p>
          <div style="background-color: #f9f9f9; border-left: 4px solid #E54A70; padding: 15px; margin: 10px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>Email:</strong> ${newUserEmail}</p>
            <p style="margin: 0;"><strong>ID Utente:</strong> ${newUserEmail}</p> <!-- Placeholder, actual ID not passed here -->
          </div>
          <p style="margin-top: 20px;">Ti invitiamo a controllare il profilo utente nel pannello di controllo se necessario.</p>

          <div style="background-color: #f0f8ff; border: 1px solid #d0e8ff; padding: 20px; margin: 30px 0; text-align: center; border-radius: 8px;">
            <p style="font-size: 1.1em; font-weight: bold; color: #333;">Pannello di Controllo Admin</p>
            <p style="margin-top: 10px; color: #555;">Accedi per gestire utenti, annunci e segnalazioni.</p>
            <a href="https://incontridolci.it/admin" style="display: inline-block; background-color: #f0f0f0; color: #333; padding: 8px 15px; margin-top: 15px; text-decoration: none; border-radius: 5px; border: 1px solid #ddd;">Vai al Pannello Admin</a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

          <p style="text-align: center; font-size: 0.8em; color: #888; margin-top: 20px;">
            © ${new Date().getFullYear()} IncontriDolci. Tutti i diritti riservati.
          </p>
        </div>
      `,
    });

    if (resendError) {
      console.error('Error sending email via Resend in Edge Function:', resendError);
      throw new Error(`Failed to send email: ${resendError.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Admin notification email sent successfully!' }), {
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