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
    const { listingId, senderEmail, messageContent, initialSubject } = await req.json();

    if (!senderEmail || !messageContent) {
      throw new Error('Missing required fields: senderEmail, messageContent');
    }

    // Create a Supabase client with the user's JWT for RLS checks (to get user ID if authenticated)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser();

    const ticketUserId = user ? user.id : null;
    const ticketReporterEmail = senderEmail; // Always use the email provided in the form

    let ticketSubject = initialSubject || `Nuova richiesta di supporto da ${senderEmail}`;

    // Use the service role key for the actual inserts to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (listingId) {
      // Fetch listing title using supabaseClient (user's RLS applies here)
      const { data: listingData, error: listingError } = await supabaseClient
        .from('listings')
        .select('title')
        .eq('id', listingId)
        .single();

      if (listingError || !listingData) {
        console.warn(`Could not fetch listing title for ID ${listingId}:`, listingError?.message);
        ticketSubject = `Richiesta annuncio (ID: ${listingId}) da ${senderEmail}`;
      } else {
        ticketSubject = `Richiesta annuncio: ${listingData.title} da ${senderEmail}`;
      }
    }

    // Insert new ticket using supabaseAdmin
    const { data: newTicket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        user_id: ticketUserId, // Can be null for unauthenticated users
        reporter_email: ticketReporterEmail, // Store the provided email
        listing_id: listingId || null,
        subject: ticketSubject, // Generated subject
        status: 'open',
        last_replied_by: user ? (user.id === ticketUserId ? 'user' : 'admin') : 'user', // If user is null, it's a guest user
      })
      .select('id')
      .single();

    if (ticketError || !newTicket) {
      throw new Error(`Failed to create ticket: ${ticketError?.message}`);
    }

    // Insert initial message using supabaseAdmin
    const { error: messageError } = await supabaseAdmin
      .from('ticket_messages')
      .insert({
        ticket_id: newTicket.id,
        sender_id: ticketUserId, // Can be null
        sender_email: ticketReporterEmail, // Store the provided email
        message_content: messageContent,
      });

    if (messageError) {
      console.error('Failed to insert initial ticket message:', messageError.message);
      throw new Error('Ticket created, but failed to save initial message. Please contact support.');
    }

    // Insert notification for admin about new ticket (already using supabaseAdmin)
    const { error: notificationError } = await supabaseAdmin
        .from('admin_notifications')
        .insert({
            type: 'new_ticket',
            entity_id: newTicket.id,
            message: `Nuovo ticket aperto: ${ticketSubject}`,
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