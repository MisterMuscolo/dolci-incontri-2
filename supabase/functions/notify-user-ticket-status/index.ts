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
    const { ticketId, newStatus, userId, ticketSubject } = await req.json(); // userId can now be null

    if (!ticketId || !newStatus || !ticketSubject) { // userId is now optional
      throw new Error('Missing required fields: ticketId, newStatus, ticketSubject');
    }

    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert notification for the user
    const { error: notificationError } = await supabaseAdmin
      .from('admin_notifications')
      .insert({
        type: 'ticket_resolved', // New type for resolved tickets
        entity_id: ticketId,
        message: `Il tuo ticket "${ticketSubject}" è stato risolto.`,
        user_id: userId, // Notify the specific user (can be null)
      });

    if (notificationError) {
      console.error('Failed to insert user notification for ticket status change:', notificationError.message);
      throw new Error('Failed to send notification to user.');
    }

    return new Response(JSON.stringify({ success: true, message: 'User notified successfully.' }), {
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