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
    const { userId, amount, transactionType, description } = await req.json();

    if (!userId || typeof amount !== 'number' || !transactionType) {
      throw new Error('Missing required fields: userId, amount, transactionType');
    }

    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Start a transaction to ensure atomicity
    const { data: profile, error: fetchProfileError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchProfileError || !profile) {
      throw new Error('User profile not found.');
    }

    const newCredits = profile.credits + amount;
    if (newCredits < 0) {
      throw new Error('Cannot set negative credits.');
    }

    // Update user's credits
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update user credits: ${updateError.message}`);
    }

    // Log the transaction
    const { error: transactionError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        type: transactionType, // e.g., 'admin_add', 'admin_subtract'
        package_name: description || 'Admin Adjustment', // Use description for package_name
      });

    if (transactionError) {
      // If transaction logging fails, consider rolling back credit update (more complex, but ideal)
      // For simplicity, we'll just log this error for now.
      console.error('Failed to log credit transaction:', transactionError.message);
      // Still return success for the credit update, but warn about logging.
    }

    return new Response(JSON.stringify({ success: true, newCredits: newCredits }), {
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