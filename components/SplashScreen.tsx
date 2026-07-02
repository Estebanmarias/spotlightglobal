'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LOGO_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCSu9ztjFXXL57HPmU2Tzxi3_L64jT6N2N-it5rvbfUfWfdXYJHE01o-8vaDbMMklLymKGFy1h8bgWMuq6cFCbsAWGpAlzRdnIlqlCNZGURQg-bl42EaVtpB0oh1Ad-gK8evCtIRS5ux11Sgpvn686W0Zv9ySUxOUssIE11jsJlK62yZPqSHl64xThPfeKXmVOT7T--wIzDqUmNxAViuDnvS5k1CKHkBHX3FGjpWOScub8kqDfinr_Tsn0ifKgyAVbp8f2XdxntkwI"

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'intro' | 'hold' | 'exit'>('intro')

  useEffect(() => {
    // intro animates in ~800ms, hold for 1.2s, then exit
    const holdTimer  = setTimeout(() => setPhase('hold'), 800)
    const exitTimer  = setTimeout(() => setPhase('exit'), 3200)
    const doneTimer  = setTimeout(() => onComplete(), 3200)
    return () => {
      clearTimeout(holdTimer)
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] bg-[#081534] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Ambient glow rings */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.8, opacity: 0.06 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute w-[600px] h-[600px] rounded-full border border-[#fdc425]"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.08 }}
            transition={{ duration: 2, delay: 0.2, ease: 'easeOut' }}
            className="absolute w-[400px] h-[400px] rounded-full border border-[#fdc425]"
          />
          {/* Gold radial glow behind logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute w-64 h-64 rounded-full bg-[#fdc425] blur-[80px]"
          />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Logo image */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <img
                src={LOGO_URL}
                alt="theSpotlightChurch"
                className="h-28 sm:h-36 w-auto object-contain drop-shadow-2xl"
              />
            </motion.div>

            {/* Church name */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-white text-[22px] sm:text-[28px] font-bold tracking-tight mt-5"
            >
              theSpotlight<span className="text-[#fdc425]">Church</span>
            </motion.h1>

            {/* Gold underline sweep */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="h-[2px] w-48 bg-gradient-to-r from-transparent via-[#fdc425] to-transparent mt-3 origin-left"
            />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="text-white/50 text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.25em] mt-3"
            >
              Company of the Blessed
            </motion.p>

            {/* Pulsing gold dot */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 1.3 }}
              className="mt-8 flex items-center gap-2"
            >
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1.5 h-1.5 rounded-full bg-[#fdc425] block"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-[#fdc425] block"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                className="w-1.5 h-1.5 rounded-full bg-[#fdc425] block"
              />
            </motion.div>
          </motion.div>

          {/* Bottom tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className="absolute bottom-8 text-white text-[11px] tracking-widest uppercase"
          >
            Shine Your Light
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}