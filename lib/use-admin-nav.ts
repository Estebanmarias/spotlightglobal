"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { PageKey } from "@/lib/use-admin-permissions";

export function useAdminNav() {
  const supabase = getSupabaseClient();
  const [loaded, setLoaded] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissions, setPermissions] = useState<PageKey[]>([]);
  const [isMinistryLeader, setIsMinistryLeader] = useState(false);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = (await supabase
        .from("admin_roles")
        .select("role, permissions, is_ministry_leader, full_name")
        .eq("user_id", session.user.id)
        .single()) as {
        data: {
          role: string;
          permissions: PageKey[];
          is_ministry_leader: boolean;
          full_name: string;
        } | null;
      };

      if (data) {
        setIsSuperAdmin(data.role === "super_admin");
        setIsMinistryLeader(data.is_ministry_leader ?? false);
        setPermissions(data.permissions || []);
        setFullName(data.full_name || "");
      }
      setLoaded(true);
    };
    load();
  }, [supabase]);

  const canAccess = (page?: PageKey) => {
    if (!page) return true;
    if (isSuperAdmin) return true;
    if (page === "ministries" && isMinistryLeader) return true;
    return permissions.includes(page);
  };

  return { loaded, isSuperAdmin, permissions, isMinistryLeader, fullName, canAccess };
}
