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
};

export function isShiftConferenceTitle(title: string) {
  return /shift|soaring/i.test(title);
}