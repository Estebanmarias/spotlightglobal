export const MINISTRY_ICON_OPTIONS = [
  "church",
  "group",
  "music_note",
  "child_care",
  "volunteer_activism",
  "groups",
  "menu_book",
  "edit",
  "handshake",
  "public",
  "campaign",
  "favorite",
  "school",
  "home",
  "event",
] as const;

const LEGACY_MINISTRY_ICONS: Record<string, string> = {
  groups_3: "groups",
  brush: "edit",
  local_hospital: "church",
  sports_basketball: "event",
};

export const normalizeMinistryIcon = (icon: string | null | undefined) => {
  const normalized = LEGACY_MINISTRY_ICONS[icon ?? ""] ?? icon;
  return MINISTRY_ICON_OPTIONS.includes(normalized as (typeof MINISTRY_ICON_OPTIONS)[number])
    ? normalized
    : "church";
};
