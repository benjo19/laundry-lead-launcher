import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MakeSettings {
  webhook_url?: string;
  content_booster_webhook_url?: string;
  email_webhook_url?: string;
  crm_export_webhook_url?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting Make.com webhook keepalive job...');

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all user settings that have make_settings configured
    const { data: userSettings, error: fetchError } = await supabase
      .from('user_settings')
      .select('id, user_id, make_settings')
      .not('make_settings', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching user settings:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${userSettings?.length || 0} users with Make.com settings`);

    // Prepare heartbeat payload
    const heartbeatPayload = {
      event: 'keepalive',
      timestamp: new Date().toISOString(),
      message: 'Automatic heartbeat to keep webhook active',
      info: 'This is an automated ping to prevent webhook deactivation. No action needed.'
    };

    let totalWebhooksSent = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process each user's webhooks
    for (const setting of userSettings || []) {
      const makeSettings = setting.make_settings as MakeSettings;
      if (!makeSettings) continue;

      const webhookUrls = [
        { name: 'General Webhook', url: makeSettings.webhook_url },
        { name: 'Content Booster', url: makeSettings.content_booster_webhook_url },
        { name: 'Email', url: makeSettings.email_webhook_url },
        { name: 'CRM Export', url: makeSettings.crm_export_webhook_url }
      ].filter(w => w.url); // Only process configured webhooks

      console.log(`👤 User ${setting.user_id}: Found ${webhookUrls.length} configured webhooks`);

      // Send heartbeat to each webhook
      for (const webhook of webhookUrls) {
        try {
          totalWebhooksSent++;
          console.log(`📤 Sending heartbeat to ${webhook.name}: ${webhook.url}`);

          const response = await fetch(webhook.url!, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(heartbeatPayload),
          });

          if (response.ok || response.status === 0) { // status 0 is ok for no-cors
            successCount++;
            console.log(`✅ Heartbeat sent successfully to ${webhook.name}`);
          } else {
            errorCount++;
            console.log(`⚠️ Webhook ${webhook.name} responded with status: ${response.status}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error sending to ${webhook.name}:`, error);
        }
      }
    }

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      total_webhooks_sent: totalWebhooksSent,
      success_count: successCount,
      error_count: errorCount,
      users_processed: userSettings?.length || 0
    };

    console.log('✅ Keepalive job completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Keepalive job failed:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
