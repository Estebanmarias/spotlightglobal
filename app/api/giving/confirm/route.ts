import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

const PURPOSES = ["Tithe", "Offering", "Prophetic Seed", "Welfare", "Projects", "Partnership", "Other"];
const CURRENCIES = ["NGN", "USD", "GBP"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s\-()]{7,20}$/;

const clean = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

async function allowed(ip: string) {
  try {
    const limiter = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(8, "1 h"), prefix: "spotlight:giving-confirm" });
    return (await limiter.limit(ip)).success;
  } catch (error) {
    console.error("[GIVING CONFIRM] rate limiter unavailable, allowing request:", error);
    return true;
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.");
  }
  if (typeof body.hp_field === "string" && body.hp_field.trim()) return NextResponse.json({ success: true });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  if (!(await allowed(ip))) return fail("Too many submissions. Please try again a little later.", 429);

  const donorName = clean(body.donorName, 120);
  const contact = clean(body.contact, 120);
  const purpose = clean(body.purpose, 80);
  const currency = clean(body.currency, 3);
  const reference = clean(body.reference, 120) || null;
  const givenOn = clean(body.givenOn, 10);
  const amount = Number(body.amount);

  if (donorName.length < 2) return fail("Please enter your name.");
  if (!(contact.includes("@") ? EMAIL.test(contact) : PHONE.test(contact))) return fail("Enter a valid email address or phone number.");
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) return fail("Enter the amount you gave.");
  if (!CURRENCIES.includes(currency)) return fail("Choose a currency.");
  if (!PURPOSES.includes(purpose)) return fail("Choose what you gave towards.");

  const earliest = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
  const latest = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(givenOn) || givenOn < earliest || givenOn > latest) {
    return fail("Enter the date you gave (within the last 90 days).");
  }

  const { error } = await getSupabaseAdminClient().from("giving_confirmations").insert({
    donor_name: donorName,
    contact,
    amount: Math.round(amount * 100) / 100,
    currency,
    purpose,
    given_on: givenOn,
    reference,
  });
  if (error) {
    console.error("[GIVING CONFIRM] insert failed:", error.message);
    return fail("We couldn't save your note. Please try again.", 500);
  }
  return NextResponse.json({ success: true });
}