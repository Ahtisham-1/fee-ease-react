/** Formats a number as Indian-rupee currency, e.g. 1500 -> "₹1,500". */
export function formatRupees(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

/** Formats an ISO timestamp for display; falls back to the raw value when unparseable. */
export function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
