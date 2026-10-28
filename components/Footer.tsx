'use client'

import CookieSettingsButton from '@/components/CookieSettingsButton'
import Icon from '@/components/Icon'
import BrandIcon from '@/components/BrandIcon'
import Link from 'next/link'

const exploreLinks = [
  { label: 'Our Vision',  href: '/vision' },
  { label: 'Community',   href: '/community' },
  // { label: 'Partner',     href: '/partner' },
  // { label: 'Giving',      href: '/giving' },
  { label: 'Devotionals', href: '/devotionals' },
]

const legalLinks = [
  { label: 'Contact Us',       href: '/contact' },
  { label: 'Privacy Policy',   href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-and-service' },
]

type Social = { name: string; href: string; brand?: string; icon?: string }

const socials: Social[] = [
  { name: 'WhatsApp',  href: 'https://wa.me/2348115316745', brand: 'whatsapp' },
  { name: 'Email',     href: 'mailto:officialspotlightglobal@gmail.com', icon: 'mail' },
  { name: 'YouTube',   href: 'https://www.youtube.com/@thespotlightchurch', brand: 'youtube' },
  { name: 'Instagram', href: 'https://instagram.com/thespotlightchurch', brand: 'instagram' },
  { name: 'Spotify',   href: 'https://open.spotify.com/show/75PSP2x3mArsPABn4KReUY?si=Jc1MU9kaTPu_b0roC20Rig', brand: 'spotify' },
]

export default function Footer() {
  return (
    <footer className="bg-[#081534] text-white mt-auto">
      <div className="px-4 sm:px-8 lg:px-16 py-12 sm:py-16 w-full max-w-[1280px] mx-auto">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <span className="font-bold text-[20px] text-[#fdc425]">theSpotlightChurch</span>
            <p className="text-white/60 text-[13px] mt-3 leading-relaxed max-w-xs">
              Company of the Blessed — we are a People Marvelously Helped, Greatly Blessed, Deeply Loved, and Highly Favored.
            </p>
            <Link href="/join" className="inline-block mt-5 bg-[#fdc425] text-[#6d5200] px-6 py-2.5 rounded-full text-[13px] font-bold hover:brightness-110 transition-all active:scale-95">
              Join Us
            </Link>
          </div>
          <div>
            <h5 className="text-[11px] font-bold text-[#fdc425] uppercase tracking-widest mb-4">Explore</h5>
            <ul className="space-y-2.5">
              {exploreLinks.map(l => (
                <li key={l.href}><Link href={l.href} className="text-[14px] text-white/70 hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-[11px] font-bold text-[#fdc425] uppercase tracking-widest mb-4">Get Involved</h5>
            <ul className="space-y-2.5">
              <li><Link href="/join"    className="text-[14px] text-white/70 hover:text-white transition-colors">Become a Member</Link></li>
              <li><Link href="/partner" className="text-[14px] text-white/70 hover:text-white transition-colors">Partnership</Link></li>
              <li><Link href="/giving"  className="text-[14px] font-semibold text-[#fdc425] hover:brightness-110 transition-all">Give Now</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[11px] font-bold text-[#fdc425] uppercase tracking-widest mb-4">Legal</h5>
            <ul className="space-y-2.5">
              {legalLinks.map(l => (
                <li key={l.label}><Link href={l.href} className="text-[14px] text-white/70 hover:text-white transition-colors">{l.label}</Link></li>
              ))}
              <li><CookieSettingsButton /></li>
            </ul>
          </div>
        </div>

        {/* ── Pastor snippet — shows on all pages ── */}
        <div className="border-t border-white/10 py-6">
          <Link href="/pastor" className="group inline-flex items-center gap-4 hover:opacity-90 transition-opacity">
            <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-[#fdc425]/50 shrink-0">
              <img src="/images/apostle-1.jpg" alt="Apostle Edet Kingsley" className="w-full h-full object-cover object-top" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#fdc425] uppercase tracking-widest leading-none mb-1">Lead Pastor</p>
              <p className="text-white text-[14px] font-bold leading-none">Apostle Edet Kingsley</p>
              <p className="text-white/40 text-[11px] group-hover:text-[#fdc425] transition-colors flex items-center gap-0.5 mt-1">
                Learn more <Icon name="arrow_forward" className="text-[12px]" />
              </p>
            </div>
          </Link>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-[12px] text-center sm:text-left">© 2026 theSpotlightChurch. Company of the Blessed.</p>
          <div className="flex gap-2.5">
            {socials.map(s => (
              <a
                key={s.name}
                href={s.href}
                aria-label={s.name}
                {...(!s.href.startsWith('mailto:') && { target: '_blank', rel: 'noreferrer' })}
                className="group w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#fdc425] transition-all active:scale-90"
              >
                {s.brand ? (
                  <BrandIcon name={s.brand} className="h-4 w-4 text-white transition-colors group-hover:text-[#6d5200]" />
                ) : (
                  <Icon name={s.icon!} className="text-[16px] text-white transition-colors group-hover:text-[#6d5200]" />
                )}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}