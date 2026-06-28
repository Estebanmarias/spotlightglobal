'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError('Something went wrong. Please check the email address and try again.')
      return
    }

    setSent(true)
  }

  return (
    <main className="flex items-center justify-center px-4 py-12 min-h-screen bg-[#f7f9fb] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#081534]/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#fdc425]/8 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px] flex flex-col items-center relative z-10"
      >
        {/* Brand */}
        <div className="mb-10 text-center flex flex-col items-center">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSu9ztjFXXL57HPmU2Tzxi3_L64jT6N2N-it5rvbfUfWfdXYJHE01o-8vaDbMMklLymKGFy1h8bgWMuq6cFCbsAWGpAlzRdnIlqlCNZGURQg-bl42EaVtpB0oh1Ad-gK8evCtIRS5ux11Sgpvn686W0Zv9ySUxOUssIE11jsJlK62yZPqSHl64xThPfeKXmVOT7T--wIzDqUmNxAViuDnvS5k1CKHkBHX3FGjpWOScub8kqDfinr_Tsn0ifKgyAVbp8f2XdxntkwI"
            alt="Logo"
            className="h-24 w-auto mb-6"
          />
          <h1 className="text-[28px] sm:text-[32px] font-bold text-[#081534] mb-2">
            Reset Password
          </h1>
          <p className="text-[15px] text-[#45464e]">
            We'll send a reset link to your email.
          </p>
        </div>

        <div className="w-full bg-white border border-[#c6c6cf] rounded-xl p-7 sm:p-10 shadow-sm">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-green-700 text-[32px]">mark_email_read</span>
              </div>
              <h3 className="text-[18px] font-bold text-[#081534]">Check your inbox</h3>
              <p className="text-[14px] text-[#45464e] leading-relaxed">
                A password reset link has been sent to <span className="font-semibold text-[#081534]">{email}</span>.
                Click the link in the email to set a new password.
              </p>
              <p className="text-[12px] text-[#76777f]">
                Didn't receive it? Check your spam folder or wait a few minutes before trying again.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-[13px] font-semibold text-[#785a00] hover:underline"
              >
                Try a different email
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[14px] font-semibold text-[#081534] mb-2">
                  Administrator Email
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777f] group-focus-within:text-[#081534] transition-colors text-[20px]">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@thespotlight.church"
                    className="w-full pl-10 pr-3 py-3 bg-[#f7f9fb] border-b border-[#c6c6cf] focus:border-[#081534] focus:ring-0 outline-none transition-all text-[16px] text-[#191c1e]"
                  />
                </div>
              </div>

              {error && <p className="text-[#ba1a1a] text-[14px] font-medium">{error}</p>}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#081534] text-white text-[14px] font-bold rounded-lg shadow-sm hover:brightness-110 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
                {!loading && <span className="material-symbols-outlined text-[18px]">send</span>}
              </motion.button>

              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="w-full text-center text-[13px] font-semibold text-[#45464e] hover:text-[#081534] transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Back to Sign In
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-[12px] text-[#c6c6cf] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">verified_user</span>
          Authorized Access Only — End-to-End Encrypted
        </p>
      </motion.div>
    </main>
  )
}