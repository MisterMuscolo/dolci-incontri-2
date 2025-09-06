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
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const listingId = pathSegments[pathSegments.length - 1]; // L'ultimo segmento è l'ID

    if (!listingId) {
      return new Response(JSON.stringify({ error: 'Missing listing ID' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .select('slug')
      .eq('id', listingId)
      .single();

    if (error || !listing || !listing.slug) {
      console.error(`Error fetching slug for listing ID ${listingId}:`, error?.message);
      // Se lo slug non viene trovato, reindirizza alla pagina di ricerca o a una 404 generica
      return new Response(null, {
        status: 302, // Temporary redirect to avoid caching bad links
        headers: {
          'Location': '/search', // O una pagina 404 specifica
          ...corsHeaders,
        },
      });
    }

    const newUrl = `${url.origin}/listing/${listing.slug}`;
    
    return new Response(null, {
      status: 301, // Permanent redirect
      headers: {
        'Location': newUrl,
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Edge Function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});