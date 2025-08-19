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
    const { listingId, promotionType, cost, durationHours, timeSlot } = await req.json();

    if (!listingId || !promotionType || typeof cost !== 'number' || typeof durationHours !== 'number') {
      throw new Error('Missing required fields: listingId, promotionType, cost, durationHours');
    }

    // Create a Supabase client with the user's JWT for RLS checks
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No user session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Verify the listing belongs to the user and get its current expires_at
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select('user_id, expires_at')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      throw new Error('Listing not found or you do not have permission to promote it.');
    }

    if (listing.user_id !== user.id) {
      throw new Error('You do not have permission to promote this listing.');
    }

    // Get user's current credits
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found.');
    }

    if (profile.credits < cost) {
      throw new Error(`Crediti insufficienti. Hai bisogno di ${cost} crediti.`);
    }

    // Calculate promotion start and end times
    const now = new Date(); // Current UTC time

    let promoStart: Date;
    let promoEnd: Date;

    if (promotionType === 'day') {
        const [startHourStr, startMinuteStr] = timeSlot.split('-')[0].split(':');
        const startHour = parseInt(startHourStr);
        const startMinute = parseInt(startMinuteStr);

        const targetTimeToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), startHour, startMinute, 0, 0));

        if (targetTimeToday.getTime() <= now.getTime()) {
            // If the selected time slot for today has already passed or is current, start promotion immediately
            promoStart = now;
        } else {
            // If the selected time slot is in the future today, schedule for that time
            promoStart = targetTimeToday;
        }
        promoEnd = new Date(promoStart.getTime() + durationHours * 60 * 60 * 1000);

    } else { // night mode
        const startHour = 23; // 23:00 UTC
        const startMinute = 0;
        promoStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), startHour, startMinute, 0, 0));
        if (promoStart.getTime() < now.getTime()) {
            // If 23:00 today has already passed, schedule for tomorrow
            promoStart.setUTCDate(promoStart.getUTCDate() + 1);
        }
        promoEnd = new Date(promoStart.getTime() + durationHours * 60 * 60 * 1000);
    }

    // Calculate new expires_at: max of current expiry or promoEnd, then add 30 days
    const currentExpiresAt = new Date(listing.expires_at);
    const newExpiresAt = new Date(Math.max(currentExpiresAt.getTime(), promoEnd.getTime()));
    newExpiresAt.setUTCDate(newExpiresAt.getUTCDate() + 30); // Add 30 days from the later of current expiry or promo end.


    // Use the service role key for the actual update to bypass RLS for atomic transaction
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update listing to premium, set promotion_mode, promotion_start_at, promotion_end_at and last_bumped_at
    const { error: updateListingError } = await supabaseAdmin
      .from('listings')
      .update({ 
        is_premium: true, // Flag that it's a premium listing
        promotion_mode: promotionType,
        promotion_start_at: promoStart.toISOString(),
        promotion_end_at: promoEnd.toISOString(),
        last_bumped_at: now.toISOString(), // Always bump to now when promotion is purchased
        expires_at: newExpiresAt.toISOString(), // Extend expiry date
      })
      .eq('id', listingId);

    if (updateListingError) {
      throw new Error(`Failed to update listing for promotion: ${updateListingError.message}`);
    }

    // Deduct credits
    const { error: updateCreditsError } = await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - cost })
      .eq('id', user.id);

    if (updateCreditsError) {
      console.error('Failed to deduct credits after promoting listing:', updateCreditsError.message);
      throw new Error('Failed to deduct credits. Please contact support.');
    }

    // Log the transaction
    let packageName = `Promozione: ${promotionType === 'day' ? 'Modalità Giorno' : 'Modalità Notte'} per ${durationHours / 24} giorni`;
    if (promotionType === 'day' && timeSlot) {
      packageName += ` (Fascia: ${timeSlot})`;
    }

    const { error: transactionError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: -cost,
        type: 'premium_upgrade',
        package_name: packageName,
      });

    if (transactionError) {
      console.error('Failed to log credit transaction for promotion:', transactionError.message);
    }

    return new Response(JSON.stringify({ success: true, message: 'Annuncio promosso con successo!' }), {
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