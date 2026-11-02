import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { checkPublicRateLimit } from "@/lib/public-rate-limit";
import { LOCAL_GIVING_ACCOUNTS } from "@/lib/giving-accounts";
import { eventRegistrationStatus, isEventActive, resolveEventOccurrence } from "@/lib/church-events";

type SearchResult = {
  kind: "event" | "class" | "sermon" | "giving";
  id: string;
  title: string;
  text: string;
  href: string;
};

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const score = (query: string, values: string[]) => {
  const terms = normalize(query).split(" ").filter(term => term.length > 2);
  const haystack = normalize(values.join(" "));
  return terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
};

const dateLabel = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export async function GET(request: Request) {
  const limit = await checkPublicRateLimit(request, "chat-search");
  if (!limit.allowed) {
    return NextResponse.json(
      { results: [], message: "Search is temporarily unavailable. Please try again shortly." },
      { status: limit.unavailable ? 503 : 429 },
    );
  }

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 200) ?? "";
  if (!query) return NextResponse.json({ results: [] });

  try {
    const supabase = getSupabaseAdminClient();
    const today = new Date().toISOString().slice(0, 10);
    const [events, programs, intakes] = await Promise.all([
      supabase
        .from("church_events")
        .select("id, title, description, event_date, event_end_date, event_time, location, registration_enabled, registration_deadline, recurrence")
        .order("event_date")
        .limit(30),
      supabase
        .from("class_programs")
        .select("id, name, summary")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("class_intakes")
        .select("id, title, start_date, end_date, registration_open, registration_deadline, price, currency, program_id")
        .gte("end_date", today)
        .order("start_date")
        .limit(30),
    ]);

    const results: SearchResult[] = [];
    if (/\b(give|giving|tithe|tithes|offering|offerings|donate|donation|seed|seeds|account|bank|transfer)\b/i.test(query)) {
      for (const account of LOCAL_GIVING_ACCOUNTS) {
        const accountScore = score(query, [account.purpose, account.bank, account.accountName, "giving", "account", "bank", "transfer"]);
        if (accountScore === 0) continue;
        results.push({
          kind: "giving",
          id: String(account.id),
          title: `${account.purpose} — ${account.bank}`,
          text: `Account name: ${account.accountName}. Account number: ${account.accountNo}.`,
          href: "/giving#accounts",
        });
      }
    }
    for (const rawEvent of events.data ?? []) {
      if (!isEventActive(rawEvent, today)) continue;
      const event = resolveEventOccurrence(rawEvent, today);
      const eventScore = score(query, [event.title, event.description ?? "", event.location, event.event_time ?? "", "event", "events", "upcoming"]);
      if (eventScore === 0) continue;
      const date = dateLabel(event.event_date);
      const registrationStatus = eventRegistrationStatus(event, today);
      const registration = registrationStatus === "open"
        ? "Registration is available on the event page."
        : registrationStatus === "closed"
          ? "Registration has closed."
          : "Registration is not available for this event.";
      results.push({
        kind: "event",
        id: event.id,
        title: event.title,
        text: `${date}${event.event_time ? ` at ${event.event_time}` : ""}. ${event.location}. ${registration}${event.description ? ` ${event.description}` : ""}`,
        href: `/conference?event=${encodeURIComponent(event.id)}`,
      });
    }

    const programNames = new Map((programs.data ?? []).map(program => [program.id, program.name]));
    for (const program of programs.data ?? []) {
      const classScore = score(query, [program.name, program.summary ?? "", "class", "course", "training"]);
      if (classScore === 0) continue;
      results.push({
        kind: "class",
        id: program.id,
        title: program.name,
        text: program.summary ?? "This class is part of our church training programmes.",
        href: `/classes#${encodeURIComponent(program.name.toLowerCase().replace(/\s+/g, "-"))}`,
      });
    }
    for (const intake of intakes.data ?? []) {
      const intakeScore = score(query, [intake.title, programNames.get(intake.program_id) ?? "", "cohort", "registration"]);
      if (intakeScore === 0) continue;
      const status = intake.registration_open && (!intake.registration_deadline || intake.registration_deadline >= today)
        ? "Registration is open."
        : "Registration is currently closed.";
      results.push({
        kind: "class",
        id: intake.id,
        title: intake.title,
        text: `${programNames.get(intake.program_id) ?? "Class"} starts ${dateLabel(intake.start_date)}. ${status}`,
        href: "/classes",
      });
    }

    const wantsVideo = /\b(sermon|sermons|video|videos|watch|message|preaching|preached|latest)\b/i.test(query);
    if (wantsVideo) {
      const videoResponse = await fetch(new URL("/api/youtube", request.url), { next: { revalidate: 300 } });
      if (videoResponse.ok) {
        const video = await videoResponse.json() as { type?: string; videoId?: string; title?: string };
        if (video.videoId && video.title) {
          results.push({
            kind: "sermon",
            id: video.videoId,
            title: video.title,
            text: video.type === "live" ? "This is currently live on YouTube." : "This is the latest available message on YouTube.",
            href: `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`,
          });
        }
      }
    }

    return NextResponse.json({ results: results.slice(0, 6) }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    console.error("[CHAT SEARCH] Public search failed:", error);
    return NextResponse.json({ results: [], message: "Search is temporarily unavailable." }, { status: 500 });
  }
}
