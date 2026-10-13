import type { Metadata } from "next";
import { Suspense } from "react";
import ConferencePreview from "./ConferencePreview";

export const metadata: Metadata = {
  title: "Soaring (Height & Sight) | SHIFT Conference 2026",
  description:
    "Join the C6 SHIFT Conference 2026, Soaring (Height & Sight), November 7–8 at Ivana Event and Recreational Centre, One Man Village.",
};

export default function ConferencePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f7f9fb]" />}>
      <ConferencePreview />
    </Suspense>
  );
}