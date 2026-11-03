import { toGoogleTimes } from '@/lib/calendarTime';

interface CalendarEventData {
  title: string;
  description?: string;
  date: string;
  time: string;
  company: string;
  durationMinutes?: number;
}

/** Manual "add to Google" template link (fallback when not connected). Uses Europe/Zagreb wall clock. */
export const generateGoogleCalendarLink = (reminder: CalendarEventData): string => {
  const t = toGoogleTimes(reminder.date, reminder.time || '09:00', reminder.durationMinutes || 60);
  const compact = (s: string) => s.replace(/[-:]/g, '');
  const details = reminder.description ? `${reminder.description}\n\nTvrtka: ${reminder.company}` : `Tvrtka: ${reminder.company}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: reminder.title,
    details,
    dates: `${compact(t.start.dateTime)}/${compact(t.end.dateTime)}`,
    ctz: t.start.timeZone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
