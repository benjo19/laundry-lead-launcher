interface CalendarEventData {
  title: string;
  description?: string;
  date: string;
  time: string;
  company: string;
}

export const generateGoogleCalendarLink = (reminder: CalendarEventData): string => {
  // Combine date and time into a Date object
  const startDate = new Date(`${reminder.date}T${reminder.time}`);
  
  // Set end time to 1 hour after start
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  
  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
  const formatDate = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  // Build event details
  const details = reminder.description 
    ? `${reminder.description}\n\nTvrtka: ${reminder.company}`
    : `Tvrtka: ${reminder.company}`;
  
  // Create URL parameters
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: reminder.title,
    details: details,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
