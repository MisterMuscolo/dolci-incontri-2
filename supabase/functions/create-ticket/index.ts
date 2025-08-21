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
    const { listingId, subject, messageContent } = await req.json();

    if (!subject || !messageContent) {
      throw new Error('Missing required fields: subject, messageContent');
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

    // Insert new ticket
    const { data: newTicket, error: ticketError } = await supabaseClient
      .from('tickets')
      .insert({
        user_id: user.id,
        listing_id: listingId || null, // Will be null if it's a general contact
        subject: subject,
        status: 'open',
        last_replied_by: 'user', // User is the first to reply
      })
      .select('id')
      .single();

    if (ticketError || !newTicket) {
      throw new Error(`Failed to create ticket: ${ticketError?.message}`);
    }

    // Insert initial message
    const { error: messageError } = await supabaseClient
      .from('ticket_messages')
      .insert({
        ticket_id: newTicket.id,
        sender_id: user.id,
        message_content: messageContent,
      });

    if (messageError) {
      // If message insertion fails, consider rolling back ticket creation (more complex, but ideal)
      console.error('Failed to insert initial ticket message:', messageError.message);
      throw new Error('Ticket created, but failed to save initial message. Please contact support.');
    }

    // NEW: Insert notification for admin about new ticket
    const supabaseAdmin = createClient( // Create admin client here
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { error: notificationError } = await supabaseAdmin
        .from('admin_notifications')
        .insert({
            type: 'new_ticket', // New type for new tickets
            entity_id: newTicket.id,
            message: `Nuovo ticket aperto: ${subject}`,
        });
    if (notificationError) {
        console.error('Failed to insert new ticket notification:', notificationError.message);
    }

    return new Response(JSON.stringify({ success: true, ticketId: newTicket.id }), {
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