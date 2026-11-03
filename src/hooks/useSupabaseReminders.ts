import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Reminder, ReminderFormData, CalendarSyncStatus, ReminderEventType } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const hashCode = (s: string) => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) { hash = ((hash << 5) - hash) + s.charCodeAt(i); hash |= 0; }
  return Math.abs(hash);
};

const mapRow = (r: Row): Reminder => ({
  id: hashCode(r.id),
  uuid: r.id,
  title: r.title,
  description: r.description || '',
  date: r.date,
  time: String(r.time || '').slice(0, 5),
  priority: r.priority,
  status: r.status,
  company: r.company,
  leadId: r.lead_id ? hashCode(r.lead_id) : undefined,
  leadUuid: r.lead_id || undefined,
  calendarEventId: r.calendar_event_id || undefined,
  eventType: (r.event_type || 'follow_up') as ReminderEventType,
  project: r.project,
  durationMinutes: r.duration_minutes ?? 60,
  syncStatus: (r.sync_status || 'not_synced') as CalendarSyncStatus,
  syncError: r.sync_error,
  lastSyncedAt: r.last_synced_at,
});

const formToRow = (f: ReminderFormData) => ({
  title: f.title,
  description: f.description || null,
  date: f.date,
  time: f.time,
  priority: f.priority,
  company: f.company,
  lead_id: f.leadUuid || null,
  event_type: f.eventType,
  project: f.project || null,
  duration_minutes: f.durationMinutes || 60,
  timezone: 'Europe/Zagreb',
});

export const useSupabaseReminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fail = (msg: string) => toast({ title: 'Greška', description: msg, variant: 'destructive' });

  const fetchReminders = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      setError(null);
      const all: Row[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from('reminders').select('*').eq('user_id', user.id)
          .order('date', { ascending: true }).order('id', { ascending: true }).range(from, from + 999);
        if (error) { setError(error.message); return; }
        all.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      setReminders(all.map(mapRow));
    } catch {
      setError('Nije moguće učitati podsjetnike.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const byId = (id: number) => reminders.find(r => r.id === id);

  /** Returns the saved reminder (with its DB id) or null. Never reports success before the insert succeeds. */
  const createReminder = async (form: ReminderFormData): Promise<Reminder | null> => {
    if (!user) { fail('Morate biti prijavljeni.'); return null; }
    const { data, error } = await supabase.from('reminders')
      .insert({ ...formToRow(form), user_id: user.id, status: 'Aktivan' } as never).select('*').single();
    if (error || !data) { fail(error?.message || 'Spremanje nije uspjelo.'); return null; }
    await fetchReminders();
    toast({ title: 'Spremljeno u CRM', description: `"${form.title}" je spremljen.` });
    return mapRow(data);
  };

  const updateReminder = async (reminderId: number, form: ReminderFormData): Promise<Reminder | null> => {
    const r = byId(reminderId);
    if (!user || !r?.uuid) { fail('Podsjetnik nije pronađen.'); return null; }
    const { data, error } = await supabase.from('reminders')
      .update({ ...formToRow(form), updated_at: new Date().toISOString() } as never).eq('id', r.uuid).select('*').single();
    if (error || !data) { fail(error?.message || 'Ažuriranje nije uspjelo.'); return null; }
    await fetchReminders();
    toast({ title: 'Ažurirano u CRM-u', description: `"${form.title}" je ažuriran.` });
    return mapRow(data);
  };

  const patch = async (reminderId: number, values: Record<string, unknown>, okTitle: string): Promise<Reminder | null> => {
    const r = byId(reminderId);
    if (!user || !r?.uuid) return null;
    const { data, error } = await supabase.from('reminders')
      .update({ ...values, updated_at: new Date().toISOString() } as never).eq('id', r.uuid).select('*').single();
    if (error || !data) { fail(error?.message || 'Spremanje nije uspjelo.'); return null; }
    await fetchReminders();
    toast({ title: okTitle, description: `"${r.title}"` });
    return mapRow(data);
  };

  const updateReminderStatus = (reminderId: number, status: Reminder['status']) =>
    patch(reminderId, { status }, `Status: ${status}`);

  const postponeReminder = (reminderId: number) => {
    const r = byId(reminderId);
    if (!r) return Promise.resolve(null);
    const d = new Date(`${r.date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1);
    return patch(reminderId, { date: d.toISOString().slice(0, 10), status: 'Odgođen' }, 'Odgođeno za jedan dan');
  };

  const deleteReminder = async (reminderId: number): Promise<boolean> => {
    const r = byId(reminderId);
    if (!user || !r?.uuid) return false;
    const { error } = await supabase.from('reminders').delete().eq('id', r.uuid);
    if (error) { fail(error.message); return false; }
    await fetchReminders();
    toast({ title: 'Obrisano', description: `"${r.title}" je obrisan.` });
    return true;
  };

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  return { reminders, loading, error, createReminder, updateReminder, updateReminderStatus, deleteReminder, postponeReminder, refreshReminders: fetchReminders };
};
