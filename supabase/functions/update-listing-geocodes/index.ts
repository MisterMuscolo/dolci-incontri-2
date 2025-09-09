import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the user's JWT for RLS checks
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user: callerUser } } = await supabaseClient.auth.getUser();

    if (!callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No user session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Check if the caller is an admin
    const { data: callerProfile, error: callerProfileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (callerProfileError || callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Only admins can trigger this function' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Use the service role key for the actual updates to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch all listings that do not have latitude or longitude set
    const { data: listingsToUpdate, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('id, city, zone')
      .or('latitude.is.null,longitude.is.null');

    if (fetchError) {
      throw new Error(`Failed to fetch listings to update: ${fetchError.message}`);
    }

    if (!listingsToUpdate || listingsToUpdate.length === 0) {
      return new Response(JSON.stringify({ message: 'No listings found requiring geocoding update.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Found ${listingsToUpdate.length} listings to geocode.`);

    const updatePromises = listingsToUpdate.map(async (listing) => {
      try {
        const address = listing.zone ? `${listing.zone}, ${listing.city}, Italy` : `${listing.city}, Italy`;
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

        const geoResponse = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'IncontriDolciApp/1.0 (contact@incontridolci.it)', // Important for Nominatim
          },
        });

        if (!geoResponse.ok) {
          throw new Error(`Geocoding API error for listing ${listing.id}: ${geoResponse.statusText}`);
        }

        const geoData = await geoResponse.json();

        if (geoData && geoData.length > 0) {
          const { lat, lon } = geoData[0];
          const { error: updateError } = await supabaseAdmin
            .from('listings')
            .update({
              latitude: parseFloat(lat),
              longitude: parseFloat(lon),
              address_text: address, // Store the full address text
            })
            .eq('id', listing.id);

          if (updateError) {
            throw new Error(`Failed to update geocodes for listing ${listing.id}: ${updateError.message}`);
          }
          return { id: listing.id, status: 'success' };
        } else {
          console.warn(`No coordinates found for listing ${listing.id} (city: ${listing.city}, zone: ${listing.zone}).`);
          return { id: listing.id, status: 'skipped', reason: 'No coordinates found' };
        }
      } catch (error: any) {
        console.error(`Error processing listing ${listing.id}: ${error.message}`);
        return { id: listing.id, status: 'failed', error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);

    const successfulUpdates = results.filter(r => r.status === 'success').length;
    const failedUpdates = results.filter(r => r.status === 'failed').length;
    const skippedUpdates = results.filter(r => r.status === 'skipped').length;

    return new Response(JSON.stringify({
      message: `Geocoding update completed. Successful: ${successfulUpdates}, Failed: ${failedUpdates}, Skipped: ${skippedUpdates}.`,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function update-listing-geocodes error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});