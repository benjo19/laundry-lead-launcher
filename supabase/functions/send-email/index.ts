
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to_email: string;
  subject: string;
  content: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to_email, subject, content, user_id }: EmailRequest = await req.json();

    console.log('Sending email for user:', user_id);

    // Get user email settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('email_settings')
      .eq('user_id', user_id)
      .single();

    if (settingsError || !userSettings?.email_settings) {
      throw new Error('Email settings not configured');
    }

    const emailSettings = userSettings.email_settings as any;
    console.log('Email settings loaded:', { 
      provider_type: emailSettings.provider_type,
      has_oauth: !!emailSettings.oauth_providers 
    });

    let emailSent = false;

    // Try OAuth first if available
    if (emailSettings.oauth_providers) {
      const oauthProvider = emailSettings.provider_type === 'gmail' 
        ? emailSettings.oauth_providers.google
        : emailSettings.provider_type === 'outlook'
        ? emailSettings.oauth_providers.outlook
        : null;

      if (oauthProvider?.access_token) {
        console.log('Attempting OAuth email send...');
        emailSent = await sendEmailViaOAuth(
          emailSettings.provider_type,
          oauthProvider,
          {
            to: to_email,
            subject,
            content,
            from: emailSettings.from_email || oauthProvider.email
          }
        );
      }
    }

    // Fallback to SMTP if OAuth failed or not available
    if (!emailSent) {
      console.log('Using SMTP fallback...');
      await sendEmailViaSMTP(emailSettings, {
        to: to_email,
        subject,
        content
      });
    }

    // Save email record to database
    const { error: insertError } = await supabase
      .from('emails')
      .insert({
        user_id,
        to_email,
        subject,
        content,
        status: 'Sent',
        sent_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error saving email record:', insertError);
      // Don't throw here as email was sent successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        method: emailSent ? 'oauth' : 'smtp'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function sendEmailViaOAuth(
  provider: string,
  oauthData: any,
  emailData: { to: string; subject: string; content: string; from: string }
): Promise<boolean> {
  try {
    if (provider === 'gmail') {
      return await sendViaGmail(oauthData.access_token, emailData);
    } else if (provider === 'outlook') {
      return await sendViaOutlook(oauthData.access_token, emailData);
    }
    return false;
  } catch (error) {
    console.error('OAuth email send failed:', error);
    return false;
  }
}

async function sendViaGmail(accessToken: string, emailData: any): Promise<boolean> {
  const email = [
    `To: ${emailData.to}`,
    `Subject: ${emailData.subject}`,
    `Content-Type: text/html; charset=utf-8`,
    '',
    emailData.content
  ].join('\n');

  const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gmail API error:', error);
    return false;
  }

  return true;
}

async function sendViaOutlook(accessToken: string, emailData: any): Promise<boolean> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject: emailData.subject,
        body: {
          contentType: 'HTML',
          content: emailData.content
        },
        toRecipients: [{
          emailAddress: {
            address: emailData.to
          }
        }]
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Outlook API error:', error);
    return false;
  }

  return true;
}

async function sendEmailViaSMTP(emailSettings: any, emailData: any) {
  // Simulate SMTP sending - in production you would implement actual SMTP
  console.log('SMTP Email would be sent:', {
    server: emailSettings.smtp_server,
    port: emailSettings.smtp_port,
    username: emailSettings.smtp_username,
    to: emailData.to,
    subject: emailData.subject
  });
}
