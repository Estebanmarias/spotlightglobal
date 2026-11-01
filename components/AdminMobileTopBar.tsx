"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import AdminNav from "@/components/AdminNav";
import BirthdayNotifications from "@/components/BirthdayNotifications";
import Icon from "@/components/Icon";
import { ADMIN_NAV_GROUPS, ADMIN_PAGE_TITLES } from "@/lib/admin-nav";
import { useAdminNav } from "@/lib/use-admin-nav";
import { getSupabaseClient } from "@/lib/supabase";

function Brand() {
  const [src, setSrc] = useState("/images/logo.png");
  return (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4">
      <Image src={src} onError={() => setSrc("/apple-touch-icon-v2.png")} alt="theSpotlightChurch logo" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
      <div>
        <div className="text-[13px] font-bold text-white">theSpotlightChurch</div>
        <div className="text-[11px] text-white/50">Admin portal</div>
      </div>
    </div>
  );
}

function UserFooter({ fullName, isSuperAdmin, onLogout }: { fullName: string; isSuperAdmin: boolean; onLogout: () => void }) {
  const firstName = fullName.trim().split(/\s+/)[0] || "Admin";
  const initials = fullName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((name) => name[0]).join("").toUpperCase() || "A";
  return (
    <div className="shrink-0 border-t border-white/10 p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fdc425] text-[11px] font-bold text-[#081534]">{initials}</div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[12px] font-semibold text-white">{firstName}</div>
          <div className="text-[10px] text-white/50">{isSuperAdmin ? "Setman" : "Admin"}</div>
        </div>
        <button onClick={onLogout} aria-label="Log out" className="text-white/60 hover:text-white">
          <Icon name="logout" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}

export default function AdminMobileTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseClient();
  const nav = useAdminNav();
  const [open, setOpen] = useState(false);
  const matchingItem = ADMIN_NAV_GROUPS.flat().find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
  const title = ADMIN_PAGE_TITLES[pathname] || matchingItem?.label || "Admin Portal";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin");
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-[#c6c6cf] bg-white py-3 pl-4 pr-4">
        <button onClick={() => setOpen(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#081534] text-white" aria-label="Open menu">
          <Icon name="menu" className="text-[20px]" />
        </button>
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-[#081534]">{title}</span>
        <BirthdayNotifications access={{ loading: !nav.loaded, isSuperAdmin: nav.isSuperAdmin, canAccess: nav.canAccess }} activeOn="mobile" />
      </div>

      {open && <div className="fixed inset-0 z-42 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      <div className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-[#081534] transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <button onClick={() => setOpen(false)} className="absolute right-4 top-4 text-white/50 hover:text-white" aria-label="Close menu">
          <Icon name="close" />
        </button>
        <Brand />
        <AdminNav pathname={pathname} {...nav} onNavigate={() => setOpen(false)} />
        <UserFooter fullName={nav.fullName} isSuperAdmin={nav.isSuperAdmin} onLogout={handleLogout} />
      </div>
    </div>
  );
}
