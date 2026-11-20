import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument, StandardFonts, rgb, degrees,
  pushGraphicsState, popGraphicsState, moveTo, lineTo, appendBezierCurve, closePath, clip, endPath,
  type PDFFont, type PDFPage,
} from "pdf-lib";

export type CertificateData = {
  code: string;
  name: string;
  className: string;
  intakeTitle: string;
  completedOn: string; // YYYY-MM-DD
};

const NAVY = rgb(8 / 255, 21 / 255, 52 / 255);
const GOLD = rgb(253 / 255, 196 / 255, 37 / 255);
const DEEP_GOLD = rgb(190 / 255, 145 / 255, 20 / 255);
const DARK_GOLD = rgb(120 / 255, 90 / 255, 0);
const GREY = rgb(69 / 255, 70 / 255, 78 / 255);
const IVORY = rgb(251 / 255, 249 / 255, 243 / 255);

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://spotlightglobal.vercel.app").replace(/\/$/, "");

// Embedded fonts cover Latin only, so strip accents and anything else
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

async function loadFontFile(file: string): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await readFile(path.join(process.cwd(), "public", "fonts", file)));
  } catch { /* not bundled, try the site */ }
  try {
    const res = await fetch(`${siteUrl()}/fonts/${file}`);
    if (res.ok) return new Uint8Array(await res.arrayBuffer());
  } catch { /* offline */ }
  return null;
}

async function embedOr(pdf: PDFDocument, file: string, fallback: StandardFonts): Promise<PDFFont> {
  const bytes = await loadFontFile(file);
  if (bytes) {
    try { return await pdf.embedFont(bytes, { subset: true }); } catch { /* fall through */ }
  }
  return pdf.embedFont(fallback);
}

function roundedRectClip(page: PDFPage, x: number, y: number, w: number, h: number, r: number) {
  const k = 0.5523 * r;
  page.pushOperators(
    pushGraphicsState(),
    moveTo(x + r, y),
    lineTo(x + w - r, y), appendBezierCurve(x + w - r + k, y, x + w, y + r - k, x + w, y + r),
    lineTo(x + w, y + h - r), appendBezierCurve(x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h),
    lineTo(x + r, y + h), appendBezierCurve(x + r - k, y + h, x, y + h - r + k, x, y + h - r),
    lineTo(x, y + r), appendBezierCurve(x, y + r - k, x + r - k, y, x + r, y),
    closePath(), clip(), endPath(),
  );
}

export async function buildCertificatePdf(d: CertificateData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(`${d.className} certificate`);
  pdf.setAuthor("theSpotlightChurch");
  const page = pdf.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  const serifName = await embedOr(pdf, "CormorantGaramond-SemiBold.ttf", StandardFonts.TimesRomanBold);
  const serifItalic = await embedOr(pdf, "CormorantGaramond-Italic.ttf", StandardFonts.TimesRomanItalic);
  const sans = await embedOr(pdf, "Montserrat-SemiBold.ttf", StandardFonts.Helvetica);
  const sansBold = await embedOr(pdf, "Montserrat-Bold.ttf", StandardFonts.HelveticaBold);

  const BAND = 28, FRAME_L = BAND + 24, FRAME_R = width - 36, FRAME_B = 34, FRAME_T = height - 34;
  const cx = (FRAME_L + FRAME_R) / 2;

  const fit = (text: string, size: number, font: PDFFont, maxWidth: number) => {
    let s = size;
    while (s > 9 && font.widthOfTextAtSize(text, s) > maxWidth) s -= 1;
    return s;
  };
  const centerText = (text: string, y: number, size: number, font: PDFFont, color = NAVY, maxWidth = 640, x = cx) => {
    const s = fit(text, size, font, maxWidth);
    page.drawText(text, { x: x - font.widthOfTextAtSize(text, s) / 2, y, size: s, font, color });
  };
  const spacedWidth = (text: string, size: number, font: PDFFont, track: number) =>
    [...text].reduce((w, ch) => w + font.widthOfTextAtSize(ch, size), 0) + track * (text.length - 1);
  const spaced = (text: string, x: number, y: number, size: number, font: PDFFont, color: ReturnType<typeof rgb>, track: number, align: "center" | "left" = "center") => {
    let px = align === "center" ? x - spacedWidth(text, size, font, track) / 2 : x;
    for (const ch of text) {
      page.drawText(ch, { x: px, y, size, font, color });
      px += font.widthOfTextAtSize(ch, size) + track;
    }
  };

  // Page, navy side band, double gold frame
  page.drawRectangle({ x: 0, y: 0, width, height, color: IVORY });
  page.drawRectangle({ x: 0, y: 0, width: BAND, height, color: NAVY });
  page.drawRectangle({ x: BAND, y: 0, width: 2.5, height, color: GOLD });
  page.drawRectangle({ x: FRAME_L, y: FRAME_B, width: FRAME_R - FRAME_L, height: FRAME_T - FRAME_B, borderColor: DEEP_GOLD, borderWidth: 1.2 });
  page.drawRectangle({ x: FRAME_L + 6, y: FRAME_B + 6, width: FRAME_R - FRAME_L - 12, height: FRAME_T - FRAME_B - 12, borderColor: GOLD, borderWidth: 0.5 });

  // Logo in a rounded square, matching the navbar
  try {
    const res = await fetch(`${siteUrl()}/images/logo.png`);
    if (res.ok) {
      const bytes = new Uint8Array(await res.arrayBuffer());
      const img = await pdf.embedPng(bytes).catch(() => pdf.embedJpg(bytes));
      const size = 50, lx = cx - size / 2, ly = FRAME_T - 22 - size;
      roundedRectClip(page, lx, ly, size, size, 12);
      page.drawImage(img, { x: lx, y: ly, width: size, height: size });
      page.pushOperators(popGraphicsState());
    }
  } catch { /* no logo */ }

  // Heading
  spaced("CERTIFICATE OF COMPLETION", cx, 452, 19, sansBold, NAVY, 4.5);
  page.drawLine({ start: { x: cx - 36, y: 436 }, end: { x: cx + 36, y: 436 }, thickness: 1.6, color: GOLD });

  // Recipient
  centerText("This is to certify that", 404, 18, serifItalic, GREY);
  centerText(safe(d.name) || "Member", 346, 54, serifName, NAVY, 620);
  page.drawLine({ start: { x: cx - 230, y: 332 }, end: { x: cx + 230, y: 332 }, thickness: 1, color: GOLD });

  centerText("has successfully completed the", 304, 18, serifItalic, GREY);
  centerText(safe(d.className), 266, 32, serifName, NAVY, 600);
  if (d.intakeTitle) spaced(safe(d.intakeTitle).toUpperCase(), cx, 244, 8.5, sans, DARK_GOLD, 2.2);

  // Seal
  const sx = cx, sy = 176, R = 44;
  page.drawCircle({ x: sx, y: sy, size: R, color: GOLD });
  page.drawCircle({ x: sx, y: sy, size: R - 4, color: NAVY });
  page.drawCircle({ x: sx, y: sy, size: R - 24, borderColor: GOLD, borderWidth: 0.8 });
  const ringText = "COMPLETION \u00B7 THESPOTLIGHTCHURCH \u00B7 ".replace("\u00B7", ".").replace("\u00B7", ".");
  const ringR = R - 12.5, ringSize = 6;
  const widths = [...ringText].map(ch => sansBold.widthOfTextAtSize(ch, ringSize));
  const gap = (2 * Math.PI * ringR - widths.reduce((a, b) => a + b, 0)) / widths.length;
  let run = 0;
  [...ringText].forEach((ch, i) => {
    const a = (run + widths[i] / 2) / ringR; // radians clockwise from the top
    run += widths[i] + gap;
    const x = sx + ringR * Math.sin(a) - (widths[i] / 2) * Math.cos(a);
    const y = sy + ringR * Math.cos(a) + (widths[i] / 2) * Math.sin(a);
    page.drawText(ch, { x, y, size: ringSize, font: sansBold, color: rgb(1, 0.93, 0.72), rotate: degrees((-a * 180) / Math.PI) });
  });
  const tsc = "TSC";
  page.drawText(tsc, { x: sx - sansBold.widthOfTextAtSize(tsc, 15) / 2, y: sy - 5, size: 15, font: sansBold, color: rgb(1, 1, 1) });

  // Date (left) and signature (right)
  const leftX = FRAME_L + 150, rightX = FRAME_R - 150, lineY = 170;
  page.drawLine({ start: { x: leftX - 100, y: lineY }, end: { x: leftX + 100, y: lineY }, thickness: 0.8, color: GREY });
  page.drawLine({ start: { x: rightX - 100, y: lineY }, end: { x: rightX + 100, y: lineY }, thickness: 0.8, color: GREY });
  centerText(longDate(d.completedOn), lineY + 8, 19, serifName, NAVY, 190, leftX);
  spaced("DATE OF COMPLETION", leftX, lineY - 15, 7.5, sans, GREY, 1.6);
  centerText("Apostle Edet Kingsley", lineY + 8, 19, serifName, NAVY, 190, rightX);
  spaced("LEAD PASTOR, THESPOTLIGHTCHURCH", rightX, lineY - 15, 7, sans, GREY, 1.1);

  // Footer: divider, QR, certificate number and verify link
  page.drawLine({ start: { x: FRAME_L + 40, y: 118 }, end: { x: FRAME_R - 40, y: 118 }, thickness: 0.6, color: GOLD });
  const verifyUrl = `${siteUrl()}/verify/${d.code}`;
  let textX = FRAME_L + 40;
  try {
    const QRmod: any = await import("qrcode");
    const QR = QRmod.default ?? QRmod;
    const png: Buffer = await QR.toBuffer(verifyUrl, { margin: 0, width: 320, color: { dark: "#081534", light: "#00000000" } });
    const qr = await pdf.embedPng(new Uint8Array(png));
    page.drawImage(qr, { x: FRAME_L + 40, y: 52, width: 54, height: 54 });
    textX = FRAME_L + 40 + 54 + 14;
  } catch { /* no QR: footer text moves left */ }
  spaced("CERTIFICATE NO.", textX, 92, 7.5, sansBold, DARK_GOLD, 1.8, "left");
  page.drawText(d.code, { x: textX, y: 76, size: 13, font: sansBold, color: NAVY });
  page.drawText(`Scan to verify, or visit ${verifyUrl.replace(/^https?:\/\//, "")}`, { x: textX, y: 62, size: 7.5, font: sans, color: GREY });

  return pdf.save();
}