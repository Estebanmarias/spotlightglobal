import type { PageKey } from "@/lib/use-admin-permissions";

export type AdminNavItem = {
  icon: string;
  label: string;
  href: string;
  page?: PageKey;
};

export const ADMIN_NAV_GROUPS: AdminNavItem[][] = [
  [
    { icon: "dashboard", label: "Dashboard", href: "/admin/dashboard", page: "dashboard" },
    { icon: "analytics", label: "Analytics", href: "/admin/analytics", page: "analytics" },
  ],
  [
    { icon: "group", label: "Members", href: "/admin/members", page: "members" },
    { icon: "fact_check", label: "Attendance", href: "/admin/attendance", page: "attendance" },
    { icon: "school", label: "Classes", href: "/admin/classes", page: "classes" },
    { icon: "church", label: "Ministries", href: "/admin/ministries", page: "ministries" },
    { icon: "favorite", label: "Prayer", href: "/admin/prayer", page: "prayer" },
  ],
  [
    { icon: "volunteer_activism", label: "Giving", href: "/admin/giving", page: "giving" },
    { icon: "handshake", label: "Partners", href: "/admin/partner", page: "partners" },
    { icon: "campaign", label: "Messaging", href: "/admin/messaging", page: "messaging" },
  ],
  [
    { icon: "settings", label: "Settings", href: "/admin/settings" },
    { icon: "database", label: "Backups", href: "/admin/backups", page: "settings" },
    { icon: "fact_check", label: "Audit log", href: "/admin/audit-log", page: "settings" },
  ],
];

export const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/admin/add-member": "Add Member",
  "/admin/ministry-dashboard": "Ministry Dashboard",
};
