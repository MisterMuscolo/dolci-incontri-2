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
    const { ticketId, messageContent } = await req.json();

    if (!ticketId || !messageContent) {
      throw new Error('Missing required fields: ticketId, messageContent');
    }

    // Create a Supabase client with the user's JWT for RLS checks
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Verify user has access to this ticket (via RLS on tickets table)
    const { data: ticket, error: ticketFetchError } = await supabaseClient
      .from('tickets')
      .select('id, user_id, subject, status') // Added 'subject' for notification message
      .eq('id', ticketId)
      .single();

    if (ticketFetchError || !ticket) {
      throw new Error('Ticket not found or you do not have permission to access it.');
    }

    // Determine sender role (user or admin/supporto)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found.');
    }

    // MODIFICA QUI: Salva il ruolo esatto ('admin' o 'supporto')
    let senderRole: 'user' | 'admin' | 'supporto';
    if (profile.role === 'admin') {
        senderRole = 'admin';
    } else if (profile.role === 'supporto') {
        senderRole = 'supporto';
    } else {
        senderRole = 'user';
    }

    console.log(`add-ticket-message: User ID: ${user.id}, Profile Role: ${profile.role}, Determined Sender Role: ${senderRole}`);


    // Insert new message
    const { error: messageError } = await supabaseClient
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        message_content: messageContent,
      });

    if (messageError) {
      throw new Error(`Failed to add message: ${messageError.message}`);
    }

    // Update ticket's updated_at and last_replied_by
    const { error: updateTicketError } = await supabaseClient
      .from('tickets')
      .update({
        updated_at: new Date().toISOString(),
        last_replied_by: senderRole,
        status: (senderRole !== 'user' && ticket.status === 'open') ? 'in_progress' : ticket.status 
      })
      .eq('id', ticketId);

    if (updateTicketError) {
      console.error('Failed to update ticket status/timestamp:', updateTicketError.message);
    }

    // Insert notification based on sender role
    const supabaseAdmin = createClient( // Create admin client here
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (senderRole !== 'user') { // Admin or Supporto replied: notify the user who owns the ticket
        const { error: userNotificationError } = await supabaseAdmin
            .from('admin_notifications')
            .insert({
                type: 'ticket_reply',
                entity_id: ticketId,
                message: `L'amministratore ha risposto al tuo ticket: ${ticket.subject}`,
                user_id: ticket.user_id, // Associate with the user
            });
        if (userNotificationError) {
            console.error('Failed to insert user notification for admin reply:', userNotificationError.message);
        }
    } else { // senderRole === 'user'
        // User replied: notify admin
        const { error: adminNotificationError } = await supabaseAdmin
            .from('admin_notifications')
            .insert({
                type: 'ticket_reply',
                entity_id: ticketId,
                message: `Nuova risposta utente nel ticket: ${ticket.subject}`,
                user_id: null, // Null for admin-specific notifications
            });
        if (adminNotificationError) {
            console.error('Failed to insert admin notification for user reply:', adminNotificationError.message);
        }
    }

    return new Response(JSON.stringify({ success: true, message: 'Message added successfully.' }), {
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