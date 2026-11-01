'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { useAdminAccess } from '@/lib/use-admin-permissions'
import AdminLoader from '@/components/AdminLoader'

export default function BrevoCheckPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const access = useAdminAccess()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ findings?: string[] } | null>(null)

  useEffect(() => {
    if (!access.loading && !access.isSuperAdmin) router.replace('/admin/dashboard')
  }, [access.loading, access.isSuperAdmin, router])

  const run = async (sendTest: boolean) => {
    setBusy(true); setError(''); setResult(null)
    try {
      const { data } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/brevo-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
        body: JSON.stringify({ email, sendTest }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'The check failed.')
      setResult(json)
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  if (access.loading || !access.isSuperAdmin) return <AdminLoader fullScreen label="Loading..." />

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <h1 className="text-[22px] font-bold text-[#081534]">Brevo health check</h1>
          <p className="mt-1 text-[13px] text-[#45464e]">Tests the API key, sender, lists and a real send from this server.</p>
        </div>

        <div className="space-y-3 rounded-xl border border-[#c6c6cf] bg-white p-5">
          <label className="block text-[12px] font-bold uppercase tracking-wide text-[#45464e]">
            Email to inspect (optional)
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="the address you registered with"
              className="mt-1.5 w-full rounded-t-lg border-b-2 border-transparent bg-[#f2f4f6] px-4 py-3 text-[14px] font-normal normal-case outline-none focus:border-[#081534]" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => run(false)} disabled={busy}
              className="rounded-lg bg-[#081534] px-4 py-2.5 text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-50">
              {busy ? 'Checking…' : 'Run checks'}
            </button>
            <button onClick={() => run(true)} disabled={busy}
              className="rounded-lg border border-[#081534] px-4 py-2.5 text-[13px] font-bold text-[#081534] hover:bg-[#f2f4f6] disabled:opacity-50">
              Run checks and email me a test
            </button>
          </div>
        </div>

        {error && <p className="rounded-lg bg-[#ffefed] px-4 py-3 text-[13px] text-[#8f1717]">{error}</p>}

        {result && (
          <>
            <ul className="space-y-2">
              {(result.findings ?? []).map((f, i) => (
                <li key={i} className="rounded-xl border border-[#fdc425]/60 bg-[#fff9e8] px-4 py-3 text-[13px] leading-6 text-[#191c1e]">{f}</li>
              ))}
            </ul>
            <details className="rounded-xl border border-[#c6c6cf] bg-white p-4">
              <summary className="cursor-pointer text-[13px] font-bold text-[#081534]">Raw details</summary>
              <pre className="mt-3 max-h-96 overflow-auto text-[11px] leading-5 text-[#45464e]">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </>
        )}
      </div>
    </div>
  )
}