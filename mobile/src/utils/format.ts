/** Formats a number as Indian-rupee currency, e.g. 150000 -> "₹1,50,000". */
export function formatRupees(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

/** Formats an ISO timestamp for display; falls back to the raw value when unparseable. */
export function formatTimestamp(isoDate: string): string {
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
