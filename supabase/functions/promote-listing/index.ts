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

    // Verify the listing belongs to the user
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select('user_id')
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

    // Use the service role key for the actual update to bypass RLS for atomic transaction
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate new expiry date based on durationHours received
    const newExpiryDate = new Date();
    newExpiryDate.setHours(newExpiryDate.getHours() + durationHours);

    // Update listing to premium, set promotion_mode and last_bumped_at
    const { error: updateListingError } = await supabaseAdmin
      .from('listings')
      .update({ 
        is_premium: true,
        promotion_mode: promotionType,
        last_bumped_at: new Date().toISOString(), // Set current time as last bumped
        expires_at: newExpiryDate.toISOString(), // Extend expiry date
      })
      .eq('id', listingId);

    if (updateListingError) {
      throw new Error(`Failed to update listing to premium: ${updateListingError.message}`);
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