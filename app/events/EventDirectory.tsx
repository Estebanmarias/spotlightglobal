"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabase";
import type { ChurchEventPreview } from "@/lib/church-events";
import Icon from "@/components/Icon";

function localDateString() {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

const parse = (d: string) => new Date(`${d}T00:00:00`);

function eventDetailHref(event: ChurchEventPreview) {
  return `/conference?event=${encodeURIComponent(event.id)}`;
}

function dateRange(event: ChurchEventPreview) {
  const start = parse(event.event_date);
  const end = parse(event.event_end_date || event.event_date);
  if (start.getTime() === end.getTime()) {
    return start.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  }
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()}–${end.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`;
  }
  return `${start.toLocaleDateString("en-NG", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`;
}

function whenLabel(event: ChurchEventPreview, today: string) {
  const end = event.event_end_date || event.event_date;
  if (event.event_date === today) return "Today";
  if (event.event_date < today && today <= end) return "Happening now";
  if (event.event_date < today) return null;
  const days = Math.round((parse(event.event_date).getTime() - parse(today).getTime()) / 86400000);
  if (days === 1) return "Tomorrow";
  if (days <= 30) return `In ${days} days`;
  return null;
}

function registrationOpen(event: ChurchEventPreview, today: string) {
  return Boolean(
    event.registration_enabled &&
      (event.event_end_date || event.event_date) >= today &&
      (!event.registration_deadline || event.registration_deadline >= today),
  );
}

function priceLabel(event: ChurchEventPreview) {
  const type = String(event.price_type ?? "");
  if (type === "paid" && event.price != null) {
    return `${event.currency || "NGN"} ${Number(event.price).toLocaleString("en-NG")}`;
  }
  if (type === "free") return "Free";
  return null;
}

const CHIP_TONES = {
  green: "bg-green-100 text-green-800",
  gold: "bg-[#fdc425]/25 text-[#6d5200]",
  neutral: "bg-[#f2f4f6] text-[#45464e]",
} as const;

function Chip({ tone = "neutral", children }: { tone?: keyof typeof CHIP_TONES; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${CHIP_TONES[tone]}`}>
      {children}
    </span>
  );
}

function MetaRow({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-[13px] leading-5 text-[#45464e]">
      <Icon name={icon} className="mt-0.5 text-[16px] text-[#785a00]" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

function Poster({ event }: { event: ChurchEventPreview }) {
  if (event.flyer_url) {
    return (
      <img
        src={event.flyer_url}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
      />
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#081534] to-[#17305f] px-6 text-center text-[#fdc425]">
      <Icon name="event" className="text-[44px]" />
      <span className="text-[13px] font-semibold text-white/80">{event.title}</span>
    </div>
  );
}

function DateBadge({ event }: { event: ChurchEventPreview }) {
  const start = parse(event.event_date);
  return (
    <div className="absolute left-3 top-3 rounded-xl bg-white/95 px-3 py-2 text-center shadow-md backdrop-blur-sm">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-[#785a00]">
        {start.toLocaleDateString("en-NG", { month: "short" })}
      </span>
      <span className="block text-[22px] font-bold leading-none text-[#081534]">{start.getDate()}</span>
    </div>
  );
}

function Cta({ event, open, archived }: { event: ChurchEventPreview; open: boolean; archived: boolean }) {
  const label = archived ? "View details" : open ? "Register now" : "Event details";
  const tone =
    open && !archived
      ? "bg-[#081534] text-white hover:bg-[#17305f]"
      : "border border-[#081534] text-[#081534] hover:bg-[#081534] hover:text-white";
  return (
    <Link
      href={eventDetailHref(event)}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdc425] focus-visible:ring-offset-2 ${tone}`}
    >
      {label}
      <Icon name="arrow_forward" className="text-[16px] transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function StatusChips({ event, today, archived }: { event: ChurchEventPreview; today: string; archived: boolean }) {
  const open = registrationOpen(event, today);
  const price = priceLabel(event);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!archived && open && <Chip tone="green">Registration open</Chip>}
      {!archived && !open && event.registration_enabled && <Chip>Registration closed</Chip>}
      {price && <Chip tone="gold">{price}</Chip>}
    </div>
  );
}

function FeaturedEvent({ event, today }: { event: ChurchEventPreview; today: string }) {
  const open = registrationOpen(event, today);
  const label = whenLabel(event, today);
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group grid overflow-hidden rounded-3xl border border-[#d9dbe0] bg-white shadow-sm md:grid-cols-[2fr_3fr]"
    >
      <Link
        href={eventDetailHref(event)}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-[4/5] overflow-hidden bg-[#081534] md:aspect-auto md:min-h-[440px]"
      >
        <div className="absolute inset-0"><Poster event={event} /></div>
        <DateBadge event={event} />
      </Link>

      <div className="flex flex-col justify-center p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          {event.is_featured && <Chip tone="gold">Featured</Chip>}
          {label && <span className="text-[12px] font-bold uppercase tracking-wide text-[#785a00]">{label}</span>}
        </div>
        <h2 className="mt-3 text-[28px] font-bold leading-tight text-[#081534] sm:text-[38px]">{event.title}</h2>
        {event.description && (
          <p className="mt-4 line-clamp-4 text-[14px] leading-6 text-[#5b5d66] sm:text-[15px]">{event.description}</p>
        )}
        <div className="mt-6 space-y-2.5">
          <MetaRow icon="calendar_month">{dateRange(event)}</MetaRow>
          {event.event_time && <MetaRow icon="schedule">{event.event_time}</MetaRow>}
          {event.location && <MetaRow icon="location_on">{event.location}</MetaRow>}
        </div>
        <div className="mt-6"><StatusChips event={event} today={today} archived={false} /></div>
        <div className="mt-7"><Cta event={event} open={open} archived={false} /></div>
      </div>
    </motion.article>
  );
}

function EventCard({ event, index, today, archived }: { event: ChurchEventPreview; index: number; today: string; archived: boolean }) {
  const open = registrationOpen(event, today);
  const label = archived ? null : whenLabel(event, today);
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.08, ease: "easeOut" }}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#d9dbe0] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <Link
        href={eventDetailHref(event)}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-[4/5] overflow-hidden bg-[#081534]"
      >
        <div className="absolute inset-0"><Poster event={event} /></div>
        <DateBadge event={event} />
        {event.is_featured && (
          <span className="absolute right-3 top-3"><Chip tone="gold">Featured</Chip></span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {label && <p className="text-[11px] font-bold uppercase tracking-wide text-[#785a00]">{label}</p>}
        <h3 className="mt-1 text-[18px] font-bold leading-snug text-[#081534]">{event.title}</h3>
        <div className="mt-3 space-y-2">
          <MetaRow icon="calendar_month">{dateRange(event)}</MetaRow>
          {event.event_time && <MetaRow icon="schedule">{event.event_time}</MetaRow>}
          {event.location && <MetaRow icon="location_on">{event.location}</MetaRow>}
        </div>
        <div className="mt-4"><StatusChips event={event} today={today} archived={archived} /></div>
        <div className="mt-auto pt-5"><Cta event={event} open={open} archived={archived} /></div>
      </div>
    </motion.article>
  );
}

export default function EventDirectory() {
  const supabase = getSupabaseClient();
  const [events, setEvents] = useState<ChurchEventPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"upcoming" | "archive">("upcoming");
  const today = useMemo(() => localDateString(), []);

  useEffect(() => {
    let active = true;
    const loadEvents = async () => {
      const { data, error } = await supabase
        .from("church_events")
        .select("id, title, description, event_date, event_end_date, event_time, flyer_url, location, is_featured, registration_enabled, registration_capacity, registration_deadline, price_type, price, currency, payment_instructions, special_session_label, special_session_date")
        .order("event_date", { ascending: true });

      if (!active) return;
      setEvents((data ?? []) as ChurchEventPreview[]);
      setLoading(false);
      if (error) console.error("[EVENT DIRECTORY] Could not load events:", error.message);
    };

    loadEvents();
    const channel = supabase
      .channel("public-event-directory")
      .on("postgres_changes", { event: "*", schema: "public", table: "church_events" }, loadEvents)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const { upcoming, archive } = useMemo(() => {
    const upcomingEvents = events
      .filter((event) => (event.event_end_date || event.event_date) >= today)
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
    const archivedEvents = events
      .filter((event) => (event.event_end_date || event.event_date) < today)
      .sort((a, b) => b.event_date.localeCompare(a.event_date));
    return { upcoming: upcomingEvents, archive: archivedEvents };
  }, [events, today]);

  const visibleEvents = view === "upcoming" ? upcoming : archive;
  const spotlight = view === "upcoming" ? (upcoming.find((e) => e.is_featured) ?? upcoming[0]) : undefined;
  const rest = spotlight ? upcoming.filter((e) => e.id !== spotlight.id) : visibleEvents;

  const tabs = [
    { key: "upcoming" as const, label: "Coming up", count: upcoming.length },
    { key: "archive" as const, label: "Past events", count: archive.length },
  ];

  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
      <header className="relative overflow-hidden bg-[#081534] px-5 pb-14 pt-16 text-white sm:px-8 sm:pb-16 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#fdc425] blur-[90px]" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-white blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdc425]">Events</p>
          <h1 className="mt-3 text-[40px] font-bold leading-[1.05] sm:text-[56px]">Gather with us</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/75 sm:text-[17px]">
            Conferences, services and moments we share as a family. Come, bring a friend, and be part of it.
          </p>
          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Event period">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={view === tab.key}
                onClick={() => setView(tab.key)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdc425] ${
                  view === tab.key ? "bg-[#fdc425] text-[#6d5200]" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${view === tab.key ? "bg-[#6d5200]/15" : "bg-white/15"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        {loading ? (
          <div className="space-y-6">
            <div className="h-[440px] rounded-3xl bg-white motion-safe:animate-pulse" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="aspect-[4/5] rounded-2xl bg-white motion-safe:animate-pulse" />
              ))}
            </div>
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#c6c6cf] bg-white px-6 py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdc425]/20">
              <Icon name="event_busy" className="text-[26px] text-[#785a00]" />
            </div>
            <h2 className="text-[18px] font-bold text-[#081534]">
              {view === "upcoming" ? "Nothing on the calendar yet" : "No past events yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-6 text-[#76777f]">
              {view === "upcoming"
                ? "New events are announced here first. Check back soon."
                : "Once our events wrap up, you'll find them here."}
            </p>
          </div>
        ) : (
          <>
            {spotlight && <FeaturedEvent event={spotlight} today={today} />}

            {rest.length > 0 && (
              <>
                <h2 className={`mb-5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#785a00] ${spotlight ? "mt-12" : ""}`}>
                  {view === "upcoming" ? "More to look forward to" : "Moments we've shared"}
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} today={today} archived={view === "archive"} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="mt-14 text-center">
          <Link
            href="/community#upcoming-events"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#081534] transition-colors hover:text-[#785a00]"
          >
            More on our community page
            <Icon name="arrow_forward" className="text-[15px]" />
          </Link>
        </div>
      </section>
    </main>
  );
}