import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'npm:stripe@16.0.0'; // Modificato qui: ora usa npm:stripe

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packageId } = await req.json(); // packageId will now be the Stripe Price ID

    if (!packageId) {
      throw new Error('Missing packageId (Stripe Price ID)');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Retrieve the price object from Stripe
    const price = await stripe.prices.retrieve(packageId, { expand: ['product'] });

    if (!price || price.type !== 'one_time' || price.currency !== 'eur' || price.unit_amount === null) {
      throw new Error('Invalid or unsupported Stripe Price ID.');
    }

    const product = price.product as Stripe.Product; // Cast to Stripe.Product as it's expanded
    const credits = price.metadata?.credits ? parseInt(price.metadata.credits as string, 10) : 0;
    const packageName = product.name; // Use product name as package name

    const amountInCents = price.unit_amount; // Amount is already in cents from Stripe Price

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      metadata: {
        priceId: price.id, // Store Stripe Price ID
        credits: credits,
        packageName: packageName,
      },
    });

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
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