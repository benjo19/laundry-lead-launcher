// Pure wall-clock helpers for Europe/Zagreb calendar sync.
// Mirrored in supabase/functions/_shared/calendarTime.ts — keep both identical.

export const CRM_TIMEZONE = 'Europe/Zagreb';

/** Adds minutes to a local wall-clock date/time without any timezone conversion. */
export const addMinutesLocal = (date: string, time: string, minutes: number): { date: string; time: string } => {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.slice(0, 5).split(':').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, hh, mm + minutes));
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`,
    time: `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`,
  };
};

/** Google event payload times: local wall clock + explicit Europe/Zagreb zone. */
export const toGoogleTimes = (date: string, time: string, durationMinutes: number) => {
  const end = addMinutesLocal(date, time, durationMinutes);
  return {
    start: { dateTime: `${date}T${time.slice(0, 5)}:00`, timeZone: CRM_TIMEZONE },
    end: { dateTime: `${end.date}T${end.time}:00`, timeZone: CRM_TIMEZONE },
  };
};

/** Reads a Google dateTime already rendered in Europe/Zagreb (list called with timeZone=Europe/Zagreb). */
export const fromGoogleDateTime = (dateTime: string): { date: string; time: string } => ({
  date: dateTime.slice(0, 10),
  time: dateTime.slice(11, 16),
});

export const minutesBetween = (startDateTime: string, endDateTime: string): number =>
  Math.max(5, Math.round((Date.parse(endDateTime) - Date.parse(startDateTime)) / 60000));

/** Deterministic Google event id (base32hex alphabet) so retries never create duplicates. */
export const googleEventIdForReminder = (reminderId: string): string => `crm${reminderId.replace(/-/g, '').toLowerCase()}`;
