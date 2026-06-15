'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' } }),
}

const ministries = [
  {
    tag: 'Youth', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCK507mzR68MALcnL_8egrGjDsyp43gDwFhO-8oXPGl-Up5wGpZmwTSJYoEnaRcRe5Ms9R3Uh-HjWzvNMIBh638HgbXpYT--966omEt5qk7D2FNloNjb-5AzEW8dUw1O1anHoGSC9azRS9_7of7xgKinSpTcy3qDgtnBsKo1cWxO7Y8b5TKlDzcvT5_x20GT2wknZBiHZPi788qpwkUXtT6X7UkuJ5Q5ORn7IjhHOxQsh1kBwDMLsxZIopQYtX3DTvmlTlzmkjkiPU',
    title: 'Spotlight Youth', desc: 'Empowering the next generation to lead with faith and confidence. Grades 6-12.',
  },
  {
    tag: 'Worship', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXLp4A6zZ9-G3pLGEufW1ZXEE-dlibkPIx4lQv13aLe128yny4p38klc-X0elKx5epJB-PIMRBgJY6rIh2JpBlLDZk071FYW9NrziZUnTVn4v40S1HxuPSfWnxt2zvVXUR16GTQQMBH5BeHFvMXq0ZMKn1Nxlll90722Pb975oZMjDcLwDbO2A-e08KmmFXBafDQz0a93BuDkdNqeulsfW8SOsb_s0IfmX4D1-rx-UMGJU0rA_NPj5PmvrccLrIbI5gEr-u_5_ixc',
    title: 'Creative Arts', desc: 'Expression through music, tech, and visual arts. Join our team of creatives.',
  },
  {
    tag: 'Outreach', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2SSrY73OmUzore9TmB2GH0g4oRP7_3sZJQrzNhiXWSnwVm-33kr4MT9HPrJSX2CYl1vfa-rc_JWxBez',
    title: 'Global Outreach', desc: 'Serving our neighbors and the world. Mission trips and local partnerships.',
  },
]

const serveTeams = [
  { icon: 'stars', title: 'Hospitality Team', desc: 'Be the first face people see. Help create a welcoming environment.' },
  { icon: 'child_care', title: 'Spotlight Kids', desc: 'Invest in the lives of children through teaching and fun activities.' },
  { icon: 'videocam', title: 'Production & Tech', desc: 'Run audio, video, and lights to create a seamless experience.' },
]

export default function CommunityPage() {
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
      <header className="relative h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuABZ-M1tXcLTxRWYUxhqf7vVQu5Tehp6wRoZLqJKut6g-ElVG-7nKT-QhFX0OcMDZ-i4C5NxjlFrf5GbRtZIruinOPhgDuARx8QsXelygsaooxdR4UwCw6uhDmXssLo4ZwgzHp9xtXr3qjFncHxDP0clFIBjEZXdJ1OAhjbrWvK5G1J2NAFk3-l_yoHzxpRqZurDW-rSlHfg1iLb_9pyPny6b-fGgogMWUb1TthzaamWeOKBrtpW3Ix4CVS1ItYJokFU2kVkh46p6Q"
            alt="Community gathering"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#081534]/40 to-[#081534]/85" />
        </div>
        <div className="relative z-10 text-center px-6">
          <motion.h1 variants={fadeUp} initial="hidden" animate="show"
            className="text-[48px] sm:text-[56px] font-bold leading-[1.1] text-white mb-6">
            Grow Together in Community.
          </motion.h1>
          <motion.p variants={fadeUp} custom={1} initial="hidden" animate="show"
            className="text-[18px] leading-[28px] text-white/90 mb-10 max-w-xl mx-auto">
            Finding your place in God's family shouldn't be hard. Join a group, discover your ministry, and let's shine together.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show"
            className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/join"
              className="bg-[#fdc425] text-[#6d5200] px-8 py-4 rounded-full text-[14px] font-bold hover:brightness-110 transition-all active:scale-95">
              Find a Group
            </Link>
            <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full text-[14px] font-bold hover:bg-white/20 transition-all active:scale-95">
              Watch Stories
            </button>
          </motion.div>
        </div>
      </header>

      {/* ── Small Groups Bento ── */}
      <section className="py-24 px-6 md:px-16 max-w-[1280px] mx-auto">
        <div className="mb-12 reveal opacity-0 translate-y-8 transition-all duration-700">
          <span className="text-[#785a00] text-[12px] font-bold uppercase tracking-widest">Connect Closely</span>
          <h2 className="text-[32px] font-bold leading-[40px] text-[#081534] mt-2">Small Groups</h2>
          <p className="text-[16px] text-[#45464e] max-w-2xl mt-4">Localized gatherings that meet in homes and cafes across the city. Life is better when we walk together.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-[600px] reveal opacity-0 translate-y-8 transition-all duration-700">
          {/* Large card */}
          <div className="md:col-span-8 group relative overflow-hidden rounded-2xl bg-[#eceef0] border border-[#c6c6cf]/30">
            <img className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYd6hFSjKqzKqx5PuHPinN7kCmTr4in1pKAzPTSUKdwxE9TaJZMcG_-k3cIzFzM_NXBZ3ickivAVd_hwfpeWYp2_d8mQnREZlqPZVnv6FlU3-VFiO32qHiMni-TvQ8V9O936rXqn53k2Oc1J0JEEk1KIwm_7gAIr1ONOXKyQHVI5dvdM9Jlc2L6ocux6Sor_LaVjzyEai9ZqsBEXr56ciB2tgrGTPmaH7RJ-YszRoBafMYXuGtVhNMJ4bz1JxVXNnMWff5mUmSEFQ"
              alt="Downtown Young Professionals" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#081534]/80 to-transparent flex flex-col justify-end p-8">
              <h3 className="text-[24px] font-semibold text-white">Downtown Young Professionals</h3>
              <p className="text-[16px] text-white/80 mt-2">Tuesday Nights · Coffee &amp; Connection</p>
              <button className="mt-4 w-fit bg-[#fdc425] text-[#6d5200] px-6 py-2 rounded-full text-[14px] font-bold">Learn More</button>
            </div>
          </div>
          {/* Small card 1 */}
          <div className="md:col-span-4 group relative overflow-hidden rounded-2xl bg-[#eceef0] border border-[#c6c6cf]/30">
            <img className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1xcM7q-L7TTCBtWVYzesuGaHoSG5CeI1VCNEoZfU4FPD0NsVS1kHsrawjDbeLC7bo1wh9D8FTB7zgOutfquV_swYMIhChNFqH3714SctQp6w2SoHNDfLOo8wYmQdetfv_V8LCfA67D5JClxwH2RxbcT8huRBzgtZa-0IvBimfbCKsc4VDFTdQLhjClLhCrxOJBGwd0pFF6AuxNA9xTYIbwjsJEMX580ifKP3feygEXahDgfIZoLdpm-Jh4XwJK8ObOsYuSo-XpAg"
              alt="Eastside Families" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#081534]/80 to-transparent flex flex-col justify-end p-8">
              <h3 className="text-[24px] font-semibold text-white">Eastside Families</h3>
              <p className="text-[16px] text-white/80 mt-2">Sunday Afternoons · For all ages</p>
              <button className="mt-4 w-fit bg-[#fdc425] text-[#6d5200] px-6 py-2 rounded-full text-[14px] font-bold">Learn More</button>
            </div>
          </div>
          {/* Small card 2 */}
          <div className="md:col-span-4 group relative overflow-hidden rounded-2xl bg-[#eceef0] border border-[#c6c6cf]/30">
            <img className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVqEgmmW2RRi7Zvlx5GiWIGqQUUEmLAVQPhLkGvaMBMB36ECUsXSXlv5p6vbuGM5vf1mCODPP8fHdln52jzkApCXSTL_8EiEdLaD3y6w6Zl739xYiOuLXMRPoNT7ZiSoJQSFOCsuLaX5BHnt2iR2oGZBDckNzMyXqnRoCpqEffAvYArHLpz0fvLmpQbaLrZVsmDzmZi5A5r1IJSwmtISYh8-H5ub0udZ0jht5z1HTDZYT2C6Oc0PwChD48ZOlmdm3exxyVc0v3ExI"
              alt="West End Study" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#081534]/80 to-transparent flex flex-col justify-end p-8">
              <h3 className="text-[24px] font-semibold text-white">West End Study</h3>
              <p className="text-[16px] text-white/80 mt-2">Wednesday Evenings · Deep Dives</p>
              <button className="mt-4 w-fit bg-[#fdc425] text-[#6d5200] px-6 py-2 rounded-full text-[14px] font-bold">Learn More</button>
            </div>
          </div>
          {/* Host CTA */}
          <div className="md:col-span-8 flex items-center justify-center bg-[#1e2a4a] rounded-2xl p-12 text-center border border-[#c6c6cf]/30">
            <div>
              <h3 className="text-[32px] font-bold text-[#8691b7]">Can't find a group near you?</h3>
              <p className="text-[18px] text-[#8691b7]/80 mt-4 mb-8">We are always launching new groups. Start one in your neighborhood today.</p>
              <button className="bg-white text-[#081534] px-8 py-4 rounded-full text-[14px] font-bold hover:bg-[#fdc425] hover:text-[#6d5200] transition-colors">Host a Group</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ministries ── */}
      <section className="bg-[#f2f4f6] py-24">
        <div className="px-6 md:px-16 max-w-[1280px] mx-auto">
          <div className="text-center mb-16 reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-[32px] font-bold leading-[40px] text-[#081534]">Explore Our Ministries</h2>
            <p className="text-[16px] text-[#45464e] max-w-xl mx-auto mt-4">There's a place for everyone to belong and grow at theSpotlightChurch.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ministries.map((m, i) => (
              <div key={m.title}
                className="reveal opacity-0 translate-y-8 transition-all duration-700 bg-white rounded-xl overflow-hidden border border-[#c6c6cf] hover:shadow-lg hover:-translate-y-1"
                style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="h-48 relative">
                  <img className="w-full h-full object-cover" src={m.img} alt={m.title} />
                  <div className="absolute top-4 left-4 bg-[#fdc425] text-[#6d5200] px-3 py-1 rounded-full text-[12px] font-bold">{m.tag}</div>
                </div>
                <div className="p-6">
                  <h3 className="text-[24px] font-semibold text-[#081534]">{m.title}</h3>
                  <p className="text-[16px] text-[#45464e] mt-3 mb-6">{m.desc}</p>
                  <a className="text-[#081534] font-bold hover:text-[#fdc425] transition-colors flex items-center gap-2 text-[14px]" href="#">
                    Learn More <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Serve ── */}
      <section className="py-24 px-6 md:px-16 max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 reveal opacity-0 translate-y-8 transition-all duration-700">
            <img className="rounded-2xl shadow-xl w-full aspect-square object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1qgsr1RH8zwLXZTP889JOly-Pkhs9j8aSItN9OSNu67GizLZy3mHFe-vA-PNSyyK724ol82y1XSmjeaW7yT2P7wM5QOrc8TXxzOVDLBVgsl53ZiJ9AgunagGk3tsGt1YDBcxva4G03WVjfgwj4cMMvBfkjz3C6s1DotcCyFKYDRS5lG6kzJ4gK4soNt2Yaki0vQh3RJGkDCqm0PGLTlOy4RrecR9mxoCKnNznHeLHpriiHjO1RGtQsne03vRRR0lSpH_GXMJuxTs"
              alt="Volunteers" />
          </div>
          <div className="flex-1 reveal opacity-0 translate-y-8 transition-all duration-700">
            <span className="text-[#785a00] text-[12px] font-bold uppercase tracking-widest">Your Contribution Matters</span>
            <h2 className="text-[32px] font-bold leading-[40px] text-[#081534] mt-4">Finding Your Place to Serve</h2>
            <p className="text-[18px] leading-[28px] text-[#45464e] mt-6 mb-8">
              We believe everyone has unique gifts. Whether you love meeting new people, working behind the scenes, or teaching kids, there is a role for you on our serve teams.
            </p>
            <ul className="space-y-6 mb-10">
              {serveTeams.map(s => (
                <li key={s.title} className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#785a00] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  <div>
                    <h4 className="text-[18px] font-semibold text-[#081534]">{s.title}</h4>
                    <p className="text-[16px] text-[#45464e]">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/join"
              className="inline-block bg-[#081534] text-white px-8 py-4 rounded-full text-[14px] font-bold hover:opacity-90 transition-all shadow-lg">
              Join a Serve Team
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stay Connected ── */}
      <section className="bg-[#081534] py-20">
        <div className="px-6 md:px-16 max-w-[1280px] mx-auto text-center reveal opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-[32px] font-bold text-white mb-6">Stay Connected</h2>
          <p className="text-[18px] text-[#8691b7] mb-10 max-w-xl mx-auto">Sign up for our weekly community update to never miss a group gathering or event.</p>
          <div className="flex flex-col md:flex-row justify-center gap-4 max-w-md mx-auto">
            <input
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#fdc425]"
              placeholder="Enter your email" type="email" />
            <button className="bg-[#fdc425] text-[#6d5200] px-8 py-4 rounded-full text-[14px] font-bold hover:brightness-110 transition-colors">Subscribe</button>
          </div>

          {/* Social links with proper SVG icons */}
          <div className="flex justify-center gap-4 mt-12">
            {/* WhatsApp */}
            <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <svg viewBox="0 0 32 32" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 1C7.716 1 1 7.716 1 16c0 2.628.664 5.1 1.83 7.263L1 31l7.97-1.796A14.93 14.93 0 0 0 16 31c8.284 0 15-6.716 15-15S24.284 1 16 1zm6.733 19.083c-.369-.185-2.184-1.078-2.523-1.2-.34-.123-.587-.185-.834.185-.247.37-.957 1.2-1.173 1.447-.216.247-.432.277-.8.092-.37-.185-1.56-.575-2.972-1.833-1.098-.98-1.84-2.19-2.056-2.56-.216-.37-.023-.57.162-.754.167-.166.37-.432.554-.648.185-.216.247-.37.37-.617.123-.247.062-.463-.031-.648-.092-.185-.834-2.01-1.143-2.753-.3-.722-.606-.624-.834-.636l-.709-.012c-.247 0-.648.092-.988.463-.34.37-1.296 1.267-1.296 3.089s1.327 3.583 1.512 3.83c.185.247 2.61 3.986 6.326 5.59.884.382 1.573.61 2.11.78.886.282 1.692.242 2.329.147.71-.106 2.184-.893 2.492-1.756.308-.863.308-1.603.216-1.756-.092-.154-.339-.247-.709-.432z" fill="#25D366"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <svg viewBox="0 0 32 32" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f09433"/>
                    <stop offset="50%" stopColor="#dc2743"/>
                    <stop offset="100%" stopColor="#bc1888"/>
                  </linearGradient>
                </defs>
                <path d="M16 2.88c3.506 0 3.923.014 5.31.077 1.28.058 1.977.272 2.44.452.614.238 1.052.524 1.512.984.46.46.746.898.984 1.512.18.463.394 1.16.452 2.44.063 1.387.077 1.804.077 5.31s-.014 3.923-.077 5.31c-.058 1.28-.272 1.977-.452 2.44-.238.614-.524 1.052-.984 1.512-.46.46-.898.746-1.512.984-.463.18-1.16.394-2.44.452-1.387.063-1.804.077-5.31.077s-3.923-.014-5.31-.077c-1.28-.058-1.977-.272-2.44-.452a4.07 4.07 0 0 1-1.512-.984 4.07 4.07 0 0 1-.984-1.512c-.18-.463-.394-1.16-.452-2.44C2.894 19.923 2.88 19.506 2.88 16s.014-3.923.077-5.31c.058-1.28.272-1.977.452-2.44.238-.614.524-1.052.984-1.512.46-.46.898-.746 1.512-.984.463-.18 1.16-.394 2.44-.452C12.077 2.894 12.494 2.88 16 2.88zM16 1c-3.567 0-4.012.015-5.41.079-1.396.064-2.35.285-3.184.61a6.43 6.43 0 0 0-2.323 1.513A6.43 6.43 0 0 0 3.57 5.525c-.325.834-.546 1.788-.61 3.184C2.894 10.108 2.88 10.552 2.88 16s.015 5.892.079 7.291c.064 1.396.285 2.35.61 3.184a6.43 6.43 0 0 0 1.513 2.323 6.43 6.43 0 0 0 2.323 1.513c.834.325 1.788.546 3.184.61C10.988 30.985 11.432 31 16 31s5.012-.015 6.41-.079c1.396-.064 2.35-.285 3.184-.61a6.43 6.43 0 0 0 2.323-1.513 6.43 6.43 0 0 0 1.513-2.323c.325-.834.546-1.788.61-3.184.064-1.399.079-1.843.079-7.291s-.015-5.892-.079-7.291c-.064-1.396-.285-2.35-.61-3.184a6.43 6.43 0 0 0-1.513-2.323A6.43 6.43 0 0 0 25.594 1.69c-.834-.325-1.788-.546-3.184-.61C21.012 1.015 20.567 1 16 1z" fill="url(#ig)"/>
                <path d="M16 8.27A7.73 7.73 0 1 0 16 23.73 7.73 7.73 0 0 0 16 8.27zm0 12.74A5.01 5.01 0 1 1 16 10.99 5.01 5.01 0 0 1 16 21.01zM23.845 6.595a1.805 1.805 0 1 0 0 3.61 1.805 1.805 0 0 0 0-3.61z" fill="url(#ig)"/>
              </svg>
            </a>
            {/* YouTube */}
            <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <svg viewBox="0 0 32 32" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                <path d="M29.41 9.26a3.5 3.5 0 0 0-2.47-2.47C24.76 6.2 16 6.2 16 6.2s-8.76 0-10.94.59A3.5 3.5 0 0 0 2.59 9.26 36.6 36.6 0 0 0 2 16a36.6 36.6 0 0 0 .59 6.74 3.5 3.5 0 0 0 2.47 2.47C7.24 25.8 16 25.8 16 25.8s8.76 0 10.94-.59a3.5 3.5 0 0 0 2.47-2.47A36.6 36.6 0 0 0 30 16a36.6 36.6 0 0 0-.59-6.74zM13.2 20.2V11.8l7.3 4.2-7.3 4.2z" fill="#FF0000"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

    </main>
  )
}