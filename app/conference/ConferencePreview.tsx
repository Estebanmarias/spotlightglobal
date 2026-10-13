"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { isShiftConferenceTitle, type ChurchEventPreview } from "@/lib/church-events";

type ConferenceForm = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  accommodation: "yes" | "no";
  accommodationRequest: string;
  bringingChildren: "yes" | "no";
  childrenCount: string;
  attendanceDates: string[];
  fridaySession: boolean;
  specialRequest: string;
  prayerRequest: string;
  referralSource: string;
  privacyAccepted: boolean;
};

const initialForm: ConferenceForm = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  accommodation: "no",
  accommodationRequest: "",
  bringingChildren: "no",
  childrenCount: "",
  attendanceDates: [],
  fridaySession: false,
  specialRequest: "",
  prayerRequest: "",
  referralSource: "",
  privacyAccepted: false,
};

const textInputClass =
  "min-h-12 w-full rounded-md border border-[#c6c6cf] bg-white px-3.5 text-[14px] text-[#191c1e] outline-none transition focus:border-[#081534] focus:ring-2 focus:ring-[#081534]/10";

export default function ConferencePreview() {
  const supabase = getSupabaseClient();
  const searchParams = useSearchParams();
  const requestedEventId = searchParams.get("event");
  const [event, setEvent] = useState<ChurchEventPreview | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventLoadError, setEventLoadError] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    let active = true;
    setEventLoading(true);
    setEvent(null);
    setEventLoadError(false);
    const today = new Date();
    const todayString = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");

    const loadShiftEvent = async () => {
      let eventQuery = supabase.from("church_events")
        .select("id, title, description, event_date, event_end_date, event_time, flyer_url, location, is_featured, registration_enabled, registration_capacity, registration_deadline, price_type, price, currency, payment_instructions, special_session_label, special_session_date");
      eventQuery = requestedEventId
        ? eventQuery.eq("id", requestedEventId)
        : eventQuery.gte("event_date", todayString).order("event_date", { ascending: true });
      const { data, error } = await eventQuery.limit(requestedEventId ? 1 : 30);

      if (!active) return;
      if (error) {
        console.error("[CONFERENCE] Could not load event:", error.message);
        setEventLoadError(true);
        setEventLoading(false);
        return;
      }
      const selectedEvent = requestedEventId
        ? data?.[0]
        : data?.find((candidate: ChurchEventPreview) => isShiftConferenceTitle(candidate.title));
      if (selectedEvent) {
        setEvent(selectedEvent);
      }
      setEventLoading(false);
    };

    loadShiftEvent();
    return () => { active = false; };
  }, [supabase, requestedEventId]);

  const updateField = <K extends keyof ConferenceForm>(
    field: K,
    value: ConferenceForm[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (submitState !== "success") setSubmitState("idle");
    setSubmitMessage("");
  };

  if (eventLoading) {
    return <main className="min-h-[60vh] bg-[#f7f9fb]" aria-label="Loading event details" />;
  }

  if (!event) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-[#f7f9fb] px-6 text-center">
        <span className="material-symbols-outlined text-[48px] text-[#a3a4ab]">event_busy</span>
        <h1 className="mt-4 text-[25px] font-bold text-[#081534]">{eventLoadError ? "Event details unavailable" : "Event not published"}</h1>
        <p className="mt-2 text-[14px] text-[#5b5d66]">{eventLoadError ? "We could not load this event right now. Please try again later." : "This event has not been published to the event directory."}</p>
        <a href="/events" className="mt-6 inline-flex min-h-11 items-center bg-[#081534] px-5 text-[13px] font-bold text-white">Browse events</a>
      </main>
    );
  }

  const startDate = new Date(`${event.event_date}T00:00:00`);
  const endDate = new Date(`${event.event_end_date || event.event_date}T00:00:00`);
  const attendanceDays: { value: string; label: string }[] = [];
  for (const date = new Date(startDate); date <= endDate && attendanceDays.length < 14; date.setDate(date.getDate() + 1)) {
    const value = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
    attendanceDays.push({
      value,
      label: date.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" }),
    });
  }

  const registrationOpen = Boolean(
    event?.registration_enabled &&
    event &&
    new Date(`${event.event_end_date || event.event_date}T23:59:59`) >= new Date() &&
    (!event.registration_deadline || new Date(`${event.registration_deadline}T23:59:59`) >= new Date()) &&
    attendanceDays.length > 0,
  );

  const handleSubmit = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    if (!event) return;
    setSubmitState("submitting");
    setSubmitMessage("");

    if (form.attendanceDates.length === 0) {
      setSubmitState("error");
      setSubmitMessage("Select at least one day you plan to attend.");
      return;
    }

    if (!registrationOpen) {
      setSubmitState("error");
      setSubmitMessage("Registration is not open yet. Please check back or contact the church team.");
      return;
    }

    try {
      const response = await fetch("/api/conference/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          location: form.location,
          accommodationNeeded: form.accommodation === "yes",
          accommodationNotes: form.accommodationRequest,
          childrenCount: form.bringingChildren === "yes" ? Number(form.childrenCount || 0) : 0,
          attendanceDates: form.attendanceDates,
          specialSessionAttending: form.fridaySession,
          specialRequest: form.specialRequest,
          prayerRequest: form.prayerRequest,
          referralSource: form.referralSource,
          privacyAccepted: form.privacyAccepted,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Registration could not be completed.");
      setSubmitState("success");
      const referenceMessage = result.registrationReference ? ` Reference: ${result.registrationReference}.` : "";
      setSubmitMessage(result.paymentStatus === "pending"
        ? `Registration received. Payment of ${result.currency} ${Number(result.amountDue).toLocaleString("en-NG")} is pending.${result.paymentInstructions ? ` Payment instructions: ${result.paymentInstructions}` : " The church team will contact you with payment instructions."}${referenceMessage}${result.emailSent ? " A confirmation email is on its way." : ""}`
        : `Your registration is confirmed.${referenceMessage}${result.emailSent ? " A confirmation email is on its way." : ""}`);
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "Registration could not be completed. Please try again.");
    }
  };

  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">
      <section className="overflow-hidden bg-[#081534] text-white">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-9 px-5 pb-12 pt-24 sm:px-8 sm:pb-16 md:grid-cols-[minmax(0,1fr)_15rem] md:gap-8 md:px-8 md:py-12 lg:grid-cols-[1fr_26rem] lg:gap-16 lg:px-12 lg:py-16">
          <div className="order-2 max-w-2xl md:order-1">
            <p className="mb-5 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#fdc425]">
              <span className="h-px w-8 bg-[#fdc425]" />
              {isShiftConferenceTitle(event.title) ? "C6 · SHIFT CONFERENCE 2026" : "theSpotlightChurch · EVENT DETAILS"}
            </p>
            <h1 className="max-w-2xl text-[44px] font-extrabold leading-[1.02] text-white sm:text-[60px] md:text-[48px] lg:text-[68px]">
              {isShiftConferenceTitle(event.title) ? (
                <>
                  SOARING
                  <span className="mt-2 block text-[28px] font-semibold text-[#fdc425] sm:text-[38px] md:text-[30px] lg:text-[38px]">HEIGHT &amp; SIGHT</span>
                </>
              ) : event.title}
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-7 text-white/85 sm:text-[18px]">
              {event.description || "Join theSpotlightChurch for this upcoming event."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-[13px] font-semibold text-white/90">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#081534]/35 px-4 py-2">
                <span className="material-symbols-outlined text-[17px] text-[#fdc425]">event</span>
                {new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}–{new Date(`${event.event_end_date || event.event_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#081534]/35 px-4 py-2">
                <span className="material-symbols-outlined text-[17px] text-[#fdc425]">schedule</span>
                {event.event_time || "Time to be announced"}
              </span>
            </div>
            <a
              href="#registration"
              className="mt-9 inline-flex min-h-12 items-center gap-2 rounded-md bg-[#fdc425] px-6 text-[14px] font-bold text-[#081534] transition hover:bg-[#ffe07a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {registrationOpen ? "Register now" : "Registration details"}
              <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
            </a>
          </div>
          {event.flyer_url ? (
            <img src={event.flyer_url} alt={`${event.title} event flyer`} className="order-1 mx-auto h-auto w-full max-w-[24rem] object-contain md:order-2 md:max-w-[15rem] lg:max-w-104" />
          ) : isShiftConferenceTitle(event.title) ? (
            <Image
              src="/images/shift-conference-2026.jpg"
              alt="SHIFT Conference 2026 poster: Soaring (Height & Sight), November 6–8, with conference speakers and venue details"
              width={768}
              height={960}
              priority
              sizes="(min-width: 1024px) 416px, (min-width: 640px) 420px, 100vw"
              className="order-1 mx-auto h-auto w-full max-w-[24rem] object-contain md:order-2 md:max-w-[15rem] lg:max-w-104"
            />
          ) : (
            <div className="order-1 mx-auto flex aspect-4/5 w-full max-w-[24rem] flex-col items-center justify-center gap-3 bg-white/5 text-center text-white/70 md:order-2 md:max-w-[15rem] lg:max-w-104">
              <span className="material-symbols-outlined text-[48px] text-[#fdc425]">event</span>
              <span className="px-8 text-[13px] font-semibold">{event.title}</span>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-[#d9dbe0] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-[#e2e2e9] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 py-5 sm:px-6 sm:first:pl-0">
            <span className="material-symbols-outlined text-[22px] text-[#785a00]">calendar_month</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#76777f]">Dates</p>
              <p className="mt-0.5 text-[14px] font-semibold text-[#081534]">{new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}–{new Date(`${event.event_end_date || event.event_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-5 sm:px-6">
            <span className="material-symbols-outlined text-[22px] text-[#785a00]">place</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#76777f]">Sessions</p>
              <p className="mt-0.5 text-[14px] font-semibold text-[#081534]">{event.event_time || "To be announced"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-5 sm:px-6 sm:last:pr-0">
            <span className="material-symbols-outlined text-[22px] text-[#785a00]">place</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#76777f]">Venue</p>
              <p className="mt-0.5 text-[14px] font-semibold text-[#081534]">{event.location}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-12">
        <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#785a00]">{event.title}</p>
          <h2 className="mt-3 text-[30px] font-bold leading-tight text-[#081534] sm:text-[36px]">
              {attendanceDays.length} event day{attendanceDays.length === 1 ? "" : "s"}
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-[#45464e]">
            {event.description || `${event.event_time || "Schedule to be announced"} · ${event.location}`}
          </p>

          {isShiftConferenceTitle(event.title) && (
            <div className="mt-7 border-t border-[#d9dbe0] pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#785a00]">Ministering</p>
              <p className="mt-2 text-[14px] font-semibold leading-6 text-[#081534]">
                Pst. Edet Kingsley · Rev. Ubandoma Solomon · Rev. Arome Tokula
              </p>
              <p className="mt-2 text-[12px] leading-5 text-[#5b5d66]">
                Also ministering: Rev. Amumeni David and Pst. Kelvin Ashwe
              </p>
            </div>
          )}

          {event.special_session_label && (
            <div className="mt-8 border-l-2 border-[#fdc425] pl-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#785a00]">Special session</p>
              <h3 className="mt-1 text-[17px] font-bold text-[#081534]">{event.special_session_date ? new Date(`${event.special_session_date}T00:00:00`).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" }) : "Special session"}</h3>
              <p className="mt-1 text-[13px] leading-6 text-[#5b5d66]">
                {event.special_session_label}. Let us know if you plan to attend.
              </p>
            </div>
          )}

          <p className="mt-8 border-t border-[#d9dbe0] pt-5 text-[12px] leading-5 text-[#76777f]">
            {event.location}
          </p>
        </div>

        <div id="registration" className="scroll-mt-24">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-[#c6c6cf] pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#785a00]">Attendee details</p>
              <h2 className="mt-1 text-[24px] font-bold text-[#081534]">Register for this event</h2>
            </div>
            <span className={`rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${registrationOpen ? "bg-green-100 text-green-800" : "bg-[#fff2c7] text-[#6d5200]"}`}>
              {eventLoading ? "Checking availability" : registrationOpen ? "Registration open" : "Registration not open"}
            </span>
          </div>

          {event.price_type === "paid" && event.price != null && (
            <p className="mb-5 border-l-2 border-[#fdc425] bg-white px-4 py-3 text-[13px] text-[#45464e]">
              Registration fee: <strong className="text-[#081534]">{event.currency || "NGN"} {Number(event.price).toLocaleString("en-NG")}</strong>. Payment instructions will be sent after registration.
            </p>
          )}

          {!registrationOpen && (
            <p className="mb-5 border-l-2 border-[#fdc425] bg-white px-4 py-3 text-[12px] leading-5 text-[#5b5d66]">
              {eventLoading
                ? "Loading event registration details…"
                : isRealEvent
                  ? "Registration is currently closed. Please contact the church team for updates."
                  : "Media Ministry is preparing registration. This form will open when the event is added and registration is enabled in the Media event manager."}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-[12px] font-semibold text-[#45464e]">
                Full name <span className="text-[#ba1a1a]">*</span>
                <input autoComplete="name" required value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} className={`${textInputClass} mt-2`} placeholder="Your name" />
              </label>
              <label className="block text-[12px] font-semibold text-[#45464e]">
                Email <span className="text-[#ba1a1a]">*</span>
                <input type="email" autoComplete="email" required value={form.email} onChange={(event) => updateField("email", event.target.value)} className={`${textInputClass} mt-2`} placeholder="you@example.com" />
              </label>
              <label className="block text-[12px] font-semibold text-[#45464e]">
                Phone number <span className="text-[#ba1a1a]">*</span>
                <input type="tel" autoComplete="tel" required value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className={`${textInputClass} mt-2`} placeholder="Include country code" />
              </label>
              <label className="block text-[12px] font-semibold text-[#45464e]">
                City, state, and country <span className="text-[#ba1a1a]">*</span>
                <input autoComplete="address-level2" required value={form.location} onChange={(event) => updateField("location", event.target.value)} className={`${textInputClass} mt-2`} placeholder="e.g. Karu, Abuja, Nigeria" />
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="text-[12px] font-semibold text-[#45464e]">Days attending <span className="text-[#ba1a1a]">*</span></legend>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {attendanceDays.map(day => (
                    <label key={day.value} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-[12px] font-semibold ${form.attendanceDates.includes(day.value) ? "border-[#081534] bg-[#081534] text-white" : "border-[#c6c6cf] bg-white text-[#45464e]"}`}>
                      <input type="checkbox" checked={form.attendanceDates.includes(day.value)} onChange={event => updateField("attendanceDates", event.target.checked ? [...form.attendanceDates, day.value] : form.attendanceDates.filter(date => date !== day.value))} className="h-4 w-4 accent-[#fdc425]" />
                      {day.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="min-w-0">
                <legend className="text-[12px] font-semibold text-[#45464e]">Need accommodation?</legend>
                <div className="mt-2 flex gap-2">
                  {(["yes", "no"] as const).map((value) => (
                    <label key={value} className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-[13px] font-semibold capitalize transition ${form.accommodation === value ? "border-[#081534] bg-[#081534] text-white" : "border-[#c6c6cf] bg-white text-[#45464e] hover:border-[#081534]"}`}>
                      <input type="radio" name="accommodation" value={value} checked={form.accommodation === value} onChange={() => updateField("accommodation", value)} className="sr-only" />
                      {value}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="min-w-0">
                <legend className="text-[12px] font-semibold text-[#45464e]">Coming with children?</legend>
                <div className="mt-2 flex gap-2">
                  {(["yes", "no"] as const).map((value) => (
                    <label key={value} className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-[13px] font-semibold capitalize transition ${form.bringingChildren === value ? "border-[#081534] bg-[#081534] text-white" : "border-[#c6c6cf] bg-white text-[#45464e] hover:border-[#081534]"}`}>
                      <input type="radio" name="bringingChildren" value={value} checked={form.bringingChildren === value} onChange={() => updateField("bringingChildren", value)} className="sr-only" />
                      {value}
                    </label>
                  ))}
                </div>
              </fieldset>
              {form.accommodation === "yes" && (
                <label className="block text-[12px] font-semibold text-[#45464e] sm:col-span-2">
                  What accommodation support do you need?
                  <input value={form.accommodationRequest} onChange={(event) => updateField("accommodationRequest", event.target.value)} className={`${textInputClass} mt-2`} placeholder="Optional details" />
                </label>
              )}
              {form.bringingChildren === "yes" && (
                <label className="block text-[12px] font-semibold text-[#45464e]">
                  Number of children
                  <input type="number" inputMode="numeric" min="1" required value={form.childrenCount} onChange={(event) => updateField("childrenCount", event.target.value)} className={`${textInputClass} mt-2`} placeholder="Number of children" />
                </label>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[#e2e2e9] bg-white p-4">
              <input type="checkbox" required checked={form.privacyAccepted} onChange={(changeEvent) => updateField("privacyAccepted", changeEvent.target.checked)} className="mt-0.5 h-4 w-4 accent-[#081534]" />
              <span className="text-[12px] leading-5 text-[#45464e]">
                I agree that theSpotlightChurch may use these details to manage this event registration. Prayer requests are shared only with the pastoral team.
              </span>
            </label>

            {event.special_session_label && (
              <label className="flex cursor-pointer items-start gap-3 border-y border-[#e2e2e9] py-4">
                <input type="checkbox" checked={form.fridaySession} onChange={(event) => updateField("fridaySession", event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#081534]" />
                <span>
                  <span className="block text-[13px] font-semibold text-[#081534]">I plan to attend: {event.special_session_label}</span>
                  <span className="mt-1 block text-[11px] leading-5 text-[#76777f]">Optional special session preference.</span>
                </span>
              </label>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-[12px] font-semibold text-[#45464e] sm:col-span-2">
                How did you hear about SHIFT Conference? <span className="text-[#ba1a1a]">*</span>
                <select required value={form.referralSource} onChange={(event) => updateField("referralSource", event.target.value)} className={`${textInputClass} mt-2`}>
                  <option value="" disabled>Select one</option>
                  <option>Church announcement</option>
                  <option>Friend or family</option>
                  <option>Social media</option>
                  <option>Church website</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="block text-[12px] font-semibold text-[#45464e] sm:col-span-2">
                Special request <span className="font-normal text-[#76777f]">(optional)</span>
                <textarea rows={3} value={form.specialRequest} onChange={(event) => updateField("specialRequest", event.target.value)} className={`${textInputClass} mt-2 resize-y py-3`} placeholder="Share any request the event team should know about." />
              </label>
              <label className="block text-[12px] font-semibold text-[#45464e] sm:col-span-2">
                Prayer request <span className="font-normal text-[#76777f]">(optional)</span>
                <textarea rows={3} value={form.prayerRequest} onChange={(event) => updateField("prayerRequest", event.target.value)} className={`${textInputClass} mt-2 resize-y py-3`} placeholder="Share only what you feel comfortable sharing." />
              </label>
            </div>

            {submitMessage && (
              <p role={submitState === "error" ? "alert" : "status"} aria-live="polite" className={`border-l-2 px-4 py-3 text-[13px] leading-5 ${submitState === "error" ? "border-[#ba1a1a] bg-[#ffefed] text-[#8f1717]" : "border-[#fdc425] bg-[#fff9e8] text-[#45464e]"}`}>
                {submitMessage}
              </p>
            )}

            <div className="flex flex-col gap-4 border-t border-[#e2e2e9] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-[11px] leading-5 text-[#76777f]">
                Your registration details are stored securely for event administration. Prayer requests are stored separately and visible only to the super admin.
              </p>
              <button type="submit" disabled={!registrationOpen || submitState === "submitting" || submitState === "success"} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-[#081534] px-6 text-[13px] font-bold text-white transition hover:bg-[#17305f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdc425] disabled:cursor-not-allowed disabled:opacity-50">
                {submitState === "submitting" ? "Submitting…" : submitState === "success" ? "Registration received" : registrationOpen ? "Complete registration" : "Registration not open"}
                <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}