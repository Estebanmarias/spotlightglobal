'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const inputClass = 'w-full bg-[#f2f4f6] border-b border-[#76777f] focus:border-[#081534] focus:ring-0 outline-none transition-all px-4 py-3 rounded-t-lg text-[16px] text-[#191c1e]'
const labelClass = 'block text-[14px] font-semibold text-[#45464e] mb-2'

const interests = ['Spotlight Worship', 'Media Team', 'Evangelism & Outreach', 'Welfare & Program', 'Volunteering']

export default function JoinPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    phone: '', dob: '', guest_status: 'First_Timer',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setLoading(false)
        return
      }

      router.push(`/success?name=${encodeURIComponent(data.first_name)}`)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="flex-grow flex items-center justify-center py-12 sm:py-16 px-4 relative overflow-hidden min-h-screen">
      {/* Ambient blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ffdf9a]/10 rounded-full blur-[100px] translate-x-1/4 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#081534]/5 rounded-full blur-[80px] -translate-x-1/4 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8 sm:mb-10"
        >
          <h1 className="text-[32px] sm:text-[44px] md:text-[56px] font-bold text-[#081534] mb-3 sm:mb-4">Join the Family</h1>
          <p className="text-[15px] sm:text-[18px] leading-[24px] sm:leading-[28px] text-[#45464e] max-w-lg mx-auto">
            We are thrilled that you've chosen to grow with us. Fill out the form below to start your journey.
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-xl border border-[#c6c6cf] p-5 sm:p-8 md:p-12"
          style={{ boxShadow: '0 4px 60px -12px rgba(8,21,52,0.08)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

            {/* Personal Info */}
            <div className="space-y-5 sm:space-y-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#081534]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                <h2 className="text-[20px] sm:text-[24px] font-semibold text-[#081534]">Personal Info</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input name="first_name" type="text" placeholder="Jane" required
                    className={inputClass} value={form.first_name} onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input name="last_name" type="text" placeholder="Doe" required
                    className={inputClass} value={form.last_name} onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input name="email" type="email" placeholder="hello@example.com" required
                    className={inputClass} value={form.email} onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input name="phone" type="tel" placeholder="+234 000 0000"
                    className={inputClass} value={form.phone} onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input name="dob" type="date" required
                    className={inputClass} value={form.dob} onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Guest Type</label>
                  <select name="guest_status" className={inputClass}
                    value={form.guest_status} onChange={handleChange}>
                    <option value="First_Timer">First Time Guest</option>
                    <option value="Returning">Returning Visitor</option>
                    <option value="Regular">Regular Attendee</option>
                    <option value="Member">Interested in Membership</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#081534]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                <h2 className="text-[20px] sm:text-[24px] font-semibold text-[#081534]">Interests</h2>
              </div>
              <p className="text-[14px] sm:text-[16px] text-[#45464e]">Select the areas where you'd like to get involved:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {interests.map(interest => (
                  <label key={interest}
                    className="flex items-center p-3.5 sm:p-4 rounded-lg bg-[#f7f9fb] hover:bg-[#e6e8ea] transition-colors cursor-pointer group border border-[#c6c6cf]">
                    <input type="checkbox" name="interests" value={interest}
                      className="w-5 h-5 rounded border-[#76777f] text-[#081534] mr-3 shrink-0" />
                    <span className="text-[14px] sm:text-[16px] text-[#191c1e] group-hover:text-[#081534] transition-colors">
                      {interest}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && <p className="text-[#ba1a1a] text-[14px] font-medium">{error}</p>}

            {/* Submit */}
            <div className="pt-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit" disabled={loading}
                className="w-full bg-[#fdc425] text-[#6d5200] text-[16px] sm:text-[20px] md:text-[24px] font-bold py-4 sm:py-5 rounded-xl shadow-lg hover:brightness-110 transition-all disabled:opacity-70 flex items-center justify-center gap-3"
              >
                {loading ? 'Processing...' : 'Join the Community'}
                {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
              </motion.button>
              <p className="text-center text-[12px] text-[#45464e] mt-5 sm:mt-6">
                By joining, you agree to receive inspirational updates from theSpotlightChurch.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  )
}