import type { Metadata } from "next";
import EventDirectory from "./EventDirectory";

export const metadata: Metadata = {
  title: "Events | theSpotlightChurch",
  description: "Browse upcoming events and past programs from theSpotlightChurch.",
};

export default function EventsPage() {
  return <EventDirectory />;
}