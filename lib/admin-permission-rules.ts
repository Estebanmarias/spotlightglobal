import type { PageKey } from "@/lib/use-admin-permissions";

export function canAccessAdminPage(
  role: "admin" | "super_admin" | "",
  permissions: PageKey[],
  page: PageKey,
  isPureMinistryLeader: boolean,
) {
  return role === "super_admin" || (!isPureMinistryLeader && permissions.includes(page));
}

export function acceptsDestructiveConfirmation(value: string, expected = "DELETE") {
  return value.trim() === expected;
}
