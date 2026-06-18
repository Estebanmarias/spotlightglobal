'use client'

import { motion } from 'framer-motion'

const ministries = [
  {
    name: 'Media Team', desc: 'Empowering the next generation to lead with faith.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnqPUzQDzwfLD6eg1bu0ybLckdsDkN_qiQvU1w6sndZ-197SwBp88YuzxejjVOFfyXE1pyXwG8tlQ5sPJmFKLgtb2Dw58bxMecn1wPSsdDLC00s7itVHqjrNfuvdKr6Sq9g5H8XrxaUsvlxS1E8qRdJiHfsDe2-PDgsCIDpf7epF8QqtvT4B_R2YqpxNVVoZOHTl95RiK0tkNaGgwtzPCHKe1nas79k8MX1naNVGFP_TeO8GajubXxhqNjn6ZHfg2kTBVCTrGInT8',
    col: 'md:col-span-2 md:row-span-1',
  },
  {
    name: 'Spotlight Worship', desc: 'Music and liturgy that touches the soul.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYuMUTfe2jUxE9-fvjz8BUszSKduChiEHNBYz6DH0kKH-6rMuhGG1nJ3CzPlq1aDg8jwK71TWjzw-787BgqZzhyydy7DzZfoJ-2lTTyeT0z0iTRucCM6Zhir-fCetrXrWGE0op1pt38qqARR_TSWQoKhsGvsMXiO55Wx4ShWJcnUPtlxRrkjgms3rQoqEdUr4zxjQZvoXHl-q9vkQcDnCym0lgNz7zOM3OQxci4_-ehkLk6dhv9itZYVLdnXPvyAx0z8R3d_WqoHM',
    col: 'md:col-span-1 md:row-span-2',
  },
  {
    name: 'Welfare & Program', desc: 'Fun and safe faith foundations.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7ku22GaPTigytuJv8Mrv3kKsrrjdWAlzK8fe4RQV30Be-wLfAScV_fDTQ-QDEMXGtN-PtS5N7hT3EHVAfjPJDhLHPxCs_2Lo4mHsZaHuUK73Bdb5gJODWvm6EUSoLrmbzhufzkBb1lEQyG7_Op7he1HxqVjTusGsl70n92N3NOIqnsOCF_FDFaSiKVNUPZeWX5VmYLLdohomefelshRorKbMPDX2kC0M1kHqn67ZtjpDCNeTHG-50MYMR7feTDZrVq5PxyTu-6-s',
    col: 'md:col-span-1 md:row-span-1',
  },
  {
    name: 'Evangelism & Outreach', desc: 'Making a tangible difference in our local community.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoDHWXqpvM09TjqphSJG_LMqwVWC3s1pzH63w3GdwXdbOitbopfaAI3TJXcVXuQi11nsNhXt4PUGhTBaqYmIDzlUwDjy4yz23bEjxs3EB696IDr79A8vXYa1SmGMQKeLyXmagNJcdiGcb3D08chMBjOPVPfYXIWXJX9LNII6Zq5SXmkfzQh9bAYxO3-d4mp6Kq2LsgZJ2iEulwB5fcPY2Rm7X6zsK2XwYRtXgAAR1MMJQ2azqWtA5zih_xuRnOcgHW3nEV3HQ3UVk',
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