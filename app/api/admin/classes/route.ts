import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { authorizeClassesManager, notifyEligibleForIntake, sendClassEmail, syncMemberStatusToBrevo } from "@/lib/classes";
import { newCertificateCode } from "@/lib/certificate";
import { sendCertificateEmail } from "@/lib/class-certificates";

export const maxDuration = 60;

const UUID = /^[0-9a-f-]{36}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS = /^https:\/\/\S+$/i;

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const optInt = (value: unknown): number | null | "invalid" => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : "invalid";
};

export async function GET(request: NextRequest) {
  const manager = await authorizeClassesManager(request);
  if (!manager) return fail("Not authorized.", 403);

  const supabase = getSupabaseAdminClient();
  const intakeId = request.nextUrl.searchParams.get("intake");

  const [programs, intakes, enrollmentRows] = await Promise.all([
    supabase.from("class_programs").select("*").order("sort_order"),
    supabase.from("class_intakes").select("*").order("start_date", { ascending: false }),
    supabase.from("class_enrollments").select("intake_id, status"),
  ]);
  if (programs.error || intakes.error || enrollmentRows.error) {
    console.error("[CLASSES ADMIN] load failed:", programs.error?.message, intakes.error?.message, enrollmentRows.error?.message);
    return fail("Could not load classes.", 500);
  }

  const counts: Record<string, number> = {};
  for (const row of enrollmentRows.data ?? []) {
    if (!["dropped", "rejected"].includes(row.status)) counts[row.intake_id] = (counts[row.intake_id] ?? 0) + 1;
  }

  const result: Record<string, unknown> = { programs: programs.data, intakes: intakes.data, counts };

  if (intakeId && UUID.test(intakeId)) {
    const [sessions, enrollments] = await Promise.all([
      supabase.from("class_sessions").select("*").eq("intake_id", intakeId).order("session_date"),
      supabase.from("class_enrollments").select("*").eq("intake_id", intakeId).order("created_at"),
    ]);
    if (sessions.error || enrollments.error) return fail("Could not load this intake.", 500);

    const sessionIds = (sessions.data ?? []).map((s) => s.id);
    const attendance = sessionIds.length
      ? await supabase.from("class_attendance").select("enrollment_id, session_id, present").in("session_id", sessionIds)
      : { data: [], error: null };
    if (attendance.error) return fail("Could not load attendance.", 500);

    result.sessions = sessions.data;
    result.enrollments = enrollments.data;
    result.attendance = attendance.data;
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const manager = await authorizeClassesManager(request);
  if (!manager) return fail("Not authorized.", 403);

  let p: Record<string, unknown>;
  try {
    p = await request.json();
  } catch {
    return fail("Invalid request body.");
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const deleteIntake = async (intakeId: string) => {
    const { data: intake } = await supabase
      .from("class_intakes")
      .select("id")
      .eq("id", intakeId)
      .maybeSingle();
    if (!intake) return "Intake not found.";

    const { data: sessions } = await supabase
      .from("class_sessions")
      .select("id")
      .eq("intake_id", intakeId);
    const sessionIds = (sessions ?? []).map((session) => session.id);
    if (sessionIds.length) {
      const { error } = await supabase.from("class_attendance").delete().in("session_id", sessionIds);
      if (error) return "Could not delete intake attendance.";
    }

    const { data: enrollments } = await supabase
      .from("class_enrollments")
      .select("id")
      .eq("intake_id", intakeId);
    const enrollmentIds = (enrollments ?? []).map((enrollment) => enrollment.id);
    if (enrollmentIds.length) {
      const { error } = await supabase.from("class_email_log").delete().in("enrollment_id", enrollmentIds);
      if (error) return "Could not delete intake email records.";
    }

    for (const table of ["class_notify_log", "class_enrollments", "class_sessions"]) {
      const { error } = await supabase.from(table).delete().eq("intake_id", intakeId);
      if (error) return "Could not delete the intake.";
    }

    const { error } = await supabase.from("class_intakes").delete().eq("id", intakeId);
    return error ? "Could not delete the intake." : null;
  };

  // ── Intake actions ─────────────────────────────────────────────
  if (p.action === "create_intake") {
    const programId = text(p.program_id, 36);
    const title = text(p.title, 120);
    const start = text(p.start_date, 10);
    const end = text(p.end_date, 10);
    const deadline = text(p.registration_deadline, 10);
    const price = Number(p.price ?? 0);
    const capacity = optInt(p.capacity);
    const minSessions = optInt(p.min_sessions);
    const link = text(p.meeting_link, 500);

    if (!UUID.test(programId)) return fail("Choose a class.");
    if (title.length < 2) return fail("Give the intake a title.");
    if (!DATE.test(start) || !DATE.test(end) || end < start) return fail("Check the start and end dates.");
    if (deadline && !DATE.test(deadline)) return fail("Check the registration deadline.");
    if (!Number.isFinite(price) || price < 0) return fail("Check the price.");
    if (capacity === "invalid" || minSessions === "invalid") return fail("Capacity and minimum sessions must be whole numbers.");
    if (link && !HTTPS.test(link)) return fail("The class link must start with https://");

    const rawSessions = Array.isArray(p.sessions) ? p.sessions : [];
    if (rawSessions.length > 40) return fail("Too many sessions.");
    const sessions: { session_date: string; title: string; mode: string; time_label: string | null }[] = [];
    for (const raw of rawSessions as Record<string, unknown>[]) {
      const date = text(raw?.session_date, 10);
      const sTitle = text(raw?.title, 120);
      const mode = raw?.mode === "remote" ? "remote" : "in_person";
      if (!DATE.test(date) || !sTitle) return fail("Every session needs a date and a title.");
      sessions.push({ session_date: date, title: sTitle, mode, time_label: text(raw?.time_label, 60) || null });
    }

    const { data: intake, error } = await supabase
      .from("class_intakes")
      .insert({
        program_id: programId,
        title,
        start_date: start,
        end_date: end,
        registration_deadline: deadline || null,
        capacity,
        price,
        payment_instructions: text(p.payment_instructions, 2000) || null,
        meeting_details: text(p.meeting_details, 1000) || null,
        meeting_link: link || null,
        min_sessions: minSessions,
      })
      .select("id")
      .single();
    if (error || !intake) {
      console.error("[CLASSES ADMIN] create intake:", error?.message);
      return fail("Could not create the intake.", 500);
    }

    if (sessions.length) {
      const { error: sessionError } = await supabase
        .from("class_sessions")
        .insert(sessions.map((s) => ({ ...s, intake_id: intake.id })));
      if (sessionError) {
        await supabase.from("class_intakes").delete().eq("id", intake.id);
        console.error("[CLASSES ADMIN] create sessions:", sessionError.message);
        return fail("Could not save the sessions.", 500);
      }
    }
    return NextResponse.json({ success: true, id: intake.id });
  }

  if (p.action === "update_intake") {
    const intakeId = text(p.intake_id, 36);
    if (!UUID.test(intakeId)) return fail("Invalid intake.");
    const patch: Record<string, unknown> = {};

    if ("title" in p) {
      const v = text(p.title, 120);
      if (v.length < 2) return fail("The title is too short.");
      patch.title = v;
    }
    if ("registration_open" in p) {
      if (typeof p.registration_open !== "boolean") return fail("Invalid value.");
      patch.registration_open = p.registration_open;
    }
    if ("registration_deadline" in p) {
      const v = text(p.registration_deadline, 10);
      if (v && !DATE.test(v)) return fail("Check the registration deadline.");
      patch.registration_deadline = v || null;
    }
    if ("capacity" in p) {
      const v = optInt(p.capacity);
      if (v === "invalid") return fail("Capacity must be a whole number.");
      patch.capacity = v;
    }
    if ("min_sessions" in p) {
      const v = optInt(p.min_sessions);
      if (v === "invalid") return fail("Minimum sessions must be a whole number.");
      patch.min_sessions = v;
    }
    if ("price" in p) {
      const v = Number(p.price);
      if (!Number.isFinite(v) || v < 0) return fail("Check the price.");
      patch.price = v;
    }
    if ("payment_instructions" in p) patch.payment_instructions = text(p.payment_instructions, 2000) || null;
    if ("meeting_details" in p) patch.meeting_details = text(p.meeting_details, 1000) || null;
    if ("meeting_link" in p) {
      const v = text(p.meeting_link, 500);
      if (v && !HTTPS.test(v)) return fail("The class link must start with https://");
      patch.meeting_link = v || null;
    }
    if (!Object.keys(patch).length) return fail("Nothing to update.");

    const { error } = await supabase.from("class_intakes").update(patch).eq("id", intakeId);
    if (error) {
      console.error("[CLASSES ADMIN] update intake:", error.message);
      return fail("Could not update the intake.", 500);
    }
    let notified = 0;
    if (patch.registration_open === true) {
      const r = await notifyEligibleForIntake(supabase, intakeId);
      notified = r.sent;
    }
    return NextResponse.json({ success: true, notified });
  }

  // ── Attendance ─────────────────────────────────────────────────
  if (p.action === "set_attendance") {
    const enrollmentId = text(p.enrollment_id, 36);
    const sessionId = text(p.session_id, 36);
    if (!UUID.test(enrollmentId) || !UUID.test(sessionId) || typeof p.present !== "boolean") return fail("Invalid request.");

    const [{ data: enrollment }, { data: session }] = await Promise.all([
      supabase.from("class_enrollments").select("intake_id, status, approval_status, payment_status").eq("id", enrollmentId).maybeSingle(),
      supabase.from("class_sessions").select("intake_id").eq("id", sessionId).maybeSingle(),
    ]);
    if (!enrollment || !session || enrollment.intake_id !== session.intake_id) return fail("That session doesn't belong to this intake.");

    const { error } = await supabase.from("class_attendance").upsert(
      { enrollment_id: enrollmentId, session_id: sessionId, present: p.present, marked_by: manager.userId, marked_at: now },
      { onConflict: "enrollment_id,session_id" },
    );
    if (error) {
      console.error("[CLASSES ADMIN] attendance:", error.message);
      return fail("Could not save attendance.", 500);
    }
    if (p.present && enrollment.status === "registered" && enrollment.approval_status !== "pending" && enrollment.payment_status !== "pending") {
      await supabase.from("class_enrollments").update({ status: "in_progress" }).eq("id", enrollmentId).eq("status", "registered");
    }
    return NextResponse.json({ success: true });
  }

  if (p.action === "delete_intake") {
    const intakeId = text(p.intake_id, 36);
    if (!UUID.test(intakeId)) return fail("Invalid intake.");
    const error = await deleteIntake(intakeId);
    if (error) return fail(error, error === "Intake not found." ? 404 : 500);
    return NextResponse.json({ success: true });
  }

  // ── Enrollment actions ─────────────────────────────────────────
  if (p.action === "search_members") {
    const raw = text(p.query, 60);
    const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
    if (raw.length < 2 || !words.length) return NextResponse.json({ members: [] });
    const longest = words.reduce((a, b) => (b.length > a.length ? b : a)).replace(/[\\%_]/g, (c) => `\\${c}`);
    const pattern = `%${longest}%`;
    const found = await Promise.all(
      ["first_name", "last_name", "email"].map((col) =>
        supabase.from("members").select("id, first_name, last_name, email, phone").ilike(col, pattern).limit(15),
      ),
    );
    const seen = new Map<string, { id: string; first_name: string; last_name: string; email: string; phone: string | null }>();
    for (const r of found) for (const m of r.data ?? []) seen.set(m.id, m);
    const members = [...seen.values()]
      .filter((m) => words.every((w) => `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(w)))
      .slice(0, 8);
    return NextResponse.json({ members });
  }

  if (p.action === "add_enrollment") {
    const intakeId = text(p.intake_id, 36);
    const memberId = text(p.member_id, 36);
    if (!UUID.test(intakeId) || !UUID.test(memberId)) return fail("Choose a person to add.");

    const [{ data: intake }, { data: member }] = await Promise.all([
      supabase.from("class_intakes").select("id, program_id, price, currency, end_date, capacity").eq("id", intakeId).maybeSingle(),
      supabase.from("members").select("id, first_name, last_name, email, phone").eq("id", memberId).maybeSingle(),
    ]);
    if (!intake) return fail("Intake not found.", 404);
    if (!member) return fail("That person isn’t in the members list.", 404);
    if (intake.end_date < new Date().toISOString().slice(0, 10)) return fail("This intake has ended.", 409);

    const { data: program } = await supabase
      .from("class_programs")
      .select("id, slug, eligibility, prerequisite_program_id, requires_approval")
      .eq("id", intake.program_id)
      .single();
    if (!program) return fail("Class not found.", 404);

    const email = String(member.email).trim().toLowerCase();
    const fullName = `${member.first_name} ${member.last_name}`.trim();
    const phone = String(member.phone ?? "").trim();
    if (fullName.length < 2) return fail("This member has no name on file.");
    if (phone.length < 7 || phone.length > 30) {
      return fail("This member has no valid phone number on file. Add one on the Members page first.");
    }

    let prerequisiteMet = true;
    if (program.eligibility === "prerequisite") {
      prerequisiteMet = false;
      if (program.prerequisite_program_id) {
        const { data: prior } = await supabase.from("class_intakes").select("id").eq("program_id", program.prerequisite_program_id);
        const ids = (prior ?? []).map((i: { id: string }) => i.id);
        if (ids.length) {
          const { count } = await supabase
            .from("class_enrollments")
            .select("id", { count: "exact", head: true })
            .in("intake_id", ids)
            .eq("email", email)
            .eq("status", "completed");
          prerequisiteMet = (count ?? 0) > 0;
        }
      }
      if (!prerequisiteMet) return fail("They haven’t completed the earlier class, so they can’t join this one yet.", 409);
    }

    if (intake.capacity) {
      const { count } = await supabase
        .from("class_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("intake_id", intakeId)
        .not("status", "in", "(dropped,rejected)");
      if ((count ?? 0) >= intake.capacity) return fail("This intake is full. Raise the capacity first.", 409);
    }

    const preComplete = p.already_completed === true;
    if (preComplete) {
      const { data: dependents } = await supabase.from("class_programs").select("id").eq("prerequisite_program_id", program.id).limit(1);
      if (!dependents?.length) return fail("Only a class that unlocks another class can be marked as already completed.");
    }

    const price = Number(intake.price);
    const paid = (p.mark_paid === true || preComplete) && price > 0;
    const approved = Boolean(program.requires_approval);

    const { data: created, error: insertError } = await supabase
      .from("class_enrollments")
      .insert({
        intake_id: intakeId,
        member_id: member.id,
        full_name: fullName,
        email,
        phone,
        status: preComplete ? "completed" : "registered",
        approval_status: approved ? "approved" : "not_required",
        prerequisite_met: prerequisiteMet,
        payment_status: price > 0 ? (paid ? "paid" : "pending") : "free",
        amount_due: price,
        currency: intake.currency,
        amount_paid: paid ? price : null,
        paid_at: paid ? now : null,
        paid_by: paid ? manager.userId : null,
        decided_by: approved ? manager.userId : null,
        decided_at: approved ? now : null,
        completed_at: preComplete ? now : null,
        completed_by: preComplete ? manager.userId : null,
      })
      .select("id")
      .single();
    if (insertError || !created) {
      if (insertError?.code === "23505") return fail("They’re already on this roster.", 409);
      console.error("[CLASSES ADMIN] add enrollment:", insertError?.message);
      return fail("Could not add them.", 500);
    }

    if (preComplete && program.slug === "membership-class") {
      await supabase.from("members").update({ membership_confirmed_at: now, guest_status: "Member" }).eq("id", member.id);
      await syncMemberStatusToBrevo(email, "Member", "Attending");
    }

    let emailSent: boolean | undefined;
    if (!preComplete && p.send_email !== false) {
      const sent = await sendClassEmail(supabase, created.id, "confirmation");
      emailSent = sent.sent;
    }
    return NextResponse.json({ success: true, emailSent });
  }

  const enrollmentId = text(p.enrollment_id, 36);
  if (!UUID.test(enrollmentId)) return fail("Invalid enrollment.");
  const { data: e } = await supabase.from("class_enrollments").select("*").eq("id", enrollmentId).maybeSingle();
  if (!e) return fail("Enrollment not found.", 404);

  if (p.action === "confirm_payment") {
    if (e.payment_status !== "pending" || e.status === "rejected") return fail("Only pending payments can be confirmed.", 409);
    const reference = text(p.payment_reference, 160);
    const { data: updated, error } = await supabase
      .from("class_enrollments")
      .update({ payment_status: "paid", amount_paid: e.amount_due, payment_reference: reference || null, paid_at: now, paid_by: manager.userId })
      .eq("id", enrollmentId)
      .eq("payment_status", "pending")
      .select("id")
      .maybeSingle();
    if (error) return fail("Could not confirm payment.", 500);
    if (!updated) return fail("This payment was already confirmed.", 409);
    const sent = await sendClassEmail(supabase, enrollmentId, "payment_confirmed");
    return NextResponse.json({ success: true, emailSent: sent.sent });
  }

  if (p.action === "approve" || p.action === "reject") {
    if (e.approval_status !== "pending") return fail("This registration isn't waiting for a decision.", 409);
    if (p.action === "approve" && !e.prerequisite_met) {
      return fail("This person hasn’t completed the prerequisite class, so they can’t be approved. You can reject or drop them.", 409);
    }
    const rejecting = p.action === "reject";
    const { data: updated, error } = await supabase
      .from("class_enrollments")
      .update({
        approval_status: rejecting ? "rejected" : "approved",
        status: rejecting ? "rejected" : e.status,
        payment_status: rejecting && e.payment_status === "paid" ? "refund_due" : e.payment_status,
        decided_by: manager.userId,
        decided_at: now,
      })
      .eq("id", enrollmentId)
      .eq("approval_status", "pending")
      .select("id")
      .maybeSingle();
    if (error) return fail("Could not save the decision.", 500);
    if (!updated) return fail("This registration was already decided.", 409);
    const sent = await sendClassEmail(supabase, enrollmentId, rejecting ? "rejected" : "approved");
    return NextResponse.json({ success: true, emailSent: sent.sent });
  }

  if (p.action === "mark_refunded") {
    if (e.payment_status !== "refund_due") return fail("No refund is due.", 409);
    const { error } = await supabase.from("class_enrollments").update({ payment_status: "refunded" }).eq("id", enrollmentId).eq("payment_status", "refund_due");
    if (error) return fail("Could not update the refund.", 500);
    return NextResponse.json({ success: true });
  }

  if (p.action === "set_status") {
    const status = text(p.status, 20);
    if (!["registered", "in_progress", "dropped"].includes(status)) return fail("Invalid status.");
    if (["pending", "rejected"].includes(e.approval_status) && status === "in_progress") {
      return fail("Approve this registration before starting the class.", 409);
    }
    const { error } = await supabase.from("class_enrollments").update({ status }).eq("id", enrollmentId);
    if (error) return fail("Could not update the status.", 500);
    return NextResponse.json({ success: true });
  }

  if (p.action === "mark_completed") {
    if (e.status === "completed") return fail("Already completed.", 409);
    if (["dropped", "rejected"].includes(e.status)) return fail("This registration is not active.", 409);
    if (["pending", "rejected"].includes(e.approval_status)) return fail("Approve this registration first.", 409);
    if (e.payment_status === "pending") return fail("Confirm the payment first.", 409);

    const { data: intake } = await supabase.from("class_intakes").select("program_id, min_sessions").eq("id", e.intake_id).single();
    if (!intake) return fail("Intake not found.", 404);

    if (intake.min_sessions && p.force !== true) {
      const { data: sessionRows } = await supabase.from("class_sessions").select("id").eq("intake_id", e.intake_id);
      const ids = (sessionRows ?? []).map((s: { id: string }) => s.id);
      let attended = 0;
      if (ids.length) {
        const { count } = await supabase
          .from("class_attendance")
          .select("session_id", { count: "exact", head: true })
          .eq("enrollment_id", enrollmentId)
          .eq("present", true)
          .in("session_id", ids);
        attended = count ?? 0;
      }
      if (attended < intake.min_sessions) {
        return NextResponse.json(
          { error: `Attended ${attended} of the ${intake.min_sessions} required sessions.`, needsForce: true },
          { status: 409 },
        );
      }
    }

    const { data: done, error } = await supabase
      .from("class_enrollments")
      .update({ status: "completed", completed_at: now, completed_by: manager.userId })
      .eq("id", enrollmentId)
      .neq("status", "completed")
      .select("id")
      .maybeSingle();
    if (error) return fail("Could not mark as completed.", 500);
    if (!done) return fail("Already completed.", 409);

    let membershipConfirmed = false;
    const { data: program } = await supabase.from("class_programs").select("slug").eq("id", intake.program_id).single();
    if (program?.slug === "membership-class") {
      // ilike is used for case-insensitive matching, so escape % and _ in the address
      const pattern = String(e.email).replace(/[\\%_]/g, (c: string) => `\\${c}`);
      const { data: matched, error: memberError } = await supabase
        .from("members")
        .update({ membership_confirmed_at: now, guest_status: "Member" })
        .ilike("email", pattern)
        .select("id");
      if (memberError) console.error("[CLASSES ADMIN] member confirm:", memberError.message);
      membershipConfirmed = (matched ?? []).length > 0;      membershipConfirmed = (matched ?? []).length > 0;
      if (membershipConfirmed) await syncMemberStatusToBrevo(String(e.email), "Member", "Attending");
    }
    const sent = await sendClassEmail(supabase, enrollmentId, "completed", { membershipConfirmed });
    return NextResponse.json({ success: true, membershipConfirmed, emailSent: sent.sent });
  }

    if (p.action === "issue_certificate") {
    if (e.status !== "completed") return fail("Only completed enrollments can receive a certificate.", 409);
    if (e.certificate_issued_at) return fail("A certificate was already issued.", 409);

    const code = newCertificateCode();
    // Claim first, so a double click can’t issue two certificates
    const { data: claimed } = await supabase
      .from("class_enrollments")
      .update({ certificate_issued_at: now, certificate_provider: "spotlight", certificate_id: code })
      .eq("id", enrollmentId)
      .is("certificate_issued_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) return fail("A certificate was already issued.", 409);

    const sent = await sendCertificateEmail(supabase, enrollmentId);
    if (!sent.ok) {
      await supabase
        .from("class_enrollments")
        .update({ certificate_issued_at: null, certificate_provider: null, certificate_id: null })
        .eq("id", enrollmentId);
      return fail(sent.error, 502);
    }
    return NextResponse.json({ success: true });
  }

  return fail("Unknown action.");
}