'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

const tabs = ['Profile & Account', 'Notifications', 'Team Permissions', 'Brand Identity']

const teamMembers = [
  { initials: 'JW', name: 'Jane Williams', email: 'jane.w@spotlight.org', role: 'Editor', color: 'bg-[#1e2a4a] text-[#bac5ee]' },
  { initials: 'BK', name: 'Brother Kevin', email: 'kevin.m@spotlight.org', role: 'Viewer', color: 'bg-[#002960] text-[#adc6ff]' },
]

const notifications = [
  { id: 'email', label: 'Email Digests', desc: 'Weekly performance reports', defaultOn: true },
  { id: 'member', label: 'New Member Alerts', desc: 'Instant app notification', defaultOn: true },
  { id: 'giving', label: 'Giving Notifications', desc: 'Real-time donation logs', defaultOn: false },
  { id: 'birthday', label: 'Birthday Reminders', desc: 'Auto-triggered via Brevo', defaultOn: true },
]

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    email: true, member: true, giving: false, birthday: true,
  })
  const [profile, setProfile] = useState({
    name: 'Dr. Marcus Sterling',
    email: 'admin@thespotlightchurch.org',
    bio: 'Executive Pastor and Global Strategy Director for theSpotlightChurch missions.',
  })
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const handleSaveProfile = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleChangePassword = async () => {
    setPwError('')
    setPwSuccess(false)
    if (!pwForm.current || !pwForm.next) return setPwError('Fill in all fields.')
    if (pwForm.next !== pwForm.confirm) return setPwError('New passwords do not match.')
    if (pwForm.next.length < 8) return setPwError('Password must be at least 8 characters.')

    setSaving(true)
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    setSaving(false)

    if (error) return setPwError(error.message)
    setPwSuccess(true)
    setPwForm({ current: '', next: '', confirm: '' })
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#c6c6cf] px-4 sm:px-8 py-4">
        <div className="pl-12 lg:pl-0">
          <h2 className="text-[20px] sm:text-[26px] font-bold text-[#081534]">Portal Settings</h2>
          <p className="text-[13px] text-[#45464e]">Manage your organization's digital identity, team access, and notifications.</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Tabs */}
        <div className="flex border-b border-[#c6c6cf] mb-8 overflow-x-auto gap-6">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`pb-3 text-[13px] font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px
                ${activeTab === i
                  ? 'text-[#081534] border-[#081534]'
                  : 'text-[#45464e] border-transparent hover:text-[#081534]'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
              <h3 className="text-[18px] sm:text-[20px] font-bold text-[#081534] mb-6">Profile Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-semibold text-[#45464e] uppercase tracking-wide">Full Name</label>
                  <input
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-semibold text-[#45464e] uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    className="bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] transition-colors"
                  />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-2">
                  <label className="text-[12px] font-semibold text-[#45464e] uppercase tracking-wide">Bio / Designation</label>
                  <textarea
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    rows={3}
                    className="bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] transition-colors resize-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                {saved && (
                  <span className="text-green-600 text-[13px] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span> Saved
                  </span>
                )}
                <button onClick={handleSaveProfile} disabled={saving}
                  className="bg-[#081534] text-white px-6 py-2.5 rounded-lg text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>

            {/* Change Password card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
              <h3 className="text-[18px] sm:text-[20px] font-bold text-[#081534] mb-2">Change Password</h3>
              <p className="text-[13px] text-[#45464e] mb-6">Update your Supabase Auth password for this admin account.</p>
              <div className="space-y-4">
                {[
                  { key: 'current', label: 'Current Password', placeholder: '••••••••' },
                  { key: 'next', label: 'New Password', placeholder: 'Min. 8 characters' },
                  { key: 'confirm', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
                ].map(field => (
                  <div key={field.key} className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-[#45464e] uppercase tracking-wide">{field.label}</label>
                    <input
                      type="password"
                      value={pwForm[field.key as keyof typeof pwForm]}
                      onChange={e => setPwForm(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] transition-colors"
                    />
                  </div>
                ))}
              </div>

              {pwError && (
                <p className="mt-4 text-[#ba1a1a] text-[13px] font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">error</span>{pwError}
                </p>
              )}
              {pwSuccess && (
                <p className="mt-4 text-green-600 text-[13px] font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span> Password updated successfully.
                </p>
              )}

              <div className="mt-6 flex justify-end">
                <button onClick={handleChangePassword} disabled={saving}
                  className="bg-[#fdc425] text-[#6d5200] px-6 py-2.5 rounded-lg text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </motion.div>

            {/* Team Permissions */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[18px] sm:text-[20px] font-bold text-[#081534]">Team Permissions</h3>
                <button className="text-[#081534] text-[13px] font-bold flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                  <span className="material-symbols-outlined text-[18px]">person_add</span> Add Member
                </button>
              </div>
              <div className="space-y-3">
                {teamMembers.map((m) => (
                  <div key={m.email} className="flex items-center justify-between p-4 bg-[#f2f4f6] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${m.color} rounded-full flex items-center justify-center text-[13px] font-bold shrink-0`}>
                        {m.initials}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#191c1e]">{m.name}</p>
                        <p className="text-[11px] text-[#45464e]">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-1 bg-[#fdc425]/20 text-[#785a00] text-[11px] font-bold rounded-full">{m.role}</span>
                      <button className="text-[#45464e] hover:text-[#081534] transition-colors">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-6">
            {/* Notifications */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-[#c6c6cf] rounded-xl p-6">
              <h3 className="text-[11px] font-bold text-[#081534] uppercase tracking-widest mb-5">Global Notifications</h3>
              <div className="space-y-5">
                {notifications.map(n => (
                  <div key={n.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold text-[#191c1e]">{n.label}</p>
                      <p className="text-[11px] text-[#45464e]">{n.desc}</p>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => setToggles(t => ({ ...t, [n.id]: !t[n.id] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${toggles[n.id] ? 'bg-[#081534]' : 'bg-[#c6c6cf]'}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${toggles[n.id] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Brand Identity */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-[#c6c6cf] rounded-xl p-6">
              <h3 className="text-[11px] font-bold text-[#081534] uppercase tracking-widest mb-5">Brand Identity</h3>
              <div className="space-y-4">
                <div className="relative group cursor-pointer rounded-lg overflow-hidden aspect-video bg-[#f2f4f6] border border-[#c6c6cf] flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-[40px] text-[#c6c6cf]">add_photo_alternate</span>
                    <p className="text-[11px] text-[#45464e] mt-1">Upload brand visual</p>
                  </div>
                  <div className="absolute inset-0 bg-[#081534]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[32px]">upload_file</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#45464e] text-center">2400 × 1200 px recommended</p>
                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#081534] shrink-0" />
                    <div>
                      <p className="text-[12px] font-semibold text-[#191c1e]">Midnight Blue</p>
                      <p className="text-[11px] text-[#45464e]">#081534</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#fdc425] shrink-0" />
                    <div>
                      <p className="text-[12px] font-semibold text-[#191c1e]">Sunset Gold</p>
                      <p className="text-[11px] text-[#45464e]">#FDC425</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Danger zone */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-[#ffdad6] rounded-xl p-6">
              <h3 className="text-[11px] font-bold text-[#ba1a1a] uppercase tracking-widest mb-4">Danger Zone</h3>
              <p className="text-[12px] text-[#45464e] mb-4">These actions are irreversible. Proceed with caution.</p>
              <button className="w-full py-2.5 border border-[#ba1a1a] text-[#ba1a1a] rounded-lg text-[13px] font-bold hover:bg-[#ffdad6] transition-colors">
                Delete All Member Data
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}