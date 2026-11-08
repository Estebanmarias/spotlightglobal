"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Icon from '@/components/Icon'



type HeroVideoState =
  | { type: "live"; videoId: string; title: string }
  | { type: "latest"; videoId: string; title: string }
  | { type: "none" };

export default function HeroSection() {
  const [videoState, setVideoState] = useState<HeroVideoState>({
    type: "none",
  });

    useEffect(() => {
    const controller = new AbortController();

    fetch("/api/youtube", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: HeroVideoState) => {
        if (data?.type === "live" || data?.type === "latest") setVideoState(data);
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
      });

    return () => controller.abort();
  }, []);

  const handleScroll = () => {
    document.getElementById("connect")?.scrollIntoView({ behavior: "smooth" });
  };

  const isLive = videoState.type === "live";
  const hasVideo = videoState.type !== "none";

  return (
    <header className="relative w-full min-h-[560px] sm:min-h-[680px] lg:h-[870px] overflow-hidden flex items-center py-16 sm:py-0">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 9, ease: "easeOut" }}
        >
          <Image
            src="/images/gallery/community-1.jpg"
            alt="Church service"
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[#081534]/70 sm:hidden" />
        <div
          className="absolute inset-0 hidden sm:block"
          style={{
            background:
              "linear-gradient(90deg, rgba(8,21,52,0.94) 0%, rgba(8,21,52,0.78) 38%, rgba(8,21,52,0.22) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#081534]/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-8 lg:px-16 w-full max-w-[1280px] mx-auto text-white">
        <div className="max-w-2xl">
          <span aria-hidden className="mb-5 block h-1 w-14 rounded-full bg-[#fdc425]" />
          {/* Live badge */}
          {isLive && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-[#ba1a1a] text-white px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Live Now
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-[34px] sm:text-[44px] lg:text-[56px] leading-[1.15] lg:leading-[64px] font-bold tracking-tight mb-4"
          >
            Welcome Home
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-[15px] sm:text-[18px] leading-[24px] sm:leading-[28px] mb-8 opacity-90"
          >
            We Are a People Marvelously Helped, Greatly Blessed, Deeply Loved,
            and Highly Favored.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="flex flex-wrap gap-3 sm:gap-4"
          >
            <button
              onClick={handleScroll}
              className="bg-[#fdc425] text-[#6d5200] px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg text-[13px] sm:text-[14px] font-bold flex items-center gap-2 hover:brightness-110 transition-all active:scale-95"
            >
              Start Your Journey
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>

            {/* Dynamic button — Live / Latest Sermon / fallback */}
            {isLive ? (
              <Link
                href={`/community?autoplay=1`}
                className="bg-[#ba1a1a] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg text-[13px] sm:text-[14px] font-bold hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Watch Live
              </Link>
            ) : hasVideo ? (
              <Link
                href="/community?autoplay=1"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg text-[13px] sm:text-[14px] font-bold hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2"
              >
                <Icon name="play_circle" className="text-[18px]" />
                Latest Sermon
              </Link>
            ) : (
              <a
                href="https://www.youtube.com/@thespotlightchurch"
                target="_blank"
                rel="noreferrer"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg text-[13px] sm:text-[14px] font-bold hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2"
              >
                <Icon name="play_circle" className="text-[18px]" />
                Watch on YouTube
              </a>
            )}
          </motion.div>

          {/* Service times and venue */}
          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
            className="mt-8 flex flex-wrap gap-2.5 text-[12px] font-semibold sm:text-[13px]"
          >
            <li className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
              <Icon name="schedule" className="text-[16px] text-[#fdc425]" />
              Sundays 8:30 AM
            </li>
            <li className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
              <Icon name="schedule" className="text-[16px] text-[#fdc425]" />
              Wednesdays 6:00 PM
            </li>
            <li>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Icon Hotel Hall, Angwan Danlami, New Nyanya, Abuja-Keffi Expressway, Nigeria")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md transition hover:bg-white/20"
              >
                <Icon name="location_on" className="text-[16px] text-[#fdc425]" />
                Icon Hotel Hall, New Nyanya
              </a>
            </li>
          </motion.ul>

          {/* Video title hint */}
          {hasVideo && !isLive && videoState.type === "latest" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-white/70 text-[11px] truncate max-w-sm"
            >
              Latest: {videoState.title}
            </motion.p>
          )}
        </div>
      </div>
    </header>
  );
}
