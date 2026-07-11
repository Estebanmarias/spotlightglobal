'use client'

import { useEffect, useState } from 'react'
import ConnectForm from './ConnectForm'
import { motion } from 'framer-motion'

export default function ConnectSection() {
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [ministryCount, setMinistryCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/public/stats')
      .then(res => res.json())
      .then(data => {
        setMemberCount(data.memberCount)
        setMinistryCount(data.ministryCount)
      })
      .catch(() => {
        // Fail silently — stats section still works without the numbers,
        // just shows the loading dash instead
      })
  }, [])

  const stats = [
    { value: memberCount !== null ? `${memberCount.toLocaleString()}+` : '—', label: 'Active Members' },
    { value: ministryCount !== null ? String(ministryCount) : '—', label: 'Active Ministries' },
    { value: '24/7', label: 'Support Network' },
  ]

  return (
    <section id="connect" className="py-24 bg-[#081534] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#fdc425]/5 -skew-x-12 transform translate-x-1/2" />

      <div className="px-16 w-full max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-white"
        >
          <h2 className="text-[32px] font-bold text-[#fdc425] mb-6">Let's Get Connected</h2>
          <p className="text-[18px] leading-[28px] opacity-80 mb-10">
            We'd love to learn more about you and how we can support your journey.
            Whether you're visiting for the first time or looking to get more involved,
            fill out the form and our team will be in touch.
          </p>
          <div className="flex gap-6">
            {stats.map(s => (
              <div key={s.label} className="flex-1">
                <div className="text-[#fdc425] text-[24px] font-semibold mb-1">{s.value}</div>
                <div className="text-white/60 text-[12px] font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <ConnectForm />
        </motion.div>
      </div>
    </section>
  )
}