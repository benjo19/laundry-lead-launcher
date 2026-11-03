import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CONNECTOR_ID = 'google_calendar';

export default function GoogleCalendarReturn() {
  const [message, setMessage] = useState('Dovršavam povezivanje s Google kalendarom…');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (type: 'appUserConnectorOAuthComplete' | 'appUserConnectorOAuthFailed', reason?: string) => {
      window.opener?.postMessage({ type, connectorId: CONNECTOR_ID, reason }, window.location.origin);
      window.close();
    };
    if (params.get('success') !== 'true') {
      setMessage(params.get('error') ?? 'Google prijava nije dovršena.');
      notify('appUserConnectorOAuthFailed');
      return;
    }
    const code = params.get('code');
    if (!code) {
      if (params.get('offline_access_allowed') === 'false') {
        const reason = 'Veza se ne može koristiti: administrator mora uključiti offline pristup na Google Calendar klijentu u postavkama radnog prostora (App User Connectors).';
        setMessage(reason);
        window.opener?.postMessage({ type: 'appUserConnectorOAuthFailed', connectorId: CONNECTOR_ID, reason }, window.location.origin);
        return;
      }
      setMessage('Google nije vratio kod za povezivanje.');
      notify('appUserConnectorOAuthFailed');
      return;
    }
    void supabase.functions.invoke('google-calendar', { body: { action: 'complete', code } })
      .then(({ error }) => { if (error) throw error; notify('appUserConnectorOAuthComplete'); })
      .catch(() => { setMessage('Povezivanje nije dovršeno.'); notify('appUserConnectorOAuthFailed'); });
  }, []);

  return <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">{message}</div>;
}
