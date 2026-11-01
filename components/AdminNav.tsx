"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { ADMIN_NAV_GROUPS } from "@/lib/admin-nav";
import type { PageKey } from "@/lib/use-admin-permissions";

type AdminNavProps = {
  pathname: string;
  loaded: boolean;
  canAccess: (page?: PageKey) => boolean;
  onNavigate?: () => void;
};

export default function AdminNav({ pathname, loaded, canAccess, onNavigate }: AdminNavProps) {
  return (
    <nav
      aria-label="Admin"
      className="min-h-0 flex-1 overflow-y-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {ADMIN_NAV_GROUPS.map((group, groupIndex) => (
        <div key={groupIndex}>
          {groupIndex > 0 && <div className="mx-3 my-1.5 h-px bg-white/10" />}
          {group.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const allowed = !loaded || canAccess(item.page);
            const className = `group relative flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-colors [@media(max-height:640px)]:h-9 ${
              !allowed
                ? "cursor-not-allowed text-white/25"
                : active
                  ? "bg-white/10 text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-[#fdc425]"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
            }`;

            if (!allowed) {
              return (
                <span
                  key={item.href}
                  aria-disabled="true"
                  title="You don't have access to this page"
                  className={className}
                >
                  <Icon name={item.icon} className="text-[18px]" />
                  <span className="min-w-0 flex-1">{item.label}</span>
                  <Icon name="lock" className="text-[14px]" />
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                <Icon
                  name={item.icon}
                  className={`text-[18px] ${active ? "text-[#fdc425]" : ""}`}
                />
                <span className="min-w-0 flex-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
