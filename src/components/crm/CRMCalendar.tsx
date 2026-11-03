import { useMemo, useState } from 'react';
import {
  addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek,
} from 'date-fns';
import { hr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CloudOff, Cloud, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Reminder } from '@/types';
import { addMinutesLocal } from '@/lib/calendarTime';

type View = 'day' | 'week' | 'month';

export const EVENT_TYPE_LABEL: Record<string, string> = { meeting: 'Sastanak', call: 'Poziv', follow_up: 'Follow-up' };
export const PROJECTS = [
  { value: 'Orderly', label: 'Orderly' },
  { value: 'AutomindAI', label: 'Automind' },
  { value: 'Oprema praone', label: 'Praonice' },
];

const projectClass = (p?: string | null) =>
  p === 'Orderly' ? 'border-l-primary bg-primary/10'
  : p === 'AutomindAI' ? 'border-l-accent-foreground bg-accent'
  : p === 'Oprema praone' ? 'border-l-secondary-foreground bg-secondary'
  : 'border-l-muted-foreground bg-muted';

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

export const SyncIcon = ({ r }: { r: Reminder }) => {
  if (r.syncStatus === 'synced') return <Cloud className="h-3 w-3 shrink-0 text-primary" aria-label="Sinkronizirano s Googleom" />;
  if (r.syncStatus === 'pending') return <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-label="Sinkronizacija u tijeku" />;
  if (r.syncStatus === 'error') return <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" aria-label="Greška sinkronizacije" />;
  return <CloudOff className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Samo u CRM-u" />;
};

const EventChip = ({ r, onClick, detailed }: { r: Reminder; onClick: () => void; detailed?: boolean }) => {
  const end = addMinutesLocal(r.date, r.time || '00:00', r.durationMinutes || 60);
  return (
    <button type="button" onClick={onClick}
      className={cn('w-full rounded-md border-l-4 px-1.5 py-1 text-left text-xs transition-colors hover:brightness-95',
        projectClass(r.project), (r.status === 'Završen' || r.status === 'Otkazan') && 'opacity-50 line-through')}>
      <div className="flex items-center gap-1">
        {r.priority === 'Visok' && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" aria-label="Visok prioritet" />}
        <span className="font-semibold tabular-nums">{r.time}</span>
        <span className="truncate">{r.title}</span>
        <span className="ml-auto"><SyncIcon r={r} /></span>
      </div>
      {detailed && <div className="mt-0.5 truncate text-muted-foreground">{EVENT_TYPE_LABEL[r.eventType || 'follow_up']} · {r.company} · do {end.time}</div>}
    </button>
  );
};

interface Props { reminders: Reminder[]; onSelect: (r: Reminder) => void; onCreateAt: (date: string, time?: string) => void; }

const CRMCalendar = ({ reminders, onSelect, onCreateAt }: Props) => {
  const [view, setView] = useState<View>('week');
  const [cursor, setCursor] = useState(new Date());
  const today = ymd(new Date());

  const byDay = useMemo(() => {
    const m = new Map<string, Reminder[]>();
    for (const r of reminders) { if (!r.date) continue; (m.get(r.date) ?? m.set(r.date, []).get(r.date)!).push(r); }
    m.forEach(list => list.sort((a, b) => (a.time || '').localeCompare(b.time || '')));
    return m;
  }, [reminders]);

  const move = (dir: 1 | -1) => setCursor(c => view === 'day' ? addDays(c, dir) : view === 'week' ? addWeeks(c, dir) : addMonths(c, dir));
  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const title = view === 'day' ? format(cursor, 'EEEE, d. MMMM yyyy.', { locale: hr })
    : view === 'week' ? `${format(weekStart, 'd. MMM', { locale: hr })} – ${format(addDays(weekStart, 6), 'd. MMM yyyy.', { locale: hr })}`
    : format(cursor, 'LLLL yyyy.', { locale: hr });

  return (
    <Card>
      <CardContent className="space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => move(-1)} aria-label="Prethodno"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setCursor(new Date())}>Danas</Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => move(1)} aria-label="Sljedeće"><ChevronRight className="h-4 w-4" /></Button>
            <h3 className="ml-2 text-sm font-semibold capitalize sm:text-base">{title}</h3>
          </div>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as View)} variant="outline" size="sm">
            <ToggleGroupItem value="day">Dan</ToggleGroupItem>
            <ToggleGroupItem value="week">Tjedan</ToggleGroupItem>
            <ToggleGroupItem value="month">Mjesec</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {view === 'day' && (
          <div className="divide-y rounded-lg border">
            {Array.from({ length: 16 }, (_, i) => i + 6).map(h => {
              const hh = String(h).padStart(2, '0');
              const items = (byDay.get(ymd(cursor)) ?? []).filter(r => (r.time || '00').slice(0, 2) === hh);
              return (
                <div key={h} className="flex min-h-12 gap-2 p-1.5">
                  <button type="button" onClick={() => onCreateAt(ymd(cursor), `${hh}:00`)} className="w-12 shrink-0 pt-1 text-right text-xs text-muted-foreground tabular-nums hover:text-foreground">{hh}:00</button>
                  <div className="flex-1 space-y-1">{items.map(r => <EventChip key={r.id} r={r} detailed onClick={() => onSelect(r)} />)}</div>
                </div>
              );
            })}
            {(byDay.get(ymd(cursor)) ?? []).some(r => Number((r.time || '00').slice(0, 2)) < 6 || Number((r.time || '00').slice(0, 2)) > 21) &&
              <div className="space-y-1 p-2">{(byDay.get(ymd(cursor)) ?? []).filter(r => { const h = Number((r.time || '00').slice(0, 2)); return h < 6 || h > 21; }).map(r => <EventChip key={r.id} r={r} detailed onClick={() => onSelect(r)} />)}</div>}
          </div>
        )}

        {view === 'week' && (
          <div className="grid gap-2 md:grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map(d => {
              const key = ymd(d);
              const items = byDay.get(key) ?? [];
              return (
                <div key={key} className={cn('min-h-32 rounded-lg border p-1.5', key === today && 'border-primary')}>
                  <button type="button" onClick={() => { setCursor(d); setView('day'); }} className="mb-1 flex w-full items-baseline justify-between text-xs">
                    <span className="font-medium capitalize">{format(d, 'EEE', { locale: hr })}</span>
                    <span className={cn('tabular-nums', key === today ? 'font-bold text-primary' : 'text-muted-foreground')}>{format(d, 'd.M.')}</span>
                  </button>
                  <div className="space-y-1">{items.map(r => <EventChip key={r.id} r={r} detailed onClick={() => onSelect(r)} />)}</div>
                  <button type="button" onClick={() => onCreateAt(key)} className="mt-1 w-full rounded py-0.5 text-xs text-muted-foreground hover:bg-muted">+ Dodaj</button>
                </div>
              );
            })}
          </div>
        )}

        {view === 'month' && (() => {
          const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
          const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
          const days: Date[] = [];
          for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
          return (
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs">
              {['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'].map(n => <div key={n} className="bg-muted p-1 text-center font-medium">{n}</div>)}
              {days.map(d => {
                const key = ymd(d);
                const items = byDay.get(key) ?? [];
                return (
                  <div key={key} className={cn('min-h-20 bg-card p-1', !isSameMonth(d, cursor) && 'opacity-50')}>
                    <button type="button" onClick={() => { setCursor(d); setView('day'); }} className={cn('mb-0.5 tabular-nums', key === today ? 'font-bold text-primary' : 'text-muted-foreground')}>{format(d, 'd')}</button>
                    <div className="space-y-0.5">
                      {items.slice(0, 3).map(r => <EventChip key={r.id} r={r} onClick={() => onSelect(r)} />)}
                      {items.length > 3 && <button type="button" onClick={() => { setCursor(d); setView('day'); }} className="text-muted-foreground hover:text-foreground">+{items.length - 3} još</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {PROJECTS.map(p => <span key={p.value} className="flex items-center gap-1"><span className={cn('h-3 w-1 rounded border-l-4', projectClass(p.value))} />{p.label}</span>)}
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-destructive" />Visok prioritet</span>
          <span className="flex items-center gap-1"><Cloud className="h-3 w-3" />U Google kalendaru</span>
          <span className="flex items-center gap-1"><CloudOff className="h-3 w-3" />Samo CRM</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CRMCalendar;
