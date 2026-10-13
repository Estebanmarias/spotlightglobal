"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import type { ChurchEventPreview } from "@/lib/church-events";

function localDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function eventHref(event: ChurchEventPreview) {
  return `/conference?event=${encodeURIComponent(event.id)}`;
}

function eventDateLabel(event: ChurchEventPreview) {
  const format = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const start = format(event.event_date);
  const end = event.event_end_date ? format(event.event_end_date) : start;
  return start === end ? start : `${start}–${end}`;
}

export default function FeaturedEventPromo() {
  const pathname = usePathname();
  const supabase = getSupabaseClient();
  const [event, setEvent] = useState<ChurchEventPreview | null>(null);
  const [pageReady, setPageReady] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const shownEventRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadFeaturedEvent = async () => {
      const { data } = (await supabase
        .from("church_events")
        .select("id, title, description, event_date, event_end_date, event_time, flyer_url, location, is_featured")
        .order("event_date", { ascending: true })
        .limit(50)) as { data: ChurchEventPreview[] | null };

      if (!active) return;

      const upcomingEvents = (data ?? []).filter(
        (candidate) => (candidate.event_end_date || candidate.event_date) >= localDateString(),
      );
      const upcomingFeatured = upcomingEvents.find((candidate) => candidate.is_featured);
      setEvent(upcomingFeatured ?? null);
    };

    loadFeaturedEvent();
    const channel = supabase
      .channel("featured-event-promo")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "church_events" },
        loadFeaturedEvent,
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    setPageReady(false);
    let readyTimer = 0;

    const waitAfterReady = () => {
      readyTimer = window.setTimeout(() => setPageReady(true), 3500);
    };

    if (pathname === "/") {
      if (document.documentElement.dataset.spotlightHomeReady === "true") {
        waitAfterReady();
      } else {
        window.addEventListener("spotlight:home-ready", waitAfterReady, { once: true });
      }
    } else if (document.readyState === "complete") {
      waitAfterReady();
    } else {
      window.addEventListener("load", waitAfterReady, { once: true });
    }

    return () => {
      window.clearTimeout(readyTimer);
      window.removeEventListener("spotlight:home-ready", waitAfterReady);
      window.removeEventListener("load", waitAfterReady);
    };
  }, [pathname]);

  useEffect(() => {
    if (!event || !pageReady || pathname === "/conference" || shownEventRef.current === event.id) return;

    const storageKey = `spotlight-featured-event:${event.id}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
    } catch {
      // Continue with in-memory session tracking when storage is unavailable.
    }

    try {
      window.sessionStorage.setItem(storageKey, "shown");
    } catch {
      // The ref below still prevents repeat displays during this page session.
    }
    shownEventRef.current = event.id;
    setPopupOpen(true);
  }, [event, pageReady, pathname]);

  useEffect(() => {
    if (!popupOpen) return;
    const closeOnEscape = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") setPopupOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [popupOpen]);

  if (!event || pathname === "/conference") return null;

  const href = eventHref(event);
  const image = event.flyer_url || "/images/gallery/community-3.jpg";
  const isInternal = href.startsWith("/");

  return (
    <>
      <aside className="bg-[#081534] text-white" aria-label="Featured upcoming event">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-8 lg:px-12">
          <img
            src={image}
            alt=""
            className="h-14 w-12 shrink-0 bg-white object-cover object-top sm:h-18 sm:w-14"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#fdc425] sm:text-[10px]">
              Featured upcoming event
            </p>
            <h2 className="mt-0.5 truncate text-[13px] font-bold sm:text-[15px]">
              {event.title}
            </h2>
            <p className="mt-0.5 truncate text-[10px] text-white/70 sm:text-[12px]">
              {eventDateLabel(event)} · {event.location}
            </p>
          </div>
          {isInternal ? (
            <Link
              href={href}
              className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md bg-[#fdc425] px-3 text-[11px] font-bold text-[#081534] transition hover:bg-[#ffe07a] sm:px-4 sm:text-[12px]"
            >
              Details
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          ) : (
            <a
              href={href}
              className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md bg-[#fdc425] px-3 text-[11px] font-bold text-[#081534] transition hover:bg-[#ffe07a] sm:px-4 sm:text-[12px]"
            >
              Details
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </a>
          )}
        </div>
      </aside>

      {popupOpen && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/65 p-4"
          onClick={() => setPopupOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="featured-event-title"
            className="relative grid max-h-[min(90dvh,46rem)] w-full max-w-3xl overflow-y-auto bg-white shadow-2xl sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]"
            onClick={(mouseEvent) => mouseEvent.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close featured event"
              onClick={() => setPopupOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center bg-[#081534]/80 text-white transition hover:bg-[#081534] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdc425]"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <img
              src={image}
              alt=""
              className="max-h-[42dvh] w-full bg-[#081534] object-contain sm:max-h-full"
            />
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#785a00]">
                Featured event
              </p>
              <h2 id="featured-event-title" className="mt-2 text-[25px] font-bold leading-tight text-[#081534] sm:text-[30px]">
                {event.title}
              </h2>
              <p className="mt-3 text-[14px] font-semibold text-[#45464e]">
                {eventDateLabel(event)}{event.event_time ? ` · ${event.event_time}` : ""}
              </p>
              <p className="mt-2 text-[13px] leading-5 text-[#5b5d66]">{event.location}</p>
              {event.description && (
                <p className="mt-4 text-[13px] leading-6 text-[#45464e]">{event.description}</p>
              )}
              {isInternal ? (
                <Link
                  href={href}
                  onClick={() => setPopupOpen(false)}
                  className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 bg-[#081534] px-5 text-[13px] font-bold text-white transition hover:bg-[#17305f]"
                >
                  View event
                  <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                </Link>
              ) : (
                <a href={href} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 bg-[#081534] px-5 text-[13px] font-bold text-white transition hover:bg-[#17305f]">
                  View event
                  <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                </a>
              )}
              {/* <p className="mt-3 text-center text-[10px] text-[#76777f]">Shown once per session</p> */}
            </div>
          </section>
        </div>
      )}
    </>
  );
}