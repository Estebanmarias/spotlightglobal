import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { loadCertificateByCode } from "@/lib/class-certificates";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Verify a certificate", robots: { index: false } };

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = /^SC-[A-Z0-9]{10}$/.test(code) ? await loadCertificateByCode(getSupabaseAdminClient(), code) : null;
  const date = cert
    ? new Date(`${cert.completedOn}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f7f9fb] px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-[#d9dbe0] bg-white p-8 text-center shadow-sm">
        {cert ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Icon name="check_circle" className="text-[30px] text-green-700" />
            </div>
            <h1 className="mt-5 text-[22px] font-bold text-[#081534]">Certificate verified</h1>
            <p className="mt-1 text-[13px] text-[#5f6068]">This certificate was issued by theSpotlightChurch.</p>
            <dl className="mt-6 space-y-3 rounded-2xl bg-[#f7f9fb] p-5 text-left text-[14px]">
              <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#5f6068]">Awarded to</dt><dd className="font-bold text-[#081534]">{cert.name}</dd></div>
              <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#5f6068]">Class</dt><dd className="font-semibold text-[#191c1e]">{cert.className}</dd></div>
              <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#5f6068]">Completed</dt><dd className="font-semibold text-[#191c1e]">{date}</dd></div>
              <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#5f6068]">Certificate no.</dt><dd className="font-mono font-semibold text-[#191c1e]">{cert.code}</dd></div>
            </dl>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ffefed]">
              <Icon name="error" className="text-[30px] text-[#ba1a1a]" />
            </div>
            <h1 className="mt-5 text-[22px] font-bold text-[#081534]">We couldn’t find this certificate</h1>
            <p className="mt-2 text-[14px] leading-6 text-[#45464e]">Check the certificate number and try again. If you think this is a mistake, please contact the church.</p>
          </>
        )}
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-[#081534] px-6 text-[13px] font-bold text-white hover:bg-[#17305f]">
          Back to home
        </Link>
      </div>
    </main>
  );
}