/** Formats a number as Indian-rupee currency, e.g. 150000 -> "₹1,50,000". */
export function formatRupees(amount: number): string {
  const finite =
    typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  // Normalize -0 -> 0 so Object.is(-0) never prints "₹-0".
  const normalized = finite === 0 ? 0 : finite;
  if (normalized < 0) {
    return `-₹${Math.abs(normalized).toLocaleString("en-IN")}`;
  }
  return `₹${normalized.toLocaleString("en-IN")}`;
}

/** Formats an ISO timestamp for display; falls back to the raw value when unparseable. */
export function formatTimestamp(isoDate: string): string {
  if (typeof isoDate !== "string" || !isoDate.trim()) {
    return typeof isoDate === "string" ? isoDate : "";
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
