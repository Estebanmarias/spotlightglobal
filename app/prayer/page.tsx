import type { Metadata } from "next";
import PrayerClient from "./PrayerClient";

export const metadata: Metadata = {
  title: "Prayer requests",
  description: "Share a prayer request with the pastoral team at theSpotlightChurch.",
};

export default function PrayerPage() {
  return <PrayerClient />;
}