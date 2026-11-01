import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCertificatePdf, type CertificateData } from "@/lib/certificate";
import { renderEventEmail, sendBrevoEmail } from "@/lib/media-event-auth";
import { verseFor } from "@/lib/class-verses";

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://spotlightglobal.vercel.app").replace(/\/$/, "");

export async function loadCertificateByCode(
  supabase: SupabaseClient<any, any, any>,
  code: string,
): Promise<(CertificateData & { slug: string }) | null> {
  const { data: e } = await supabase
    .from("class_enrollments")
    .select("full_name, completed_at, intake_id")
    .eq("certificate_id", code)
    .maybeSingle();
  if (!e) return null;
  const { data: intake } = await supabase.from("class_intakes").select("program_id, title").eq("id", e.intake_id).single();
  if (!intake) return null;
  const { data: program } = await supabase.from("class_programs").select("name, slug").eq("id", intake.program_id).single();
  if (!program) return null;
  return {
    code,
    name: e.full_name,
    className: program.name,
    intakeTitle: intake.title,
    completedOn: String(e.completed_at ?? new Date().toISOString()).slice(0, 10),
    slug: program.slug,
  };
}

export async function sendCertificateEmail(supabase: SupabaseClient<any, any, any>, enrollmentId: string) {
  const { data: e } = await supabase
    .from("class_enrollments")
    .select("full_name, email, certificate_id")
    .eq("id", enrollmentId)
    .single();
  if (!e?.certificate_id) return { ok: false as const, error: "Certificate code missing." };

  const cert = await loadCertificateByCode(supabase, e.certificate_id);
  if (!cert) return { ok: false as const, error: "Could not load the certificate details." };

  let pdf: Uint8Array;
  try {
    pdf = await buildCertificatePdf(cert);
  } catch (error) {
    console.error("[CERTIFICATE PDF]", error);
    return { ok: false as const, error: "Could not generate the certificate PDF." };
  }

  const verse = verseFor(cert.slug);
  const first = String(e.full_name).trim().split(/\s+/)[0];
  const date = new Date(`${cert.completedOn}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const message = await sendBrevoEmail({
    to: [{ email: e.email, name: e.full_name }],
    subject: `Your certificate: ${cert.className}`,
    htmlContent: renderEventEmail({
      greeting: `Hi ${first},`,
      preheader: `Your ${cert.className} certificate is ready.`,
      eyebrow: "CERTIFICATE",
      title: "Your certificate is ready",
      paragraphs: [
        `Congratulations on completing ${cert.className}. Your certificate is attached to this email as a PDF.`,
        `“${verse.text}”\n${verse.ref} (KJV)`,
      ],
      details: [
        { label: "Class", value: cert.className },
        { label: "Completed", value: date },
        { label: "Certificate no.", value: cert.code },
      ],
      notice: { title: "Verify anytime", body: `Anyone can confirm this certificate at ${siteUrl()}/verify/${cert.code}` },
      action: { label: "Download certificate", url: `${siteUrl()}/api/certificates/${cert.code}` },
    }),
    attachment: [{ name: `${cert.slug}-certificate.pdf`, content: Buffer.from(pdf).toString("base64") }],
  });

  if (!message.sent) return { ok: false as const, error: message.error ?? "The email could not be sent." };
  return { ok: true as const };
}