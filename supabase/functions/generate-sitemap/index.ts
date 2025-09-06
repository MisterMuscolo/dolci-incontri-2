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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: listings, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('id, last_bumped_at, created_at')
      .gt('expires_at', new Date().toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch listings for sitemap: ${fetchError.message}`);
    }

    const baseUrl = 'https://incontridolci.it';
    const sitemapEntries: string[] = [];
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Static URLs
    sitemapEntries.push(`  <url><loc>${baseUrl}/</loc><lastmod>${currentDate}</lastmod><priority>1.0</priority></url>`);
    sitemapEntries.push(`  <url><loc>${baseUrl}/search</loc><lastmod>${currentDate}</lastmod><priority>0.8</priority></url>`);
    sitemapEntries.push(`  <url><loc>${baseUrl}/termini</loc><lastmod>${currentDate}</lastmod><priority>0.6</priority></url>`);
    sitemapEntries.push(`  <url><loc>${baseUrl}/privacy</loc><lastmod>${currentDate}</lastmod><priority>0.6</priority></url>`);

    // Dynamic listing URLs
    listings.forEach((listing) => {
      const lastModDate = listing.last_bumped_at || listing.created_at;
      const formattedLastMod = new Date(lastModDate).toISOString().split('T')[0];
      sitemapEntries.push(`  <url><loc>${baseUrl}/listing/${listing.id}</loc><lastmod>${formattedLastMod}</lastmod><priority>0.7</priority></url>`);
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('\n')}
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