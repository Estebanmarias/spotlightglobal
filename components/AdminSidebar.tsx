"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import AdminNav from "@/components/AdminNav";
import Icon from "@/components/Icon";
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
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase() || "A";

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

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseClient();
  const nav = useAdminNav();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin");
  };

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-dvh w-64 flex-col bg-[#081534] lg:flex">
      <Brand />
      <AdminNav pathname={pathname} {...nav} />
      <UserFooter fullName={nav.fullName} isSuperAdmin={nav.isSuperAdmin} onLogout={handleLogout} />
    </aside>
  );
}
