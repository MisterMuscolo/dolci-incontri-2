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
    // This bypasses RLS, allowing the function to fetch all listings.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all active listing IDs and their last_bumped_at/created_at for lastmod
    const { data: listings, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('id, last_bumped_at, created_at')
      .gt('expires_at', new Date().toISOString()); // Only include active listings

    if (fetchError) {
      throw new Error(`Failed to fetch listings for sitemap: ${fetchError.message}`);
    }

    const baseUrl = 'https://incontridolci.it'; // Replace with your actual domain

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/termini</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.6</priority>
  </url>`;

    // Add dynamic listing URLs
    listings.forEach((listing) => {
      const lastModDate = listing.last_bumped_at || listing.created_at;
      sitemap += `
  <url>
    <loc>${baseUrl}/listing/${listing.id}</loc>
    <lastmod>${new Date(lastModDate).toISOString().split('T')[0]}</lastmod>
    <priority>0.7</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    return new Response(sitemap, {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
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