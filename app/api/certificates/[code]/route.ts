import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { loadCertificateByCode } from "@/lib/class-certificates";
import { buildCertificatePdf } from "@/lib/certificate";

export async function GET(_request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  if (!/^SC-[A-Z0-9]{10}$/.test(code)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const cert = await loadCertificateByCode(getSupabaseAdminClient(), code);
  if (!cert) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const pdf = await buildCertificatePdf(cert);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${cert.slug}-certificate.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}