export function formatRuntime(mins?: number | null) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatYear(date?: string | Date | null) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return String(d.getFullYear());
}

export function formatShowTime(date: string | Date) {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatShowDate(date: string | Date) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "U";
  return source.charAt(0).toUpperCase();
}

export function rupees(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
