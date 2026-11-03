import { useCallback, useEffect, useState } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface GoogleCalendarStatus {
  configured: boolean;
  connected: boolean;
  reconnectRequired?: boolean;
  missing?: string[];
  calendar?: { summary?: string; timeZone?: string };
  error?: string;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string; reconnectRequired?: boolean };

async function invoke<T>(body: Record<string, unknown>): Promise<Result<T>> {
  const { data, error } = await supabase.functions.invoke('google-calendar', { body });
  if (!error) return { ok: true, data: data as T };
  let message = error.message;
  let reconnectRequired = false;
  if (error instanceof FunctionsHttpError) {
    try {
      const parsed = await error.context.json();
      message = parsed?.error ? (typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error)) : message;
      reconnectRequired = !!parsed?.reconnectRequired;
    } catch { /* keep generic message */ }
  }
  return { ok: false, error: message, reconnectRequired };
}

function waitForOAuthCompletion(popup: Window) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => { window.removeEventListener('message', onMessage); window.clearInterval(poll); };
    const onMessage = (event: MessageEvent) => {
      const type = event.data?.type;
      if (event.origin !== window.location.origin || event.source !== popup || event.data?.connectorId !== 'google_calendar'
        || (type !== 'appUserConnectorOAuthComplete' && type !== 'appUserConnectorOAuthFailed')) return;
      cleanup();
      if (type === 'appUserConnectorOAuthComplete') return resolve();
      popup.close();
      reject(new Error(event.data?.reason ?? 'Povezivanje s Googleom nije uspjelo.'));
    };
    window.addEventListener('message', onMessage);
    const poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error('Prozor za Google prijavu je zatvoren prije završetka.'));
    }, 500);
  });
}

export const useGoogleCalendar = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!user) return;
    setChecking(true);
    const res = await invoke<GoogleCalendarStatus>({ action: 'status' });
    setStatus(res.ok ? res.data : { configured: false, connected: false, error: res.error });
    setChecking(false);
  }, [user]);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  /** Must be called directly from a click handler (popup opens synchronously). */
  const connect = async (): Promise<void> => {
    const popup = window.open('', 'google-calendar-oauth', 'width=600,height=720');
    if (!popup) throw new Error('Preglednik je blokirao skočni prozor. Dopusti skočne prozore i pokušaj ponovno.');
    try {
      const res = await invoke<{ authorizationUrl: string }>({ action: 'start', origin: window.location.origin });
      if (!res.ok) throw new Error(res.error);
      const completion = waitForOAuthCompletion(popup);
      popup.location.href = res.data.authorizationUrl;
      await completion;
      await refreshStatus();
    } catch (e) {
      popup.close();
      throw e;
    }
  };

  const disconnect = async () => {
    const res = await invoke<{ ok: boolean }>({ action: 'disconnect' });
    if (!res.ok) throw new Error(res.error);
    await refreshStatus();
  };

  const syncReminder = (reminderId: string, op: 'upsert' | 'cancel') =>
    invoke<{ ok: boolean; sync_status: string; calendar_event_id?: string }>({ action: 'sync', reminder_id: reminderId, op });

  const pullChanges = () => invoke<{ checked: number; updated: number; cancelled: number }>({ action: 'pull' });

  return { status, checking, refreshStatus, connect, disconnect, syncReminder, pullChanges, isConnected: !!status?.connected };
};
