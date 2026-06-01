import Link from 'next/link'

const footerLinks = [
//   { label: 'Privacy Policy', href: '#' },
//   { label: 'Terms of Service', href: '#' },
//   { label: 'Volunteer Portal', href: '#' },
  { label: 'Contact Us', href: '#' },
]

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#c6c6cf] mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-16 py-6 w-full max-w-[1280px] mx-auto gap-4">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-bold text-[#081534] text-[16px]">theSpotlightChurch</span>
          <p className="text-[#45464e] text-[14px] mt-1">© 2026 theSpotlightChurch. Company of the Blessed.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {footerLinks.map(l => (
            <Link key={l.label} href={l.href}
              className="text-[12px] font-medium text-[#45464e] hover:text-[#081534] transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-2">
          {['share', 'mail'].map(icon => (
            <div key={icon}
              className="w-10 h-10 rounded-full bg-[#e6e8ea] flex items-center justify-center text-[#081534] cursor-pointer hover:bg-[#081534] hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}