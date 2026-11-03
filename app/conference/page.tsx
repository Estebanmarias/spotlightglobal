import type { Metadata } from "next";
import { Suspense } from "react";
import ConferencePreview from "./ConferencePreview";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}): Promise<Metadata> {
  const { event: eventId } = await searchParams;
  const fallback = { title: "Events | theSpotlightChurch", description: "Discover upcoming events at theSpotlightChurch." };
  if (!eventId) return fallback;
  const { data } = await getSupabaseAdminClient().from("church_events")
    .select("title, description, flyer_url").eq("id", eventId).maybeSingle();
  if (!data) return fallback;
  const description = data.description || `Join ${data.title} at theSpotlightChurch.`;
  return {
    title: `${data.title} | theSpotlightChurch`,
    description,
    openGraph: { title: data.title, description, type: "website", images: [data.flyer_url || "/images/logo.png"] },
    twitter: { card: "summary_large_image", title: data.title, description, images: [data.flyer_url || "/images/logo.png"] },
  };
}

export default function ConferencePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f7f9fb]" />}>
      <ConferencePreview />
    </Suspense>
  );
}