import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StoreTokenRequest {
  provider: string;
  access_token: string;
  refresh_token?: string;
  token_email: string;
  expires_at?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const body: StoreTokenRequest = await req.json();
    const { provider, access_token, refresh_token, token_email, expires_at } = body;

    // Validate input
    if (!provider || !access_token || !token_email) {
      throw new Error('Missing required fields: provider, access_token, token_email');
    }

    if (!['google', 'outlook'].includes(provider)) {
      throw new Error('Invalid provider. Must be google or outlook');
    }

    console.log(`Storing OAuth token for user ${user.id}, provider ${provider}`);

    // Create admin client to store tokens (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Upsert token into oauth_tokens table
    const { error: insertError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert(
        {
          user_id: user.id,
          provider,
          access_token,
          refresh_token,
          token_email,
          expires_at: expires_at ? new Date(expires_at).toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      );

    if (insertError) {
      console.error('Error storing OAuth token:', insertError);
      throw insertError;
    }

    console.log(`OAuth token stored successfully for user ${user.id}, provider ${provider}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'OAuth token stored securely' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in store-oauth-token:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 500,
      }
    );
  }
});
