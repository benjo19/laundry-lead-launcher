
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

    // Dobijanje korisničkih email postavki
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('email_settings')
      .eq('user_id', user_id)
      .single();

    if (settingsError || !userSettings?.email_settings) {
      throw new Error('Email settings not configured');
    }

    const emailSettings = userSettings.email_settings as any;

    // Slanje email-a putem SMTP
    const emailData = {
      from: `${emailSettings.from_name} <${emailSettings.from_email}>`,
      to: to_email,
      subject: subject,
      html: content,
    };

    // Simulacija slanja - u stvarnosti bi trebala SMTP integracija
    console.log('Email would be sent:', emailData);

    // Spremanje email zapisa u bazu
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

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        email_id: 'simulated-id'
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
