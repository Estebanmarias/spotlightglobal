'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const communities = [
  {
    label: 'Join the Chat', name: 'WhatsApp', icon: 'chat',
    color: 'bg-green-50 text-green-600', href: '#',
  },
  {
    label: 'Get Updates', name: 'Telegram', icon: 'send',
    color: 'bg-blue-50 text-blue-500', href: '#',
  },
  {
    label: 'Follow Stories', name: 'Instagram', icon: 'photo_camera',
    color: 'bg-pink-50 text-pink-500', href: '#',
  },
  {
    label: 'Stay Informed', name: 'X Community', icon: 'campaign',
    color: 'bg-slate-50 text-slate-900', href: '#',
  },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function SuccessContent() {
  const params = useSearchParams()
  const name = params.get('name') || 'Friend'

  return (
    <main className="flex-grow flex items-center justify-center py-14 sm:py-20 px-4">
      <div className="max-w-4xl w-full text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-8 sm:mb-10 inline-block relative"
        >
          <div className="absolute inset-0 bg-[#fdc425] blur-3xl opacity-20 rounded-full" />
          <div className="relative bg-white border border-[#c6c6cf] p-6 sm:p-8 rounded-full inline-flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[#fdc425] text-[48px] sm:text-6xl"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              celebration
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-3 sm:space-y-4 mb-12 sm:mb-16"
        >
          <h1 className="text-[28px] sm:text-[40px] md:text-[56px] font-bold leading-tight text-[#081534] px-2">
            Welcome to the Family, {name}!
          </h1>
          <p className="text-[15px] sm:text-[18px] leading-[24px] sm:leading-[28px] text-[#45464e] max-w-2xl mx-auto px-2">
            We are thrilled to have you join our global community. Your light is a unique
            addition to our mission of spreading hope and love across the world.
          </p>
        </motion.div>

        {/* Community cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-4 mb-14 sm:mb-20"
        >
          {communities.map(c => (
            <motion.a
              key={c.name}
              variants={itemVariants}
              href={c.href}
              whileHover={{ y: -4 }}
              className="group bg-white border border-[#c6c6cf] p-6 sm:p-8 rounded-xl flex flex-col items-center text-center hover:border-[#fdc425] hover:shadow-lg transition-all duration-300"
            >
              <div className={`mb-4 p-3 rounded-full ${c.color} group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-3xl sm:text-4xl">{c.icon}</span>
              </div>
              <span className="text-[13px] sm:text-[14px] font-semibold text-[#45464e] mb-1">{c.label}</span>
              <h3 className="text-[20px] sm:text-[24px] font-semibold text-[#081534] group-hover:text-[#785a00] transition-colors">
                {c.name}
              </h3>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[12px] text-[#45464e] flex items-center gap-1">
                  Connect now
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
        >
          <Link href="/"
            className="w-full sm:w-auto bg-[#081534] text-white px-8 py-4 rounded-full text-[14px] font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-md">
            Back to Home
            <span className="material-symbols-outlined">home</span>
          </Link>
          <Link href="/#connect"
            className="w-full sm:w-auto border border-[#76777f] px-8 py-4 rounded-full text-[14px] font-bold text-[#081534] hover:bg-[#f2f4f6] transition-all active:scale-95 text-center">
            Register Someone Else
          </Link>
        </motion.div>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex-grow flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}