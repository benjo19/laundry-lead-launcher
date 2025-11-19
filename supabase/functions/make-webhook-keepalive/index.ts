import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { Resend } from "npm:resend@2.0.0";

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

interface FailedWebhook {
  user_id: string;
  webhook_name: string;
  webhook_url: string;
  error: string;
}

async function sendAdminNotification(supabase: any, failedWebhooks: FailedWebhook[]) {
  try {
    console.log('📧 Preparing admin notification for webhook failures...');

    // Get all admin users
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'super_admin');

    if (adminError || !adminRoles || adminRoles.length === 0) {
      console.log('⚠️ No admin users found or error fetching admins:', adminError);
      return;
    }

    // Get admin profiles with emails
    const adminUserIds = adminRoles.map((role: any) => role.user_id);
    const { data: adminProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .in('id', adminUserIds);

    if (profileError || !adminProfiles || adminProfiles.length === 0) {
      console.log('⚠️ No admin profiles found:', profileError);
      return;
    }

    const adminEmails = adminProfiles
      .map((profile: any) => profile.email)
      .filter((email: string) => email);

    if (adminEmails.length === 0) {
      console.log('⚠️ No admin emails found');
      return;
    }

    console.log(`📧 Sending failure notification to ${adminEmails.length} admin(s): ${adminEmails.join(', ')}`);

    // Prepare email content
    const failureDetails = failedWebhooks
      .map((fw) => `
        <li style="margin-bottom: 15px; padding: 10px; background-color: #fff; border-radius: 4px;">
          <strong>User ID:</strong> <code>${fw.user_id}</code><br/>
          <strong>Webhook:</strong> ${fw.webhook_name}<br/>
          <strong>URL:</strong> <code style="word-break: break-all;">${fw.webhook_url}</code><br/>
          <strong>Greška:</strong> <span style="color: #d32f2f;">${fw.error}</span>
        </li>
      `)
      .join('');

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0;">⚠️ Make.com Webhook Keepalive Greške</h2>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Automatski keepalive sustav je naišao na greške prilikom slanja heartbeat poruka sljedećim webhookovima:</p>
            <ul style="list-style: none; padding: 0;">
              ${failureDetails}
            </ul>
            <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
              <strong>📊 Sažetak:</strong><br/>
              <strong>Ukupno neuspjelih webhookova:</strong> ${failedWebhooks.length}<br/>
              <strong>Vrijeme:</strong> ${new Date().toLocaleString('hr-HR', { timeZone: 'Europe/Zagreb' })}
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
            <p style="font-size: 12px; color: #666;">
              Ovo je automatska obavijest iz Marketing Agent aplikacije. 
              Molimo provjerite konfigurirane korisničke račune i webhook postavke.
            </p>
            <p style="font-size: 12px; color: #666;">
              <strong>Napomena:</strong> Webhookovi koji ne prime poruke u zadnjih 30 dana mogu biti automatski deaktivirani od strane Make.com.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured, cannot send admin notification');
      return;
    }

    const resend = new Resend(resendApiKey);
    
    const { data, error } = await resend.emails.send({
      from: 'Marketing Agent <onboarding@resend.dev>',
      to: adminEmails,
      subject: '⚠️ Make.com Webhook Keepalive - Neuspjele poruke',
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Error sending admin notification email:', error);
    } else {
      console.log('✅ Admin notification email sent successfully:', data);
    }
  } catch (error) {
    console.error('❌ Error in sendAdminNotification:', error);
  }
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

    // Prepare unified heartbeat payload
    const heartbeatPayload = {
      event_type: 'keepalive',
      timestamp: new Date().toISOString(),
      user_id: null, // Will be set per user in the loop
      test: false,
      data: {
        message: 'Automatic heartbeat to keep webhook active',
        info: 'This is an automated ping to prevent webhook deactivation. No action needed.',
        source: 'automated_keepalive_system'
      },
      schema: {
        message: 'string',
        info: 'string',
        source: 'string'
      }
    };

    let totalWebhooksSent = 0;
    let successCount = 0;
    let errorCount = 0;
    const failedWebhooks: FailedWebhook[] = [];

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

          // Customize payload for this specific user
          const userHeartbeat = {
            ...heartbeatPayload,
            user_id: setting.user_id
          };

          const response = await fetch(webhook.url!, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userHeartbeat),
          });

          if (response.ok || response.status === 0) { // status 0 is ok for no-cors
            successCount++;
            console.log(`✅ Heartbeat sent successfully to ${webhook.name}`);
          } else {
            errorCount++;
            const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            console.log(`⚠️ Webhook ${webhook.name} responded with status: ${response.status}`);
            failedWebhooks.push({
              user_id: setting.user_id,
              webhook_name: webhook.name,
              webhook_url: webhook.url!,
              error: errorMsg
            });
          }
        } catch (error) {
          errorCount++;
          const errorMsg = error.message || 'Unknown error';
          console.error(`❌ Error sending to ${webhook.name}:`, error);
          failedWebhooks.push({
            user_id: setting.user_id,
            webhook_name: webhook.name,
            webhook_url: webhook.url!,
            error: errorMsg
          });
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

    console.log('📊 Keepalive job completed:', summary);

    // Send notification to admins if there were any failures
    if (failedWebhooks.length > 0) {
      console.log(`⚠️ Detected ${failedWebhooks.length} failed webhook(s), sending admin notification...`);
      await sendAdminNotification(supabase, failedWebhooks);
    } else {
      console.log('✅ No failures detected, skipping admin notification');
    }

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
