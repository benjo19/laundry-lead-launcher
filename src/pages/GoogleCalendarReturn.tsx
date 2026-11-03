import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CONNECTOR_ID = 'google_calendar';

export default function GoogleCalendarReturn() {
  const [message, setMessage] = useState('Dovršavam povezivanje s Google kalendarom…');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Keep the window open on failure so the reason stays readable.
    const fail = (reason: string) => {
      setMessage(reason);
      window.opener?.postMessage({ type: 'appUserConnectorOAuthFailed', connectorId: CONNECTOR_ID, reason }, window.location.origin);
    };
    if (params.get('success') !== 'true') {
      fail(`Google prijava nije dovršena${params.get('error') ? `: ${params.get('error')}` : '.'}`);
      return;
    }
    const code = params.get('code');
    if (!code) {
      if (params.get('offline_access_allowed') === 'false') {
        fail('Veza se ne može koristiti: administrator mora uključiti offline pristup na Google Calendar klijentu u postavkama radnog prostora (App User Connectors).');
        return;
      }
      fail('Google nije vratio kod za povezivanje.');
      return;
    }
    if (window.opener) {
      // The CRM window holds the session and finishes the connection.
      window.opener.postMessage({ type: 'appUserConnectorOAuthCode', connectorId: CONNECTOR_ID, code }, window.location.origin);
      return;
    }
    void supabase.functions.invoke('google-calendar', { body: { action: 'complete', code } })
      .then(({ error }) => { if (error) throw error; setMessage('Google kalendar je povezan. Možeš zatvoriti ovaj prozor.'); })
      .catch(() => setMessage('Povezivanje nije dovršeno. Prijavi se u CRM u ovom pregledniku i pokušaj ponovno.'));
  }, []);

  return <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">{message}</div>;
}
