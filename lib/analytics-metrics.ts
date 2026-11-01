export function percentageChange(current: number, previous: number) {
  if (previous <= 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function attendanceChange(current: number, previous: number | null) {
  return previous === null ? null : current - previous;
}
