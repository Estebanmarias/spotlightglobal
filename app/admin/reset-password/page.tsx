'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase sends the user back with a session in the URL hash.
  // We need to wait for onAuthStateChange to pick up the SIGNED_IN
  // event that fires when the recovery token is exchanged.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError('Failed to update password. The reset link may have expired — request a new one.')
      return
    }

    setDone(true)
    setTimeout(() => router.push('/admin'), 3000)
  }

  const strength = (pw: string) => {
    if (!pw) return null
    if (pw.length < 6) return { label: 'Too short', color: 'bg-red-400', width: 'w-1/4' }
    if (pw.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: 'w-2/4' }
    if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: 'Fair', color: 'bg-yellow-400', width: 'w-3/4' }
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' }
  }
  const pwStrength = strength(password)

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
        <div className="mb-10 text-center flex flex-col items-center">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSu9ztjFXXL57HPmU2Tzxi3_L64jT6N2N-it5rvbfUfWfdXYJHE01o-8vaDbMMklLymKGFy1h8bgWMuq6cFCbsAWGpAlzRdnIlqlCNZGURQg-bl42EaVtpB0oh1Ad-gK8evCtIRS5ux11Sgpvn686W0Zv9ySUxOUssIE11jsJlK62yZPqSHl64xThPfeKXmVOT7T--wIzDqUmNxAViuDnvS5k1CKHkBHX3FGjpWOScub8kqDfinr_Tsn0ifKgyAVbp8f2XdxntkwI"
            alt="Logo"
            className="h-24 w-auto mb-6"
          />
          <h1 className="text-[28px] sm:text-[32px] font-bold text-[#081534] mb-2">
            Set New Password
          </h1>
          <p className="text-[15px] text-[#45464e]">
            Choose a strong password for your account.
          </p>
        </div>

        <div className="w-full bg-white border border-[#c6c6cf] rounded-xl p-7 sm:p-10 shadow-sm">
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-green-700 text-[32px]">check_circle</span>
              </div>
              <h3 className="text-[18px] font-bold text-[#081534]">Password updated</h3>
              <p className="text-[14px] text-[#45464e]">
                Your password has been changed successfully. Redirecting you to sign in...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New password */}
              <div>
                <label className="block text-[14px] font-semibold text-[#081534] mb-2">
                  New Password
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777f] group-focus-within:text-[#081534] transition-colors text-[20px]">
                    lock
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-10 pr-10 py-3 bg-[#f7f9fb] border-b border-[#c6c6cf] focus:border-[#081534] focus:ring-0 outline-none transition-all text-[16px] text-[#191c1e]"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777f] hover:text-[#081534] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">
                      {showPw ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {pwStrength && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full h-1.5 bg-[#f2f4f6] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pwStrength.color} ${pwStrength.width}`} />
                    </div>
                    <p className="text-[11px] text-[#45464e]">{pwStrength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-[14px] font-semibold text-[#081534] mb-2">
                  Confirm Password
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777f] group-focus-within:text-[#081534] transition-colors text-[20px]">
                    lock_reset
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-10 py-3 bg-[#f7f9fb] border-b border-[#c6c6cf] focus:border-[#081534] focus:ring-0 outline-none transition-all text-[16px] text-[#191c1e]"
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777f] hover:text-[#081534] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirm ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {confirm && password && confirm !== password && (
                  <p className="text-[12px] text-[#ba1a1a] mt-1">Passwords don't match</p>
                )}
                {confirm && password && confirm === password && (
                  <p className="text-[12px] text-green-600 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span> Passwords match
                  </p>
                )}
              </div>

              {error && <p className="text-[#ba1a1a] text-[14px] font-medium">{error}</p>}

              {!sessionReady && (
                <p className="text-[12px] text-[#76777f] bg-[#f7f9fb] p-3 rounded-lg">
                  Waiting for reset link verification... If you landed here directly without clicking a reset email link, go back and request one.
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading || !sessionReady}
                className="w-full py-4 bg-[#081534] text-white text-[14px] font-bold rounded-lg shadow-sm hover:brightness-110 transition-all disabled:opacity-60 flex justify-center items-center gap-2"
              >
                {loading ? 'Updating...' : 'Update Password'}
                {!loading && <span className="material-symbols-outlined text-[18px]">lock_reset</span>}
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