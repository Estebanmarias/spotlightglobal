export type AuditEntry = {
  id?: string;
  created_at?: string | null;
  createdAt?: string | null;
  actor_name?: string | null;
  actorName?: string | null;
  actor_email?: string | null;
  actorEmail?: string | null;
  action: string;
  entity_type?: string | null;
  entityType?: string | null;
  entity_id?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type AuditTone = "added" | "changed" | "removed" | "info";

export type AuditDescription = {
  who: string;
  summary: string;
  details: string[];
  group: string;
  tone: AuditTone;
  when: string;
};

export const AUDIT_GROUPS = [
  "Members", "Events", "Classes", "Giving", "Prayer", "Ministries",
  "Partners", "Attendance", "Website", "Team and access", "System", "Other",
];

const TABLES: Record<string, { noun: string; group: string }> = {
  members: { noun: "a member", group: "Members" },
  member: { noun: "a member", group: "Members" },
  admin_role: { noun: "an admin account", group: "Team and access" },
  class_intake: { noun: "a class cohort", group: "Classes" },
  admin_roles: { noun: "an admin account", group: "Team and access" },
  ministries: { noun: "a ministry", group: "Ministries" },
  ministry_members: { noun: "a ministry member", group: "Ministries" },
  ministry_leaders: { noun: "a ministry leader", group: "Ministries" },
  church_events: { noun: "an event", group: "Events" },
  event_registrations: { noun: "an event registration", group: "Events" },
  event_prayer_requests: { noun: "an event prayer request", group: "Prayer" },
  prayer_requests: { noun: "a prayer request", group: "Prayer" },
  community_photos: { noun: "a gallery photo", group: "Website" },
  testimonies: { noun: "a testimony", group: "Website" },
  push_messages: { noun: "a scheduled notification", group: "Website" },
  devotionals: { noun: "a devotional", group: "Website" },
  blog_posts: { noun: "a blog post", group: "Website" },
  partner_submissions: { noun: "a partnership submission", group: "Partners" },
  class_programs: { noun: "a class", group: "Classes" },
  class_intakes: { noun: "a class cohort", group: "Classes" },
  class_sessions: { noun: "a class session", group: "Classes" },
  class_enrollments: { noun: "a class enrollment", group: "Classes" },
  class_attendance: { noun: "a class attendance record", group: "Classes" },
  attendance: { noun: "an attendance record", group: "Attendance" },
  attendance_records: { noun: "an attendance record", group: "Attendance" },
  sunday_attendance: { noun: "an attendance record", group: "Attendance" },
  giving: { noun: "a giving record", group: "Giving" },
  giving_records: { noun: "a giving record", group: "Giving" },
  donations: { noun: "a giving record", group: "Giving" },
  giving_confirmations: { noun: "a note from a giver", group: "Giving" },
};

const VERBS: Record<string, { text: string; tone: AuditTone }> = {
  created: { text: "added", tone: "added" },
  deleted: { text: "deleted", tone: "removed" },
  updated: { text: "changed", tone: "changed" },
};

const FIELDS: Record<string, string> = {
  first_name: "first name", last_name: "last name", full_name: "name", name: "name", title: "title",
  email: "email address", phone: "phone number", address: "address", dob: "date of birth",
  guest_status: "membership status", status: "status", role: "role", permissions: "access",
  is_ministry_leader: "ministry leader access", payment_status: "payment status",
  approval_status: "approval", registration_status: "registration status",
  registration_enabled: "registration", registration_open: "registration",
  registration_capacity: "capacity", capacity: "capacity", registration_deadline: "registration deadline",
  is_featured: "featured on the website", price: "price", price_type: "fee type",
  event_date: "date", event_end_date: "last day", event_time: "time", location: "venue",
  recurrence: "repeat setting", amount_paid: "amount paid", amount_due: "amount due",
  is_active: "active", thank_you_enabled: "thank-you email", thank_you_message: "thank-you message",
  description: "description", flyer_url: "flyer", special_session_label: "special session",
  admin_notes: "notes", discovery_source: "how they heard about us", interests: "interests",
  is_visible: "shown on the website", testimony: "testimony text", send_on: "send date",
  body: "message", url: "link opened",
};

const VALUES: Record<string, string> = {
  First_Timer: "First Timer", Attending: "Attending", Member: "Member",
  new: "New", prayed: "Prayed", follow_up: "Follow up", matched: "Matched",
  not_found: "Couldn't find", duplicate: "Duplicate", registered: "Registered",
  cancelled: "Cancelled", completed: "Completed", pending: "Pending", approved: "Approved",
  rejected: "Rejected", paid: "Paid", free: "Confirmed (free)", refund_due: "Refund due",
  refunded: "Refunded", none: "Does not repeat", weekly: "Every week",
  super_admin: "Setman", admin: "Admin", ministry_leader: "Ministry leader",
};

const PAGES: Record<string, string> = {
  dashboard: "Dashboard", members: "Members", attendance: "Attendance", ministries: "Ministries",
  analytics: "Analytics", giving: "Giving", partners: "Partners", messaging: "Messaging",
  blog: "Blog", classes: "Classes", prayer: "Prayer requests", settings: "Settings",
};

const RETENTION_LABELS: Record<string, string> = {
  prayer_requests_deleted: "old prayer requests deleted",
  event_prayer_requests_deleted: "old event prayer requests deleted",
  event_registrations_anonymised: "old event registrations made anonymous",
  event_email_log_deleted: "old event email records deleted",
  class_email_log_deleted: "old class email records deleted",
  giving_confirmations_deleted: "old giver notes deleted",
  class_enrollment_phones_cleared: "class phone numbers removed",
  partner_submissions_deleted: "old partnership submissions deleted",
  audit_logs_deleted: "old activity records deleted",
};

const IGNORED_FIELDS = new Set(["id", "created_at", "updated_at", "added_by"]);

const SERVER_ACTIONS: Record<string, { text: string; group: string; tone: AuditTone }> = {
  update_admin_permissions: { text: "changed an admin's access", group: "Team and access", tone: "changed" },
  delete_cohort: { text: "deleted a class cohort", group: "Classes", tone: "removed" },
};
const SKIP_KEYS = new Set(["via", "record", "changed", "tracked"]);

const sentenceCase = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

const humanize = (value: string) =>
  sentenceCase(value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[._]+/g, " ").replace(/\bintake(s)?\b/gi, "cohort$1").trim());

const fieldLabel = (field: string) => FIELDS[field] ?? humanize(field).toLowerCase();

function listText(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "empty";
  if (typeof value === "boolean") return value ? "on" : "off";
  if (typeof value === "number") return value.toLocaleString("en-NG");
  if (Array.isArray(value)) return value.length ? value.map((item) => formatValue(field, item)).join(", ") : "none";
  if (typeof value === "string" && field === "permissions") {
    return value.split(",").map((page) => PAGES[page.trim()] ?? humanize(page.trim())).filter(Boolean).join(", ") || "none";
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(`${value.slice(0, 10)}T00:00:00`);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
      }
    }
    return VALUES[value] ?? PAGES[value] ?? humanize(value);
  }
  return "updated";
}

function describePermissions(from: unknown, to: unknown) {
  const before = new Set(Array.isArray(from) ? (from as string[]) : []);
  const after = new Set(Array.isArray(to) ? (to as string[]) : []);
  const name = (page: string) => PAGES[page] ?? humanize(page);
  const added = [...after].filter((page) => !before.has(page)).map(name);
  const removed = [...before].filter((page) => !after.has(page)).map(name);
  const parts: string[] = [];
  if (added.length) parts.push(`Gave access to ${listText(added)}`);
  if (removed.length) parts.push(`Removed access to ${listText(removed)}`);
  return parts.join(". ") || "Access list changed";
}

function recordLabel(record: Record<string, unknown> | undefined) {
  if (!record) return "";
  const text = (key: string) => (typeof record[key] === "string" ? (record[key] as string).trim() : "");
  const person = [text("first_name"), text("last_name")].filter(Boolean).join(" ");
  const main = person || text("full_name") || text("name") || text("title");
  const email = text("email");
  if (main && email && email.toLowerCase() !== main.toLowerCase()) return `${main} (${email})`;
  return main || email;
}

function describeUpdate(meta: Record<string, unknown>) {
  const details: string[] = [];
  const tracked = (meta.tracked && typeof meta.tracked === "object" ? meta.tracked : {}) as Record<
    string,
    { from?: unknown; to?: unknown }
  >;
  for (const [field, change] of Object.entries(tracked)) {
    if (field === "permissions") {
      details.push(describePermissions(change?.from, change?.to));
      continue;
    }
    details.push(
      `${sentenceCase(fieldLabel(field))}: ${formatValue(field, change?.from)} → ${formatValue(field, change?.to)}`,
    );
  }
  const changed = Array.isArray(meta.changed)
    ? (meta.changed as unknown[]).filter((field): field is string => typeof field === "string")
    : [];
  const others = changed.filter((field) => !(field in tracked) && !IGNORED_FIELDS.has(field)).map(fieldLabel);
  if (others.length) details.push(`Also updated: ${listText(others)}`);
  return details;
}

function describeGeneric(meta: Record<string, unknown>) {
  const lines: string[] = [];
  const label = recordLabel(
    meta.record && typeof meta.record === "object" ? (meta.record as Record<string, unknown>) : undefined,
  );
  if (label) lines.push(label);
  for (const [key, value] of Object.entries(meta)) {
    if (SKIP_KEYS.has(key) || value === null || typeof value === "object") continue;
    lines.push(`${sentenceCase(fieldLabel(key))}: ${formatValue(key, value)}`);
    if (lines.length >= 5) break;
  }
  return lines;
}

function guessGroup(action: string) {
  const a = action.toLowerCase();
  if (a.includes("backup") || a.includes("retention")) return "System";
  if (a.includes("class") || a.includes("cohort") || a.includes("certificate")) return "Classes";
  if (a.includes("member")) return "Members";
  if (a.includes("event")) return "Events";
  if (a.includes("giving")) return "Giving";
  if (a.includes("prayer")) return "Prayer";
  return "Other";
}

function guessTone(action: string): AuditTone {
  const a = action.toLowerCase();
  if (a.includes("delet") || a.includes("remov")) return "removed";
  if (a.includes("creat") || a.includes("add")) return "added";
  if (a.includes("updat") || a.includes("chang") || a.includes("edit")) return "changed";
  return "info";
}

export function formatAuditTime(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
  const day =
    date.toDateString() === new Date().toDateString()
      ? "Today"
      : date.toDateString() === new Date(Date.now() - 86_400_000).toDateString()
        ? "Yesterday"
        : date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  return `${day}, ${time}`;
}

export function describeAudit(entry: AuditEntry): AuditDescription {
  const meta: Record<string, unknown> = entry.metadata && typeof entry.metadata === "object" ? entry.metadata : {};
  const via = typeof meta.via === "string" ? meta.via : "";
  const name = (entry.actor_name ?? entry.actorName ?? "").trim();
  const email = (entry.actor_email ?? entry.actorEmail ?? "").trim();
  const who = name || email || (via === "browser" ? "Someone" : "The system");
  const when = formatAuditTime(entry.created_at ?? entry.createdAt);

  const action = entry.action || "";
  const dot = action.lastIndexOf(".");
  const prefix = dot > 0 ? action.slice(0, dot) : action;
  const verbKey = dot > 0 ? action.slice(dot + 1) : "";

  if (prefix === "retention") {
    const practice = verbKey === "dry_run";
    const details: string[] = [];
    for (const [key, text] of Object.entries(RETENTION_LABELS)) {
      const value = meta[key];
      if (typeof value === "number" && value > 0) {
        details.push(`${value.toLocaleString("en-NG")} ${text}${practice ? " (not done)" : ""}`);
      } else if (typeof value === "string" && value.startsWith("error")) {
        details.push(`Problem with this step: ${text}`);
      }
    }
    if (!details.length) details.push("Nothing needed cleaning.");
    return {
      who: "The system",
      summary: practice ? "Monthly cleanup practice run (nothing was deleted)" : "Monthly cleanup ran",
      details,
      group: "System",
      tone: "info",
      when,
    };
  }

  const entityType = entry.entity_type ?? entry.entityType ?? "";
  const table = TABLES[prefix] ?? TABLES[entityType];
  const verb = VERBS[verbKey];

  const server = SERVER_ACTIONS[action];
  if (server) {
    return {
      who,
      summary: `${who} ${server.text}`,
      details: describeGeneric(meta),
      group: server.group,
      tone: server.tone,
      when,
    };
  }

  if (table && verb) {
    const record =
      meta.record && typeof meta.record === "object" ? (meta.record as Record<string, unknown>) : undefined;
    const label = recordLabel(record ?? meta);
    return {
      who,
      summary: `${who} ${verb.text} ${table.noun}${label ? `: ${label}` : ""}`,
      details: verb.text === "changed" ? describeUpdate(meta) : [],
      group: table.group,
      tone: verb.tone,
      when,
    };
  }

  return {
    who,
    summary: `${who}: ${humanize(action)}`,
    details: describeGeneric(meta),
    group: guessGroup(action),
    tone: guessTone(action),
    when,
  };
}