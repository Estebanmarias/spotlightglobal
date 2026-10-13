"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import type { ChurchEventPreview } from "@/lib/church-events";

function localDateString() {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function eventDetailHref(event: ChurchEventPreview) {
  return `/conference?event=${encodeURIComponent(event.id)}`;
}

export default function EventDirectory() {
  const supabase = getSupabaseClient();
  const [events, setEvents] = useState<ChurchEventPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"upcoming" | "archive">("upcoming");

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
    const today = localDateString();
    const upcomingEvents = events
      .filter((event) => (event.event_end_date || event.event_date) >= today)
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
    const archivedEvents = events
      .filter((event) => (event.event_end_date || event.event_date) < today)
      .sort((a, b) => b.event_date.localeCompare(a.event_date));
    return { upcoming: upcomingEvents, archive: archivedEvents };
  }, [events]);

  const visibleEvents = view === "upcoming" ? upcoming : archive;

  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
      <header className="bg-[#081534] px-5 pb-12 pt-16 text-white sm:px-8 sm:pb-16 sm:pt-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#fdc425]">theSpotlightChurch</p>
          <h1 className="mt-3 text-[36px] font-bold leading-tight sm:text-[48px]">Events &amp; Programs</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-white/70 sm:text-[16px]">
            Find an upcoming gathering or revisit past moments from our church family.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-[#c6c6cf] pb-4">
          <div className="flex gap-2" role="tablist" aria-label="Event period">
            {(["upcoming", "archive"] as const).map((tab) => (
              <button key={tab} type="button" role="tab" aria-selected={view === tab}
                onClick={() => setView(tab)}
                className={`min-h-10 rounded-md px-4 text-[12px] font-bold capitalize transition ${view === tab ? "bg-[#081534] text-white" : "bg-white text-[#45464e] hover:bg-[#eceef0]"}`}>
                {tab} <span className="ml-1 opacity-70">{tab === "upcoming" ? upcoming.length : archive.length}</span>
              </button>
            ))}
          </div>
          <Link href="/community#upcoming-events" className="text-[12px] font-semibold text-[#081534] hover:text-[#785a00]">
            Community page
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-80 animate-pulse bg-white" />)}
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="border border-dashed border-[#c6c6cf] bg-white px-5 py-16 text-center">
            <span className="material-symbols-outlined text-[36px] text-[#a3a4ab]">event_busy</span>
            <h2 className="mt-3 text-[17px] font-bold text-[#081534]">No {view} events</h2>
            <p className="mt-1 text-[13px] text-[#76777f]">Check back for updates from the Media Ministry.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleEvents.map((event) => {
              const date = new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              return (
                <article key={event.id} className="flex min-w-0 flex-col border border-[#d9dbe0] bg-white">
                  {event.flyer_url ? (
                    <img src={event.flyer_url} alt="" className="aspect-[4/3] w-full bg-[#081534] object-cover" />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-[#081534] text-[#fdc425]">
                      <span className="material-symbols-outlined text-[48px]">event</span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {event.is_featured && <span className="text-[9px] font-bold uppercase tracking-wide text-[#785a00]">Featured</span>}
                      <span className="text-[11px] font-semibold text-[#76777f]">{date}{event.event_time ? ` · ${event.event_time}` : ""}</span>
                    </div>
                    <h2 className="mt-2 text-[18px] font-bold leading-snug text-[#081534]">{event.title}</h2>
                    {event.description && <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-[#5b5d66]">{event.description}</p>}
                    <p className="mt-3 flex items-start gap-1.5 text-[11px] text-[#76777f]">
                      <span className="material-symbols-outlined text-[14px] text-[#785a00]">location_on</span>{event.location}
                    </p>
                    <Link href={eventDetailHref(event)} className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 border border-[#081534] px-4 pt-3 text-[12px] font-bold text-[#081534] transition hover:bg-[#081534] hover:text-white">
                      {view === "archive" ? "View event" : event.registration_enabled ? "Register / details" : "Event details"}
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}