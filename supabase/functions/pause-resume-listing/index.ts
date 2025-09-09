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
    const { listingId, action } = await req.json();

    if (!listingId || !action || !['pause', 'resume'].includes(action)) {
      throw new Error('Missing required fields: listingId, action (must be "pause" or "resume")');
    }

    // Create a Supabase client with the user's JWT for RLS checks
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No user session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Verify the listing belongs to the user
    const { data: listing, error: listingFetchError } = await supabaseClient
      .from('listings')
      .select('user_id, expires_at, promotion_start_at, promotion_end_at, is_paused, remaining_expires_at_duration, remaining_promotion_duration')
      .eq('id', listingId)
      .single();

    if (listingFetchError || !listing) {
      throw new Error('Listing not found or you do not have permission to manage it.');
    }

    if (listing.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden: You do not own this listing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Use the service role key for the actual update to bypass RLS for atomic transaction
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let updateData: any = {};
    const now = new Date();

    if (action === 'pause') {
      if (listing.is_paused) {
        return new Response(JSON.stringify({ success: true, message: 'Listing is already paused.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Calculate remaining durations
      const expiresAtDate = new Date(listing.expires_at);
      const remainingExpiresAtDuration = expiresAtDate.getTime() - now.getTime(); // in milliseconds

      updateData = {
        is_paused: true,
        paused_at: now.toISOString(),
        remaining_expires_at_duration: `${remainingExpiresAtDuration} milliseconds`,
        expires_at: null, // Set expires_at to null when paused
      };

      if (listing.promotion_start_at && listing.promotion_end_at) {
        const promoEndDate = new Date(listing.promotion_end_at);
        const remainingPromotionDuration = promoEndDate.getTime() - now.getTime(); // in milliseconds
        
        updateData = {
          ...updateData,
          remaining_promotion_duration: `${remainingPromotionDuration} milliseconds`,
          promotion_start_at: null, // Clear promotion times when paused
          promotion_end_at: null,
        };
      }

    } else if (action === 'resume') {
      if (!listing.is_paused) {
        return new Response(JSON.stringify({ success: true, message: 'Listing is not paused.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Restore expires_at
      const restoredExpiresAt = new Date(now.getTime() + parseIntervalToMilliseconds(listing.remaining_expires_at_duration));
      updateData = {
        is_paused: false,
        paused_at: null,
        expires_at: restoredExpiresAt.toISOString(),
        remaining_expires_at_duration: null,
      };

      // Restore promotion times if they existed
      if (listing.remaining_promotion_duration) {
        const restoredPromotionEnd = new Date(now.getTime() + parseIntervalToMilliseconds(listing.remaining_promotion_duration));
        updateData = {
          ...updateData,
          promotion_start_at: now.toISOString(), // Start promotion from now
          promotion_end_at: restoredPromotionEnd.toISOString(),
          remaining_promotion_duration: null,
        };
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update(updateData)
      .eq('id', listingId);

    if (updateError) {
      throw new Error(`Failed to ${action} listing: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: `Listing ${action}d successfully.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

// Helper function to parse interval string to milliseconds
function parseIntervalToMilliseconds(intervalString: string | null): number {
  if (!intervalString) return 0;

  const parts = intervalString.match(/(\d+)\s*(milliseconds|seconds|minutes|hours|days|weeks|months|years)/g);
  if (!parts) return 0;

  let totalMilliseconds = 0;
  for (const part of parts) {
    const [valueStr, unit] = part.split(/\s+/);
    const value = parseInt(valueStr);

    switch (unit) {
      case 'milliseconds':
        totalMilliseconds += value;
        break;
      case 'seconds':
        totalMilliseconds += value * 1000;
        break;
      case 'minutes':
        totalMilliseconds += value * 1000 * 60;
        break;
      case 'hours':
        totalMilliseconds += value * 1000 * 60 * 60;
        break;
      case 'days':
        totalMilliseconds += value * 1000 * 60 * 60 * 24;
        break;
      case 'weeks':
        totalMilliseconds += value * 1000 * 60 * 60 * 24 * 7;
        break;
      case 'months':
        totalMilliseconds += value * 1000 * 60 * 60 * 24 * 30; // Approximation
        break;
      case 'years':
        totalMilliseconds += value * 1000 * 60 * 60 * 24 * 365; // Approximation
        break;
    }
  }
  return totalMilliseconds;
}