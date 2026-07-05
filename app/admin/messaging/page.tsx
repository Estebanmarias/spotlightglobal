'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'
import { useAdminAccess } from '@/lib/use-admin-permissions'

type BroadcastRecord = {
  id: string
  created_at: string
  subject: string
  preview_text: string | null
  audience: string
  scheduled_for: string | null
  status: string
}

const audienceOptions = [
  { value: 'all',         label: 'Everyone (All Members)' },
  { value: 'First_Timer', label: 'First Timers only' },
  { value: 'Attending',   label: 'Attending only' },
  { value: 'Member',      label: 'Members only' },
]

const statusStyle = (status: string) => {
  switch (status) {
    case 'sent':      return 'bg-green-50 text-green-700 border border-green-200'
    case 'scheduled': return 'bg-[#fdc425]/20 text-[#785a00] border border-[#fdc425]/40'
    case 'failed':    return 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/20'
    default:          return 'bg-[#f2f4f6] text-[#45464e]'
  }
}

export default function MessagingPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const access = useAdminAccess('messaging')

  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [audience, setAudience] = useState('all')
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [history, setHistory] = useState<BroadcastRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchHistory = async () => {
    setLoadingHistory(true)
    const { data } = await supabase
      .from('broadcast_messages')
      .select('id, created_at, subject, preview_text, audience, scheduled_for, status')
      .order('created_at', { ascending: false })
      .limit(20)
    setHistory((data as BroadcastRecord[]) || [])
    setLoadingHistory(false)
  }

  useEffect(() => {
    if (!access.loading && access.canAccess('messaging')) fetchHistory()
  }, [access.loading])

  const resetForm = () => {
    setSubject('')
    setPreviewText('')
    setBodyText('')
    setAudience('all')
    setIsScheduled(false)
    setScheduleDate('')
  }

  const handleSend = async () => {
    if (!subject.trim() || !bodyText.trim()) {
      showToast('Subject and message body are required.', 'error')
      return
    }
    if (isScheduled && !scheduleDate) {
      showToast('Pick a date and time to schedule, or turn scheduling off.', 'error')
      return
    }

    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          preview_text: previewText.trim() || undefined,
          body_text: bodyText.trim(),
          audience,
          scheduled_for: isScheduled ? new Date(scheduleDate).toISOString() : undefined,
          sent_by: session?.user?.id,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')

      showToast(isScheduled ? 'Broadcast scheduled!' : 'Broadcast sent!')
      resetForm()
      fetchHistory()
    } catch (err: any) {
      showToast(err.message || 'Something went wrong.', 'error')
    } finally {
      setSending(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  // ── Access guard ───────────────────────────────────────────────
  if (access.loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <p className="text-[#45464e]">Loading...</p>
      </div>
    )
  }

  if (!access.canAccess('messaging')) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-[56px] text-[#c6c6cf] block mb-3">lock</span>
          <h2 className="text-[18px] font-bold text-[#081534] mb-2">Restricted Access</h2>
          <p className="text-[13px] text-[#45464e] mb-6">You don't have permission to send broadcast messages.</p>
          <button onClick={() => router.push('/admin/dashboard')}
            className="px-6 py-2.5 bg-[#081534] text-white rounded-lg text-[13px] font-bold hover:opacity-90">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#c6c6cf] px-4 sm:px-8 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/dashboard')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 border border-[#c6c6cf] text-[#45464e] rounded-lg text-[13px] font-semibold hover:bg-[#f2f4f6] hover:text-[#081534] transition-colors shrink-0">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <h2 className="text-[20px] sm:text-[24px] font-bold text-[#081534]">Broadcast Message</h2>
            <p className="text-[12px] text-[#45464e]">Send a notice to the congregation via email.</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-[900px] mx-auto space-y-6">

        {/* Composer */}
        <div className="bg-white border border-[#c6c6cf] rounded-xl p-6 space-y-5">

          <div>
            <label className="block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-1.5">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Special Sunday Service This Week"
              className="w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] transition-colors" />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-1.5">Preview Text (optional)</label>
            <input value={previewText} onChange={e => setPreviewText(e.target.value)}
              placeholder="Short teaser shown in the inbox preview"
              className="w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] transition-colors" />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-1.5">Message</label>
            <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} rows={8}
              placeholder="Write your notice here. Leave a blank line between paragraphs."
              className="w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] transition-colors resize-none" />
            <p className="text-[11px] text-[#76777f] mt-1.5">This gets wrapped automatically in the church's branded header and footer — just write the message itself.</p>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-1.5">Send To</label>
            <div className="flex flex-wrap gap-2">
              {audienceOptions.map(opt => (
                <button key={opt.value} type="button" onClick={() => setAudience(opt.value)}
                  className={`px-4 py-2 rounded-full text-[12px] font-semibold border transition-all
                    ${audience === opt.value
                      ? 'bg-[#081534] text-white border-[#081534]'
                      : 'bg-white text-[#45464e] border-[#c6c6cf] hover:border-[#081534]'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-[#f2f4f6]">
            <button type="button" onClick={() => setIsScheduled(s => !s)}
              className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${isScheduled ? 'bg-[#081534]' : 'bg-[#c6c6cf]'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isScheduled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-[13px] font-semibold text-[#45464e]">Schedule for later</span>
          </div>

          <AnimatePresence>
            {isScheduled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                  className="w-full sm:w-64 bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={handleSend} disabled={sending}
            className="w-full bg-[#fdc425] text-[#6d5200] py-3.5 rounded-xl text-[14px] font-bold hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {sending ? (
              <>Sending<span className="w-4 h-4 border-2 border-[#6d5200]/30 border-t-[#6d5200] rounded-full animate-spin" /></>
            ) : isScheduled ? (
              'Schedule Broadcast'
            ) : (
              'Send Now'
            )}
          </button>
        </div>

        {/* History */}
        <div className="bg-white border border-[#c6c6cf] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c6c6cf]">
            <h3 className="text-[14px] font-bold text-[#081534]">Recent Broadcasts</h3>
          </div>
          {loadingHistory ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-[#f2f4f6] rounded-lg animate-pulse" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px] text-[#76777f]">No broadcasts sent yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f2f4f6]">
              {history.map(h => (
                <div key={h.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#081534] truncate">{h.subject}</p>
                    <p className="text-[11px] text-[#76777f] mt-0.5">
                      {audienceOptions.find(a => a.value === h.audience)?.label || h.audience} · {formatDate(h.created_at)}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${statusStyle(h.status)}`}>
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-[13px] font-semibold shadow-lg flex items-center gap-2
              ${toast.type === 'error' ? 'bg-[#ba1a1a] text-white' : 'bg-[#081534] text-white'}`}>
            <span className="material-symbols-outlined text-[16px]">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}