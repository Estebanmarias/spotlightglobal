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