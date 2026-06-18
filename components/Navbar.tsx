'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { label: 'Our Vision', href: '/vision' },
  { label: 'Community', href: '/community' },
  { label: 'Partner', href: '/partner' },
  { label: 'Giving', href: '/giving' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`sticky top-0 z-50 w-full h-16 sm:h-20 flex items-center transition-all duration-300
          ${scrolled
            ? 'bg-[#f7f9fb]/90 backdrop-blur-xl shadow-sm border-b border-[#c6c6cf]'
            : 'bg-[#f7f9fb]/80 backdrop-blur-md border-b border-[#c6c6cf]'
          }`}
      >
        <div className="flex justify-between items-center px-4 sm:px-8 lg:px-16 w-full max-w-[1280px] mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-w-0" onClick={() => setOpen(false)}>
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSu9ztjFXXL57HPmU2Tzxi3_L64jT6N2N-it5rvbfUfWfdXYJHE01o-8vaDbMMklLymKGFy1h8bgWMuq6cFCbsAWGpAlzRdnIlqlCNZGURQg-bl42EaVtpB0oh1Ad-gK8evCtIRS5ux11Sgpvn686W0Zv9ySUxOUssIE11jsJlK62yZPqSHl64xThPfeKXmVOT7T--wIzDqUmNxAViuDnvS5k1CKHkBHX3FGjpWOScub8kqDfinr_Tsn0ifKgyAVbp8f2XdxntkwI"
              alt="Spotlight Global Logo" className="h-8 sm:h-10 w-auto shrink-0" />
            <span className="font-bold text-[16px] sm:text-[20px] lg:text-[24px] leading-tight text-[#081534] truncate">
              theSpotlightChurch
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className="text-[14px] font-semibold text-[#45464e] hover:text-[#081534] transition-colors duration-200 tracking-wide">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <motion.div whileTap={{ scale: 0.95 }} className="hidden lg:block">
            <Link href="/join"
              className="bg-[#081534] text-white px-6 py-2.5 rounded-full text-[14px] font-bold hover:brightness-110 transition-all">
              Join Us
            </Link>
          </motion.div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(p => !p)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-[#081534] hover:bg-[#eceef0] transition-colors"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span className="material-symbols-outlined text-[26px]">{open ? 'close' : 'menu'}</span>
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 top-16 sm:top-20 bg-black/40 z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="fixed top-16 sm:top-20 left-0 right-0 z-40 lg:hidden bg-white border-b border-[#c6c6cf] shadow-lg"
            >
              <div className="flex flex-col px-4 sm:px-8 py-4 gap-1 max-w-[1280px] mx-auto">
                {links.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                    className="px-4 py-3 rounded-lg text-[15px] font-semibold text-[#191c1e] hover:bg-[#f2f4f6] hover:text-[#081534] transition-colors">
                    {l.label}
                  </Link>
                ))}
                <Link href="/join" onClick={() => setOpen(false)}
                  className="mt-2 bg-[#081534] text-white text-center px-6 py-3 rounded-full text-[14px] font-bold hover:brightness-110 transition-all">
                  Join Us
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}