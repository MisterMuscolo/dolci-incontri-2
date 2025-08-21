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
    // Create a Supabase client with the service role key for admin operations
    // This bypasses RLS, allowing the function to delete any expired listing.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Find all expired listings
    const { data: expiredListings, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('id, title')
      .lt('expires_at', new Date().toISOString()); // Select listings where expires_at is in the past

    if (fetchError) {
      throw new Error(`Failed to fetch expired listings: ${fetchError.message}`);
    }

    if (!expiredListings || expiredListings.length === 0) {
      console.log('No expired listings found to delete.');
      return new Response(JSON.stringify({ message: 'No expired listings found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Found ${expiredListings.length} expired listings to delete.`);

    const deletionResults = await Promise.all(expiredListings.map(async (listing) => {
      try {
        // 2. Delete associated photos from Supabase Storage
        const { data: photos, error: photoListError } = await supabaseAdmin.storage
          .from('listing_photos')
          .list(`${listing.id}/`);

        if (photoListError) {
          console.warn(`Could not list photos for listing ${listing.id} (title: ${listing.title}): ${photoListError.message}`);
        } else if (photos && photos.length > 0) {
          const filePaths = photos.map(file => `${listing.id}/${file.name}`);
          const { error: deletePhotoError } = await supabaseAdmin.storage
            .from('listing_photos')
            .remove(filePaths);

          if (deletePhotoError) {
            console.warn(`Could not delete photos for listing ${listing.id} (title: ${listing.title}) from storage: ${deletePhotoError.message}`);
          } else {
            console.log(`Deleted ${photos.length} photos for listing ${listing.id} (title: ${listing.title}) from storage.`);
          }
        }

        // 3. Delete photo entries from the 'listing_photos' table
        const { error: dbPhotoDeleteError } = await supabaseAdmin
          .from('listing_photos')
          .delete()
          .eq('listing_id', listing.id);

        if (dbPhotoDeleteError) {
          console.warn(`Failed to delete photo records for listing ${listing.id} (title: ${listing.title}) from database: ${dbPhotoDeleteError.message}`);
        } else {
          console.log(`Deleted photo records for listing ${listing.id} (title: ${listing.title}) from database.`);
        }

        // 4. Delete the listing from the 'listings' table
        const { error: listingDeleteError } = await supabaseAdmin
          .from('listings')
          .delete()
          .eq('id', listing.id);

        if (listingDeleteError) {
          throw new Error(`Failed to delete listing ${listing.id} (title: ${listing.title}): ${listingDeleteError.message}`);
        }

        console.log(`Successfully deleted listing ${listing.id} (title: ${listing.title}) and its associated data.`);
        return { id: listing.id, title: listing.title, status: 'success' };
      } catch (deleteError: any) {
        console.error(`Error processing listing ${listing.id} (title: ${listing.title}): ${deleteError.message}`);
        return { id: listing.id, title: listing.title, status: 'failed', error: deleteError.message };
      }
    }));

    const successfulDeletions = deletionResults.filter(r => r.status === 'success');
    const failedDeletions = deletionResults.filter(r => r.status === 'failed');

    return new Response(JSON.stringify({
      message: `Deletion process completed. Successfully deleted ${successfulDeletions.length} listings. Failed to delete ${failedDeletions.length} listings.`,
      successfulDeletions,
      failedDeletions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Edge Function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});