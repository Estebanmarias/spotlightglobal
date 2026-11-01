import { randomBytes } from "node:crypto";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export type CertificateData = {
  code: string;
  name: string;
  className: string;
  intakeTitle: string;
  completedOn: string; // YYYY-MM-DD
};

const NAVY = rgb(8 / 255, 21 / 255, 52 / 255);
const GOLD = rgb(253 / 255, 196 / 255, 37 / 255);
const DARK_GOLD = rgb(120 / 255, 90 / 255, 0);
const GREY = rgb(69 / 255, 70 / 255, 78 / 255);
const IVORY = rgb(1, 0.992, 0.969);

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://spotlightglobal.vercel.app").replace(/\/$/, "");

// The built-in PDF fonts only cover basic Latin, so strip accents and anything else
const safe = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x20-\x7E]/g, "").trim();

const longDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function newCertificateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (const b of randomBytes(10)) out += alphabet[b % alphabet.length];
  return `SC-${out}`;
}

export async function buildCertificatePdf(d: CertificateData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${d.className} certificate`);
  pdf.setAuthor("theSpotlightChurch");
  const page = pdf.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const centerAt = (cx: number, text: string, y: number, size: number, font: PDFFont, color = NAVY, maxWidth = width - 160) => {
    let s = size;
    while (s > 9 && font.widthOfTextAtSize(text, s) > maxWidth) s -= 1;
    page.drawText(text, { x: cx - font.widthOfTextAtSize(text, s) / 2, y, size: s, font, color });
  };
  const center = (text: string, y: number, size: number, font: PDFFont, color = NAVY) =>
    centerAt(width / 2, text, y, size, font, color);

  // Background, double border, corner marks
  page.drawRectangle({ x: 0, y: 0, width, height, color: IVORY });
  page.drawRectangle({ x: 22, y: 22, width: width - 44, height: height - 44, borderColor: NAVY, borderWidth: 5 });
  page.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderColor: GOLD, borderWidth: 1.5 });
  for (const [x, y] of [[34, 34], [width - 34, 34], [34, height - 34], [width - 34, height - 34]]) {
    page.drawRectangle({ x: x - 5, y: y - 5, width: 10, height: 10, color: GOLD });
  }

  // Logo (skipped quietly if it can't be fetched)
  try {
    const res = await fetch(`${siteUrl()}/images/logo.png`);
    if (res.ok) {
      const bytes = new Uint8Array(await res.arrayBuffer());
      const img = await pdf.embedPng(bytes).catch(() => pdf.embedJpg(bytes));
      const scale = Math.min(64 / img.width, 64 / img.height);
      page.drawImage(img, {
        x: (width - img.width * scale) / 2, y: height - 130,
        width: img.width * scale, height: img.height * scale,
      });
    }
  } catch {
    /* no logo */
  }

  center("theSpotlightChurch", 444, 13, sansBold, DARK_GOLD);
  center("Certificate of Completion", 398, 36, serifBold);
  page.drawLine({ start: { x: width / 2 - 60, y: 380 }, end: { x: width / 2 + 60, y: 380 }, thickness: 1.5, color: GOLD });

  center("This is to certify that", 348, 14, serifItalic, GREY);
  center(safe(d.name) || "Member", 296, 44, serifBold);
  page.drawLine({ start: { x: (width - 420) / 2, y: 282 }, end: { x: (width + 420) / 2, y: 282 }, thickness: 1, color: GOLD });

  center("has successfully completed", 254, 14, serifItalic, GREY);
  center(safe(d.className), 214, 26, serifBold);
  if (d.intakeTitle) center(safe(d.intakeTitle), 190, 13, sans, GREY);

  // Signature blocks
  const leftX = width * 0.25;
  const rightX = width * 0.75;
  const lineY = 112;
  page.drawLine({ start: { x: leftX - 100, y: lineY }, end: { x: leftX + 100, y: lineY }, thickness: 0.8, color: GREY });
  page.drawLine({ start: { x: rightX - 100, y: lineY }, end: { x: rightX + 100, y: lineY }, thickness: 0.8, color: GREY });
  centerAt(leftX, longDate(d.completedOn), lineY + 8, 15, serif, NAVY, 190);
  centerAt(leftX, "DATE OF COMPLETION", lineY - 16, 9, sans, GREY, 190);
  centerAt(rightX, "Apostle Edet Kingsley", lineY - 16, 12, sansBold, NAVY, 190);
  centerAt(rightX, "Lead Pastor, theSpotlightChurch", lineY - 30, 8.5, sans, GREY, 190);

  center(`Certificate no. ${d.code}   |   Verify at ${siteUrl().replace(/^https?:\/\//, "")}/verify/${d.code}`, 52, 8, sans, GREY);

  return pdf.save();
}