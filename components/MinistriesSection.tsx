'use client'

import { motion } from 'framer-motion'

const ministries = [
  {
    name: 'Media Team', desc: 'Empowering the next generation to lead with faith.',
    img: '/images/media.jpg',
    col: 'md:col-span-2 md:row-span-1',
  },
  {
    name: 'Spotlight Worship', desc: 'Music and liturgy that touches the soul.',
    img: '/images/fade.jpg',
    col: 'md:col-span-1 md:row-span-2',
  },
  {
    name: 'Welfare & Program', desc: 'Fun and safe faith foundations.',
    img: '/images/welfare.jpg',
    col: 'md:col-span-1 md:row-span-1',
  },
  {
    name: 'Evangelism & Outreach', desc: 'Making a tangible difference in our local community.',
    img: '/images/OUTREACH-4.jpg',
    col: 'md:col-span-2 md:row-span-1',
  },
]

export default function MinistriesSection() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="px-4 sm:px-8 lg:px-16 w-full max-w-[1280px] mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-[#081534] mb-3 sm:mb-4">Ministries for Everyone</h2>
          <p className="text-[14px] sm:text-[16px] text-[#45464e] max-w-xl mx-auto">
            Discover where you belong within our vibrant community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 sm:gap-6 h-auto md:h-[600px]">
          {ministries.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`${m.col} group relative overflow-hidden rounded-xl border border-[#c6c6cf] flex flex-col justify-end hover:border-[#081534] transition-all h-[220px] sm:h-[260px] md:h-auto`}
            >
              <div className="absolute inset-0 z-0">
                <img src={m.img} alt={m.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,21,52,0.9), transparent)' }} />
              </div>
              <div className="relative z-10 p-4 sm:p-6">
                <h3 className="text-[18px] sm:text-[22px] lg:text-[24px] font-semibold text-white">{m.name}</h3>
                <p className="text-[13px] sm:text-[15px] lg:text-[16px] text-white/80">{m.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}