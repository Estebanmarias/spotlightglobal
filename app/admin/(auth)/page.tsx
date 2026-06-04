// ROUTING FIX INSTRUCTIONS:
// 
// The sidebar shows on the login page because AdminLayout wraps ALL /admin routes.
// To fix this, reorganize your admin folder like this:
//
//  app/admin/
//  ├── (auth)/
//  │   ├── layout.tsx        ← blank layout (no sidebar)
//  │   └── page.tsx          ← this login page
//  ├── (portal)/
//  │   ├── layout.tsx        ← AdminLayout with sidebar
//  │   ├── dashboard/page.tsx
//  │   ├── add-member/page.tsx
//  │   ├── ministries/page.tsx
//  │   ├── analytics/page.tsx
//  │   └── settings/page.tsx
//
// The (auth) and (portal) folders are "route groups" — parentheses mean
// Next.js ignores them in the URL. So /admin still works as login,
// and /admin/dashboard still works. They just get different layouts.
//
// ── app/admin/(auth)/layout.tsx ──────────────────────────────────────
// export default function AuthLayout({ children }: { children: React.ReactNode }) {
//   return <>{children}</>
// }
//
// ── app/admin/(portal)/layout.tsx ────────────────────────────────────
// import AdminSidebar from '@/components/AdminSidebar'
// export default function AdminLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="flex bg-[#f7f9fb] min-h-screen overflow-hidden">
//       <AdminSidebar />
//       <div className="flex-1 lg:ml-64 overflow-y-auto min-h-screen">
//         {children}
//       </div>
//     </div>
//   )
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const router = useRouter();
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
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  };

  return (
    <main className="flex items-center justify-center px-4 py-12 min-h-screen bg-[#f7f9fb] relative overflow-hidden">
      {/* Ambient blobs */}
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
            Administrative Portal
          </h1>
          <p className="text-[15px] text-[#45464e]">
            Shine Your Light. Manage Your Mission.
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white border border-[#c6c6cf] rounded-xl p-7 sm:p-10 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@thespotlight.church"
                  className="w-full pl-10 pr-3 py-3 bg-[#f7f9fb] border-b border-[#c6c6cf] focus:border-[#081534] focus:ring-0 outline-none transition-all text-[16px] text-[#191c1e]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[14px] font-semibold text-[#081534]">
                  Security Password
                </label>
                <button type="button" className="text-[12px] text-[#785a00] hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777f] group-focus-within:text-[#081534] transition-colors text-[20px]">
                  lock
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-[#f7f9fb] border-b border-[#c6c6cf] focus:border-[#081534] focus:ring-0 outline-none transition-all text-[16px] text-[#191c1e]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777f] hover:text-[#081534] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[#ba1a1a] text-[14px] font-medium">{error}</p>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#081534] text-white text-[14px] font-bold rounded-lg shadow-sm hover:brightness-110 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {loading ? "Authenticating..." : "Sign In to Portal"}
              {!loading && (
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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