'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { motion } from 'framer-motion'

const links = [
  { label: 'Our Vision', href: '/vision' },
  { label: 'Community', href: '/community' },
  { label: 'Partner', href: '/partner' },
  { label: 'Giving', href: '/giving' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`sticky top-0 z-50 w-full h-20 flex items-center transition-all duration-300
        ${scrolled
          ? 'bg-[#f7f9fb]/90 backdrop-blur-xl shadow-sm border-b border-[#c6c6cf]'
          : 'bg-[#f7f9fb]/80 backdrop-blur-md border-b border-[#c6c6cf]'
        }`}
    >
      <div className="flex justify-between items-center px-16 w-full max-w-[1280px] mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSu9ztjFXXL57HPmU2Tzxi3_L64jT6N2N-it5rvbfUfWfdXYJHE01o-8vaDbMMklLymKGFy1h8bgWMuq6cFCbsAWGpAlzRdnIlqlCNZGURQg-bl42EaVtpB0oh1Ad-gK8evCtIRS5ux11Sgpvn686W0Zv9ySUxOUssIE11jsJlK62yZPqSHl64xThPfeKXmVOT7T--wIzDqUmNxAViuDnvS5k1CKHkBHX3FGjpWOScub8kqDfinr_Tsn0ifKgyAVbp8f2XdxntkwI"
            alt="Spotlight Global Logo" className="h-10 w-auto" />
          <span className="font-bold text-[24px] leading-[32px] text-[#081534]">
            theSpotlightChurch
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className="text-[14px] font-semibold text-[#45464e] hover:text-[#081534] transition-colors duration-200 tracking-wide">
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <motion.div whileTap={{ scale: 0.95 }}>
          <Link href="/#connect"
            className="bg-[#081534] text-white px-6 py-2.5 rounded-full text-[14px] font-bold hover:brightness-110 transition-all">
            Join Us
          </Link>
        </motion.div>
      </div>
    </motion.nav>
  )
}