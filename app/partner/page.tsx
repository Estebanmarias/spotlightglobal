'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' } }),
}

const partners = [
  {
    icon: 'water_drop',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9a_lLA96l_GrVMgRwzfru8OVbZK_a0sjIkHJChnhgY_8RcqxSNBqTiNcnUM5__6v8QCF8s15yPO0SXfb42nbM9ltxAyDDT5qN-4OKQgpPyfidIac6znoFux8cujIesnrdsWgxQ33ZyZWjSFacKwzKlWs-phSCem_paL_n8jRuI-a-Z5b_CnREsikbi24jwauLhh1lQOSUJ5ZialeXszi98gIGiXWnd5uJDAdp_vQFEpqIa9JG9L7oS9V6ghFIMyCd7rlP7IZo_Nc',
    title: 'Clean Water Initiative',
    desc: 'Providing sustainable clean water solutions to remote communities in Sub-Saharan Africa through well-drilling and education.',
  },
  {
    icon: 'group',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChpSxMou7MKAfEIVkQaKvpdapCmbMFIP7lzgj9joH8WTMJCUtnU7l2KhW9769RShncpUsi7S2uipid0gAnJDyct9ACRibN5wqTiyswe9bQFDvLXUla7DgTvac22NlPkqyuRc8C_vM44nW84bO2zHjtLeXlsmscIb1nVTy3OjOCTgqZBr-trhauEcUU_iTguTDTSTCE8u6vOBqJ7KTxVU0SqDP_Za2EvPcJRFkgpvqy5sd6AyBhJ84CcQ49viNsbDYyMNFQ11fO3VY',
    title: 'Global Youth Outreach',
    desc: 'Mentorship and leadership programs for at-risk youth across Africa and beyond, fostering the next generation of global citizens.',
  },
  {
    icon: 'restaurant',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApyhVdDRCAD_vJvLAZ18Llz56ShJfp5daitl-8ZuVGLHEX0k48MyAE-7jhhDnJcoH9ptfrMXp4FsLKMLDmne98JphzUW_3pjv_yEN6xu4L8HAMzISXWPgHVTUEY-tq_XpvTxZBaSZ2ymwYAHTnOBP1ZMqKGmOZtBx8cS2GMMaVHHGPd7ygLpI88YhKk95kdJhKKBc8SXwupY45GWiyE3k1hMBEb2xpvCPHFt4AISIZX7ZWakYjqWEUK_NVCJ3zWtAmjke44Lf6RCY',
    title: 'Local Food Bank',
    desc: 'Fighting food insecurity in our own backyard through a network of community pantries and nutritional education in Karu and Abuja.',
  },
]

const stats = [
  { value: '45+', label: 'Global Partners' },
  { value: '12', label: 'Countries Reached' },
  { value: '150k+', label: 'Lives Impacted Yearly' },
]

export default function PartnerPage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0')
          entry.target.classList.remove('opacity-0', 'translate-y-8')
        }
      })
    }, { threshold: 0.1 })
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">

      {/* ── Hero ── */}
      <section className="relative min-h-[700px] flex items-center overflow-hidden bg-[#081534] py-24">
        <div className="absolute inset-0 opacity-20">
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-boSLcoybg2g65XtpwjNhf75TuUo_Rt_xjHPCCdPNQKUxlPJT-YB29CtuJnY0i_bO1DaveuFTFVGofkfoZ56LHrnDAnaggGSjLknBlm8IXtzGqRberZ8kFXm0DIOmbWOeVH7g4bTlHvedJTRJAkH6VDZaeB-V_kOP49wZ4uLHMhQAdeskOhmClZdjH9Y5XR0Ki8-hV0pVif1tkqRgZnTl5-gHeDvdvr2ycRurIfeYolte4jEs_P7MQEPoBkAJR3ywxQXNkCbOvLg"
            alt="Global reach"
          />
        </div>
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 relative z-10">
          <div className="max-w-3xl">
            <motion.span
              variants={fadeUp} initial="hidden" animate="show"
              className="inline-block px-4 py-1 bg-[#fdc425] text-[#6d5200] rounded-full text-[14px] font-bold mb-6">
              Partnerships
            </motion.span>
            <motion.h1
              variants={fadeUp} custom={1} initial="hidden" animate="show"
              className="text-[48px] sm:text-[56px] font-bold leading-[1.1] text-white mb-6">
              Our Global Reach
            </motion.h1>
            <motion.p
              variants={fadeUp} custom={2} initial="hidden" animate="show"
              className="text-[18px] leading-[28px] text-[#8691b7] mb-10">
              At theSpotlightChurch, we are called to be a light not just in Karu and Abuja, but across the globe. Through strategic local and international partnerships, we are committed to sustainable mission work that heals communities and restores hope.
            </motion.p>
            <motion.div
              variants={fadeUp} custom={3} initial="hidden" animate="show"
              className="flex flex-wrap gap-4">
              <button className="bg-[#fdc425] text-[#6d5200] px-8 py-4 rounded-lg text-[14px] font-bold hover:brightness-110 transition-all active:scale-95">
                Explore Missions
              </button>
              <button className="border border-white/30 text-white px-8 py-4 rounded-lg text-[14px] font-bold hover:bg-white/10 transition-all active:scale-95">
                View Annual Report
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 bg-[#f7f9fb] border-b border-[#c6c6cf]/30">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {stats.map((s, i) => (
              <div key={s.label} className="reveal opacity-0 translate-y-8 transition-all duration-700 flex flex-col items-center"
                style={{ transitionDelay: `${i * 100}ms` }}>
                <span className="text-[56px] font-bold leading-[64px] text-[#785a00] mb-2">{s.value}</span>
                <span className="text-[14px] font-bold text-[#45464e] uppercase tracking-widest">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner Directory ── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16">
          <div className="mb-16 reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-[32px] font-bold leading-[40px] text-[#081534] mb-4">Partner Directory</h2>
            <p className="text-[16px] text-[#45464e] max-w-2xl">We collaborate with organisations that share our values and vision for a better world. Every partner is vetted for impact and transparency.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {partners.map((p, i) => (
              <div key={p.title}
                className="reveal opacity-0 translate-y-8 transition-all duration-700 group bg-white border border-[#c6c6cf] rounded-xl overflow-hidden hover:shadow-xl transition-all flex flex-col"
                style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="h-56 overflow-hidden bg-[#eceef0]">
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={p.img} alt={p.title} />
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="p-2 bg-[#fdc425]/20 rounded-lg text-[#785a00]">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                    </span>
                    <h3 className="text-[24px] font-semibold text-[#081534]">{p.title}</h3>
                  </div>
                  <p className="text-[16px] text-[#45464e] mb-8 flex-grow">{p.desc}</p>
                  <a className="inline-flex items-center gap-2 text-[#785a00] text-[14px] font-bold hover:gap-4 transition-all" href="#">
                    Learn More <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Become a Partner ── */}
      <section className="py-24 bg-[#f7f9fb]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch reveal opacity-0 translate-y-8 transition-all duration-700">
            {/* Left CTA */}
            <div className="lg:col-span-7 bg-[#081534] rounded-2xl p-12 text-white flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-24 -top-24 w-96 h-96 bg-[#fdc425]/10 rounded-full blur-3xl" />
              <h2 className="text-[32px] font-bold leading-[40px] mb-6">Become a Partner</h2>
              <p className="text-[18px] leading-[28px] text-[#8691b7] mb-10 max-w-xl">
                Are you an organisation looking to expand your impact? Or an individual with a heart for service? We are always looking for passionate partners to join our network. Together, we can reach further and shine brighter — from Karu to the ends of the earth.
              </p>
              <div>
                <Link href="/join"
                  className="inline-block bg-[#fdc425] text-[#6d5200] px-10 py-5 rounded-lg text-[14px] font-bold hover:brightness-110 transition-all active:scale-95">
                  Partner with Us
                </Link>
              </div>
            </div>
            {/* Right cards */}
            <div className="lg:col-span-5 grid grid-rows-2 gap-8">
              <div className="bg-white border border-[#c6c6cf] p-8 rounded-2xl flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#081534] flex-shrink-0">
                  <span className="material-symbols-outlined text-[30px]">corporate_fare</span>
                </div>
                <div>
                  <h4 className="text-[24px] font-semibold text-[#081534] mb-1">Organisations</h4>
                  <p className="text-[16px] text-[#45464e]">Join our strategic mission network for long-term collaboration and impact.</p>
                </div>
              </div>
              <div className="bg-white border border-[#c6c6cf] p-8 rounded-2xl flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#081534] flex-shrink-0">
                  <span className="material-symbols-outlined text-[30px]">person</span>
                </div>
                <div>
                  <h4 className="text-[24px] font-semibold text-[#081534] mb-1">Individuals</h4>
                  <p className="text-[16px] text-[#45464e]">Volunteer your skills or support specific projects financially.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16">
          <div className="max-w-4xl mx-auto bg-[#f2f4f6] rounded-3xl p-12 text-center border border-[#c6c6cf]/50 reveal opacity-0 translate-y-8 transition-all duration-700">
            <span className="material-symbols-outlined text-[#785a00] text-[48px] mb-6 block" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
            <h2 className="text-[32px] font-bold leading-[40px] text-[#081534] mb-4">Stay Connected</h2>
            <p className="text-[18px] leading-[28px] text-[#45464e] mb-10 max-w-xl mx-auto">
              Sign up for our missions newsletter to receive impact reports and urgent prayer requests from our global partners.
            </p>
            <div className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
              <input
                className="flex-grow bg-white border border-[#c6c6cf] rounded-lg px-6 py-4 focus:ring-2 focus:ring-[#081534] focus:border-transparent outline-none text-[16px]"
                placeholder="Enter your email address"
                type="email"
              />
              <button className="bg-[#081534] text-white px-8 py-4 rounded-lg text-[14px] font-bold hover:opacity-90 transition-all whitespace-nowrap active:scale-95">
                Subscribe to Updates
              </button>
            </div>
            <p className="mt-6 text-[#45464e] text-[12px]">We respect your privacy. Unsubscribe at any time.</p>
          </div>
        </div>
      </section>

    </main>
  )
}