export type ChurchEventPreview = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  flyer_url: string | null;
  location: string;
  is_featured: boolean;
  event_end_date?: string | null;
  registration_enabled?: boolean;
  registration_capacity?: number | null;
  registration_deadline?: string | null;
  price_type?: 'free' | 'paid';
  price?: number | null;
  currency?: string;
  payment_instructions?: string | null;
  special_session_label?: string | null;
  special_session_date?: string | null;
  recurrence?: 'none' | 'weekly';
};

export function recurrenceLabel(event: Pick<ChurchEventPreview, 'event_date' | 'recurrence'>) {
  if (event.recurrence !== 'weekly') return null;
  const day = new Date(`${event.event_date}T00:00:00`).toLocaleDateString('en-NG', { weekday: 'long' });
  return `Every ${day}`;
}

export function isShiftConferenceTitle(title: string) {
  return /shift|soaring/i.test(title);
}

function dateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateString(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

export function nextWeeklyOccurrence(anchorDate: string, today: string) {
  const anchor = dateOnly(anchorDate);
  const current = dateOnly(today);
  const daysUntil = (anchor.getDay() - current.getDay() + 7) % 7;
  current.setDate(current.getDate() + daysUntil);
  return dateString(current);
}

export function resolveEventOccurrence<T extends Pick<ChurchEventPreview, "event_date" | "event_end_date" | "recurrence">>(
  event: T,
  today: string,
) {
  if (event.recurrence !== "weekly") return event;
  const nextDate = nextWeeklyOccurrence(event.event_date, today);
  return { ...event, event_date: nextDate, event_end_date: nextDate };
}

export function isEventActive<T extends Pick<ChurchEventPreview, "event_date" | "event_end_date" | "recurrence">>(
  event: T,
  today: string,
) {
  if (event.recurrence === "weekly") {
    return !event.event_end_date || event.event_end_date >= today;
  }
  return (event.event_end_date || event.event_date) >= today;
}