"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Suspense } from "react";

const isPermissionsEmpty = (perms: string[] | null | undefined) =>
  !perms || perms.length === 0 || (perms.length === 1 && perms[0] === 'dashboard')

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
      return;
    }

    const { data: roleData } = await supabase
      .from("admin_roles")
      .select("is_ministry_leader, role, permissions, status")
      .eq("user_id", authData.session.user.id)
      .single() as { data: { is_ministry_leader: boolean; role: string; permissions: string[]; status: string } | null };

    if (!roleData || roleData.status !== 'approved') {
      await supabase.auth.signOut()
      setError("Your account is pending approval. Contact Setman.")
      setLoading(false)
      return
    }

    const isSuper      = roleData?.role === "super_admin";
    const isPureLeader = !isSuper && roleData?.is_ministry_leader && isPermissionsEmpty(roleData?.permissions);

    const next = searchParams.get('next')
    const safeNext = next && next.startsWith('/admin/') ? next : null

    const destination = isPureLeader
      ? "/admin/ministry-dashboard"
      : safeNext || "/admin/dashboard"

    // CRITICAL FIX: router.push() is a client-side transition that can fire
    // before the browser has actually persisted the auth cookie to disk —
    // this race condition is much more common on mobile Safari/Chrome where
    // cookie writes are throttled more aggressively than desktop. Using a
    // full page navigation (window.location) forces a real HTTP request,
    // guaranteeing the cookie is sent and read correctly by middleware.
    window.location.href = destination;
  };

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
            Administrative Portal
          </h1>
          <p className="text-[15px] text-[#45464e]">
            Shine Your Light. Manage Your Mission.
          </p>
        </div>

        <div className="w-full bg-white border border-[#c6c6cf] rounded-xl p-7 sm:p-10 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[14px] font-semibold text-[#081534] mb-2">
                Administrator Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777f] group-focus-within:text-[#081534] transition-colors text-[20px]">
                  mail
                </span>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@thespotlight.church"
                  className="w-full pl-10 pr-3 py-3 bg-[#f7f9fb] border-b border-[#c6c6cf] focus:border-[#081534] focus:ring-0 outline-none transition-all text-[16px] text-[#191c1e]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[14px] font-semibold text-[#081534]">
                  Security Password
                </label>
                <button type="button" onClick={() => router.push('/admin/forgot-password')}
                  className="text-[12px] text-[#785a00] hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777f] group-focus-within:text-[#081534] transition-colors text-[20px]">
                  lock
                </span>
                <input
                  type={showPw ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-[#f7f9fb] border-b border-[#c6c6cf] focus:border-[#081534] focus:ring-0 outline-none transition-all text-[16px] text-[#191c1e]"
                />
                <button type="button" onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777f] hover:text-[#081534] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">
                    {showPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-[#ffdad6] rounded-lg">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[16px] shrink-0 mt-0.5">error</span>
                <p className="text-[#ba1a1a] text-[13px] font-semibold">{error}</p>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading}
              className="w-full py-4 bg-[#081534] text-white text-[14px] font-bold rounded-lg shadow-sm hover:brightness-110 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating...</>
              ) : (
                <>Sign In to Portal <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
              )}
            </motion.button>
          </form>
        </div>

        <p className="mt-8 text-[12px] text-[#c6c6cf] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">verified_user</span>
          Authorized Access Only — End-to-End Encrypted
        </p>
      </motion.div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <p className="text-[#45464e]">Loading...</p>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  )
}