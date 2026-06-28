'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAdminAccess } from '@/lib/use-admin-permissions'

type FormData = {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  dob: string
  guest_status: string
  admin_notes: string
  discovery_source: string
  referral_name: string
  interests: string[]
}

const interestsList = [
  { id: 'worship', label: 'Worship Arts', icon: 'volunteer_activism', desc: 'Choir, band, and creative team' },
  { id: 'youth', label: 'Youth Ministry', icon: 'child_care', desc: 'Sunday school and kids events' },
  { id: 'outreach', label: 'Community Outreach', icon: 'handshake', desc: 'Local missions and charity' },
  { id: 'smallgroups', label: 'Small Groups', icon: 'groups', desc: 'Weekly fellowship circles' },
]

const discoverySources = [
  { id: 'social', label: 'Social Media', icon: 'share' },
  { id: 'friend', label: 'Friend/Family', icon: 'person_add' },
  { id: 'website', label: 'Website', icon: 'language' },
  { id: 'walkin', label: 'Walk-in', icon: 'location_on' },
]

const inputClass = 'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] focus:ring-0 outline-none px-4 py-3 rounded-t-lg text-[16px]'

export default function AddMemberPage() {
  const router = useRouter()
  const access = useAdminAccess('members')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>({
    first_name: '', last_name: '', email: '', phone: '', address: '',
    dob: '', guest_status: 'First_Timer', admin_notes: '',
    discovery_source: '', referral_name: '', interests: [],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const toggleInterest = (id: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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

    router.push('/admin/dashboard')
  }

  const stepStyle = (s: number) => {
    if (step === s) return 'bg-[#081534] text-white'
    if (step > s) return 'bg-[#fdc425] text-[#6d5200]'
    return 'bg-[#eceef0] text-[#45464e]'
  }

  const stepLabelStyle = (s: number) => {
    if (step === s) return 'text-[#081534] font-bold'
    if (step > s) return 'text-[#785a00] font-semibold'
    return 'text-[#45464e]'
  }

  if (access.loading) {
    return <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center"><p className="text-[#45464e]">Loading...</p></div>
  }

  return (
    <main className="bg-[#f7f9fb]">
      <div className="p-4 sm:p-8 lg:p-12">
        <div className="max-w-[800px] mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <button onClick={() => router.push('/admin/members')}
              className="flex items-center justify-center w-9 h-9 border border-[#c6c6cf] text-[#45464e] rounded-lg hover:bg-[#f2f4f6] hover:text-[#081534] transition-colors shrink-0">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-[24px] sm:text-[30px] font-bold text-[#081534] mb-1">Add New Member</h1>
              <p className="text-[14px] sm:text-[16px] text-[#45464e]">Welcome someone new into theSpotlightChurch family</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-5 left-0 w-full h-[2px] bg-[#c6c6cf] z-0" />
            {[{ n: 1, label: 'Personal' }, { n: 2, label: 'Discovery' }, { n: 3, label: 'Ministries' }].map(s => (
              <div key={s.n} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-[#f7f9fb] transition-colors ${stepStyle(s.n)}`}>
                  {step > s.n
                    ? <span className="material-symbols-outlined text-[18px]">check</span>
                    : s.n}
                </div>
                <span className={`text-[11px] sm:text-[12px] font-semibold ${stepLabelStyle(s.n)}`}>{s.label}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1 */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white p-5 sm:p-8 rounded-xl border border-[#c6c6cf]">
                <h3 className="text-[20px] sm:text-[24px] font-bold text-[#081534] mb-5">Personal Information</h3>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-semibold text-[#45464e]">First Name</label>
                      <input type="text" name="first_name" value={form.first_name}
                        onChange={handleChange} placeholder="e.g. John" className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-semibold text-[#45464e]">Last Name</label>
                      <input type="text" name="last_name" value={form.last_name}
                        onChange={handleChange} placeholder="e.g. Doe" className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-semibold text-[#45464e]">Email Address</label>
                      <input type="email" name="email" value={form.email}
                        onChange={handleChange} placeholder="john@example.com" className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-semibold text-[#45464e]">Phone Number</label>
                      <input type="tel" name="phone" value={form.phone}
                        onChange={handleChange} placeholder="+234 000 0000" className={inputClass} />
                    </div>
                    <div className="sm:col-span-2 flex flex-col gap-2">
                      <label className="text-[13px] font-semibold text-[#45464e]">Home Address</label>
                      <input type="text" name="address" value={form.address}
                        onChange={handleChange} placeholder="e.g. 12 Karu Street, Abuja-Keffi Road" className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-semibold text-[#45464e]">Date of Birth</label>
                      <input type="date" name="dob" value={form.dob}
                        onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-semibold text-[#45464e]">Member Status</label>
                      <select name="guest_status" value={form.guest_status}
                        onChange={handleChange} className={inputClass}>
                        <option value="First_Timer">First Timer</option>
                        <option value="Attending">Attending</option>
                        <option value="Member">Active Member</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-semibold text-[#45464e]">Admin Notes</label>
                    <textarea name="admin_notes" value={form.admin_notes} onChange={handleChange}
                      placeholder="Add internal context..." rows={3} className={inputClass} />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button type="button" onClick={() => setStep(2)}
                    className="bg-[#081534] text-white px-6 sm:px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
                    Next Step <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white p-5 sm:p-8 rounded-xl border border-[#c6c6cf] space-y-6">
                <div>
                  <h3 className="text-[20px] sm:text-[24px] font-bold text-[#081534] mb-1">Discovery</h3>
                  <p className="text-[14px] text-[#45464e] mb-6">How did this person find theSpotlightChurch?</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {discoverySources.map(src => (
                      <button key={src.id} type="button" onClick={() => setForm(p => ({ ...p, discovery_source: src.id }))}
                        className={`p-4 sm:p-6 border rounded-xl text-center transition-all
                          ${form.discovery_source === src.id
                            ? 'bg-[#1e2a4a] text-white border-[#081534]'
                            : 'border-[#c6c6cf] text-[#191c1e] hover:border-[#081534]'}`}>
                        <span className="material-symbols-outlined text-3xl sm:text-4xl mb-2 block">{src.icon}</span>
                        <p className="text-[12px] sm:text-[14px] font-semibold">{src.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-semibold text-[#45464e]">Specific referral name (Optional)</label>
                  <input type="text" name="referral_name" value={form.referral_name}
                    onChange={handleChange} placeholder="Who invited them?" className={inputClass} />
                </div>
                <div className="flex justify-between">
                  <button type="button" onClick={() => setStep(1)}
                    className="text-[#081534] px-6 sm:px-8 py-3 rounded-lg font-bold hover:bg-[#eceef0] transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined">arrow_back</span> Previous
                  </button>
                  <button type="button" onClick={() => setStep(3)}
                    className="bg-[#081534] text-white px-6 sm:px-8 py-3 rounded-lg font-bold hover:opacity-90 flex items-center gap-2">
                    Next Step <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white p-5 sm:p-8 rounded-xl border border-[#c6c6cf] space-y-6">
                <div>
                  <h3 className="text-[20px] sm:text-[24px] font-bold text-[#081534] mb-1">Ministry Interests</h3>
                  <p className="text-[14px] text-[#45464e] mb-6">Which areas are they interested in?</p>
                  <div className="space-y-3">
                    {interestsList.map(interest => (
                      <label key={interest.id}
                        className="flex items-center justify-between p-4 bg-[#f2f4f6] rounded-lg hover:bg-[#eceef0] transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-[#c6c6cf] shrink-0">
                            <span className="material-symbols-outlined text-[#081534] text-[20px]">{interest.icon}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#081534] text-[14px]">{interest.label}</p>
                            <p className="text-[11px] text-[#45464e]">{interest.desc}</p>
                          </div>
                        </div>
                        <input type="checkbox" checked={form.interests.includes(interest.id)}
                          onChange={() => toggleInterest(interest.id)}
                          className="w-5 h-5 rounded border-[#c6c6cf] accent-[#081534]" />
                      </label>
                    ))}
                  </div>
                </div>

                {error && <p className="text-[#ba1a1a] text-[14px] font-medium">{error}</p>}

                <div className="flex justify-between">
                  <button type="button" onClick={() => setStep(2)}
                    className="text-[#081534] px-6 sm:px-8 py-3 rounded-lg font-bold hover:bg-[#eceef0] transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined">arrow_back</span> Previous
                  </button>
                  <button type="submit" disabled={loading}
                    className="bg-[#fdc425] text-[#6d5200] px-8 sm:px-12 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg disabled:opacity-60">
                    {loading ? 'Adding...' : 'Add to Family'}
                    <span className="material-symbols-outlined">favorite</span>
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          {/* Bottom card */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 bg-[#081534] p-6 sm:p-8 rounded-xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-[20px] sm:text-[24px] font-bold mb-2">Building the Body</h4>
                <p className="text-[14px] sm:text-[16px] opacity-80">Every new member strengthens our collective mission and global impact.</p>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-10">
                <span className="material-symbols-outlined text-[160px] sm:text-[200px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>church</span>
              </div>
            </div>
            <div className="bg-[#ffdf9a] p-6 sm:p-8 rounded-xl border border-[#fdc425] flex flex-col justify-center">
              <p className="text-[11px] text-[#5a4300] uppercase tracking-wider font-semibold mb-2">Company of the Blessed</p>
              <p className="text-[28px] sm:text-[32px] font-bold text-[#081534]">Growing</p>
              <p className="text-[13px] text-[#5a4300] font-semibold">Every soul counts</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}