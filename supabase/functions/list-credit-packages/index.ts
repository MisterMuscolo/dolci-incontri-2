import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@16.0.0?target=denonext'; // Modificato qui per compatibilità con Deno

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('list-credit-packages function invoked.'); // Added for debugging deployment issues

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Fetch all active products
    const products = await stripe.products.list({ active: true, limit: 100 });

    // Fetch all active prices
    const prices = await stripe.prices.list({ active: true, limit: 100, expand: ['product'] });

    const creditPackages = prices.data
      .filter(price => price.type === 'one_time' && price.currency === 'eur' && price.unit_amount !== null)
      .map(price => {
        const product = price.product as Stripe.Product; // Cast to Stripe.Product as it's expanded
        const credits = price.metadata?.credits ? parseInt(price.metadata.credits as string, 10) : 0;
        
        // Calculate original price for discount display if applicable
        let originalPrice: number | undefined;
        if (product.metadata?.original_price_per_credit && credits > 0) {
          originalPrice = parseFloat(product.metadata.original_price_per_credit as string) * credits;
        }

        return {
          id: price.id, // Use Stripe Price ID as the package ID
          name: product.name,
          credits: credits,
          price: price.unit_amount! / 100, // Convert cents to euros
          originalPrice: originalPrice,
          description: product.description || '',
          features: product.features?.map(f => f.name) || [],
          recommended: product.metadata?.recommended === 'true', // Check for 'recommended' metadata on product
        };
      })
      .sort((a, b) => a.credits - b.credits); // Sort by credits ascending

    return new Response(JSON.stringify(creditPackages), {
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