"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import type { PageKey } from "@/lib/use-admin-permissions";

type NotificationAccess = {
  loading: boolean;
  isSuperAdmin: boolean;
  canAccess: (page: PageKey) => boolean;
};

type Props = {
  access: NotificationAccess;
  activeOn: "desktop" | "mobile";
};

type Notification = {
  id: string;
  type: "birthday" | "partner" | "broadcast" | "admin-request";
  title: string;
  detail: string;
  href: string;
  createdAt: string;
  daysUntil?: number;
};

function getDaysUntilBirthday(dob: string, today: Date) {
  const dateOfBirth = new Date(dob);
  const birthday = new Date(
    today.getFullYear(),
    dateOfBirth.getMonth(),
    dateOfBirth.getDate(),
  );
  birthday.setHours(0, 0, 0, 0);

  if (birthday < today) birthday.setFullYear(today.getFullYear() + 1);

  return Math.round((birthday.getTime() - today.getTime()) / 86400000);
}

function getBirthdayLabel(daysUntil: number) {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";

  const date = new Date();
  date.setDate(date.getDate() + daysUntil);
  return date.toLocaleDateString("en-NG", { weekday: "long" });
}

function getNotificationDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

export default function BirthdayNotifications({ access, activeOn }: Props) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const canSeeMembers = access.canAccess("members");
  const canSeePartners = access.canAccess("partners");
  const canSeeBroadcasts = access.canAccess("messaging");
  const [matchesPlacement, setMatchesPlacement] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updatePlacement = () => {
      setMatchesPlacement(
        activeOn === "desktop" ? mediaQuery.matches : !mediaQuery.matches,
      );
    };

    updatePlacement();
    mediaQuery.addEventListener("change", updatePlacement);
    return () => mediaQuery.removeEventListener("change", updatePlacement);
  }, [activeOn]);

  useEffect(() => {
    if (access.loading || !matchesPlacement) return;

    let active = true;

    const loadNotifications = async () => {
      setLoading(true);
      const [birthdayResult, partnerResult, broadcastResult, adminResult] =
        await Promise.all([
          canSeeMembers
            ? supabase
                .from("members")
                .select("id, first_name, last_name, dob")
                .not("dob", "is", null)
            : Promise.resolve({ data: [], error: null }),
          canSeePartners
            ? supabase.from("partner_submissions")
                .select("id, created_at, full_name, email, phone, package, other_amount")
                .eq("status", "new")
                .order("created_at", { ascending: false })
                .limit(5)
            : Promise.resolve({ data: [], error: null }),
          canSeeBroadcasts
            ? supabase.from("broadcast_messages")
                .select("id, created_at, subject")
                .eq("status", "failed")
                .order("created_at", { ascending: false })
                .limit(5)
            : Promise.resolve({ data: [], error: null }),
          access.isSuperAdmin
            ? supabase.from("admin_roles")
                .select("id, created_at, full_name, email")
                .eq("status", "pending")
                .order("created_at", { ascending: false })
                .limit(5)
            : Promise.resolve({ data: [], error: null }),
        ]);

      if (!active) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const birthdayNotifications: Notification[] = (birthdayResult.data ?? [])
        .map((member) => {
          const daysUntil = getDaysUntilBirthday(member.dob, today);
          const birthdayDate = new Date(today);
          birthdayDate.setDate(birthdayDate.getDate() + daysUntil);

          return {
            id: `birthday-${member.id}`,
            type: "birthday" as const,
            title: `${member.first_name} ${member.last_name}`,
            detail: getBirthdayLabel(daysUntil),
            href: "/admin/members",
            createdAt: birthdayDate.toISOString(),
            daysUntil,
          };
        })
        .filter((notification) => notification.daysUntil! <= 6)
        .sort((a, b) => a.daysUntil! - b.daysUntil!);

      const partnerNotifications: Notification[] = (partnerResult.data ?? []).map(
        (submission: {
          id: string;
          created_at: string;
          full_name: string;
          email: string;
          phone: string;
          package: string | null;
          other_amount: number | null;
        }) => {
          const packageDetail = submission.package ??
            (submission.other_amount != null
              ? `₦${Number(submission.other_amount).toLocaleString("en-NG")}`
              : "Package not specified");

          return {
            id: `partner-${submission.id}`,
            type: "partner",
            title: submission.full_name || "New partner submission",
            detail: [submission.email, submission.phone, packageDetail]
              .filter(Boolean)
              .join(" · "),
            href: "/admin/partner",
            createdAt: submission.created_at,
          };
        },
      );

      const broadcastNotifications: Notification[] = (
        broadcastResult.data ?? []
      ).map(
        (broadcast: { id: string; created_at: string; subject: string }) => ({
          id: `broadcast-${broadcast.id}`,
          type: "broadcast",
          title: "Broadcast failed",
          detail: broadcast.subject,
          href: "/admin/messaging",
          createdAt: broadcast.created_at,
        }),
      );

      const adminNotifications: Notification[] = (adminResult.data ?? []).map(
        (request: {
          id: string;
          created_at: string;
          full_name: string;
          email: string;
        }) => ({
          id: `admin-request-${request.id}`,
          type: "admin-request",
          title: request.full_name || "Admin access request",
          detail: request.email,
          href: "/admin/settings",
          createdAt: request.created_at,
        }),
      );

      const actionableNotifications = [
        ...partnerNotifications,
        ...broadcastNotifications,
        ...adminNotifications,
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setNotifications([
        ...actionableNotifications,
        ...birthdayNotifications,
      ]);
      setLoading(false);
    };

    loadNotifications().catch(() => {
      if (active) {
        setNotifications([]);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [
    access.loading,
    access.isSuperAdmin,
    matchesPlacement,
    canSeeMembers,
    canSeePartners,
    canSeeBroadcasts,
    supabase,
  ]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const notificationCount = notifications.length;
  const panelId = `admin-notifications-panel-${activeOn}`;

  return (
    <div
      ref={panelRef}
      className="relative shrink-0"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${notificationCount ? `, ${notificationCount} items` : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#c6c6cf] bg-white text-[#081534] shadow-sm transition-colors hover:bg-[#f2f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdc425]"
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          notifications
        </span>
        {!loading && notificationCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.75 min-w-4.75 items-center justify-center rounded-full border-2 border-white bg-[#ba1a1a] px-1 text-[10px] font-bold leading-none text-white">
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}
      </button>

      {open && (
        <section
          id={panelId}
          aria-label="Admin notifications"
          className="absolute right-0 top-12 flex max-h-[calc(100dvh-5rem)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-[#c6c6cf] bg-white shadow-xl"
        >
          <header className="shrink-0 border-b border-[#e2e2e9] px-4 py-3">
            <h2 className="text-[14px] font-bold text-[#081534]">
              Notifications
            </h2>
            <p className="mt-0.5 text-[12px] text-[#5b5d66]">
              {loading
                ? "Checking notifications..."
                : `${notificationCount} item${notificationCount === 1 ? "" : "s"} to review`}
            </p>
          </header>

          {loading ? (
            <div className="space-y-2 p-4" aria-live="polite">
              <div className="h-10 animate-pulse rounded bg-[#f2f4f6]" />
              <div className="h-10 animate-pulse rounded bg-[#f2f4f6]" />
            </div>
          ) : notificationCount ? (
            <ul className="min-h-0 flex-1 divide-y divide-[#f2f4f6] overflow-y-auto overscroll-contain">
              {notifications.map((notification) => {
                const icon = {
                  birthday: "cake",
                  partner: "handshake",
                  broadcast: "campaign",
                  "admin-request": "admin_panel_settings",
                }[notification.type];

                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        router.push(notification.href);
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f7f9fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#fdc425]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f4f6] text-[#081534]">
                        <span className="material-symbols-outlined text-[18px]">
                          {icon}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[#081534]">
                          {notification.type === "birthday"
                            ? `Birthday: ${notification.title}`
                            : notification.title}
                        </span>
                        <span className="mt-0.5 block wrap-break-word text-[11px] leading-4 text-[#5b5d66]">
                          {notification.detail}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] font-medium text-[#5b5d66]">
                        {notification.type === "birthday"
                          ? notification.detail
                          : getNotificationDate(notification.createdAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-[13px] text-[#5b5d66]">
              No notifications right now.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
