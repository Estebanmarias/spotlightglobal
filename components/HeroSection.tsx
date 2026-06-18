"use client";

import { motion } from "framer-motion";

export default function HeroSection() {
  const handleScroll = () => {
    const connectSection = document.getElementById("connect");
    if (connectSection) {
      connectSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="relative w-full min-h-[560px] sm:min-h-[680px] lg:h-[870px] overflow-hidden flex items-center py-16 sm:py-0">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdt3QR4EmE3gCcnJXuWttG4fB3HkOyrcVZCsKVy4SLE3yVPCApBf5HoklcQFwnwH9rH7Kmixgvzz4fvFkffc7HQck6h-AeXFS5xS6CBvquxg4wA5nfTyUK90iN1tI5XVvKdWn77h_OkNfmE3t_bLO3lZI1j7FcMDIzubsazN8Vouh7056hNvoUU2MUEueDcIrv_T7Y_V8jZUTAtVtaQXyFn3XkY0Ha1OD4quMwgB8AD13KkTPNTGhuDLgEvEHc7exDHKFCMJrP20U"
          alt="Church service"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(8,21,52,0.92), rgba(8,21,52,0.55))",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-8 lg:px-16 w-full max-w-[1280px] mx-auto text-white">
        <div className="max-w-2xl">
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
            We Are a People Marvelously Helped, Greatly Blessed, Deeply Loved, and Highly Favored.
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
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <a
              href="https://www.youtube.com/@pstedetkingsley"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg text-[13px] sm:text-[14px] font-bold hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2"
            >
              Watch Live
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
            </a>
          </motion.div>
        </div>
      </div>
    </header>
  );
}