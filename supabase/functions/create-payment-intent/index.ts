import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@16.0.0?target=deno&deno-std=0.190.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define credit packages (ideally fetched from DB for dynamic pricing)
const creditPackages = [
  { id: 'mini', name: 'Mini', credits: 20, price: 4.99 },
  { id: 'base', name: 'Base', credits: 50, price: 11.99 },
  { id: 'popolare', name: 'Popolare', credits: 110, price: 24.99 },
  { id: 'avanzato', name: 'Avanzato', credits: 240, price: 49.99 },
  { id: 'pro', name: 'Pro', credits: 500, price: 99.99 },
  { id: 'dominatore', name: 'Dominatore', credits: 1200, price: 199.99 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packageId } = await req.json();

    if (!packageId) {
      throw new Error('Missing packageId');
    }

    const selectedPackage = creditPackages.find(pkg => pkg.id === packageId);

    if (!selectedPackage) {
      throw new Error('Invalid packageId');
    }

    const amountInCents = Math.round(selectedPackage.price * 100); // Stripe expects amount in cents

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      metadata: {
        packageId: selectedPackage.id,
        credits: selectedPackage.credits,
        packageName: selectedPackage.name,
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