import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck2, CalendarX2, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { GoogleCalendarStatus } from '@/hooks/useGoogleCalendar';

interface Props {
  status: GoogleCalendarStatus | null;
  checking: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onPull: () => Promise<void>;
}

const GoogleCalendarConnectCard = ({ status, checking, onConnect, onDisconnect, onPull }: Props) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>, ok?: string) => {
    setBusy(true);
    try { await fn(); if (ok) toast({ title: ok }); }
    catch (e) { toast({ title: 'Google Calendar', description: (e as Error).message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const connected = !!status?.connected;
  const notConfigured = status && !status.configured;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-start gap-3">
          {connected ? <CalendarCheck2 className="mt-0.5 h-5 w-5 text-primary" /> : <CalendarX2 className="mt-0.5 h-5 w-5 text-muted-foreground" />}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">Google Calendar</p>
              {checking && !status ? <Badge variant="outline">Provjeravam…</Badge>
                : connected ? <Badge>Povezano{status?.calendar?.summary ? ` · ${status.calendar.summary}` : ''}</Badge>
                : <Badge variant="outline">Nije povezano</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {connected ? 'Novi, izmijenjeni i otkazani termini sinkroniziraju se s tvojim kalendarom (Europe/Zagreb). Pozivnice se ne šalju.'
                : status?.reconnectRequired ? 'Google pristup je istekao — ponovno poveži kalendar.'
                : notConfigured ? 'Integracija još nije postavljena u radnom prostoru. Termini se spremaju samo u CRM.'
                : 'Termini se spremaju u CRM. Poveži Google za automatsku sinkronizaciju.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {connected && <Button variant="outline" size="sm" disabled={busy} onClick={() => run(onPull)} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Povuci promjene iz Googlea</Button>}
          {connected
            ? <Button variant="ghost" size="sm" disabled={busy} onClick={() => run(onDisconnect, 'Google Calendar odspojen')}>Odspoji</Button>
            : <Button size="sm" disabled={busy || !!notConfigured} onClick={() => run(onConnect, status?.reconnectRequired ? 'Ponovno povezano s Google kalendarom' : 'Povezano s Google kalendarom')}>
                {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}{status?.reconnectRequired ? 'Ponovno poveži' : 'Poveži Google Calendar'}
              </Button>}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarConnectCard;
