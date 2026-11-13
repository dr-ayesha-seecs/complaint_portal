import { isOpenStatus, statusLabel } from "@/lib/categories";

export function StatusBadge({ status, overdue = false }: { status: string; overdue?: boolean }) {
  const tone = overdue ? "late" : status === "escalated" || status === "appealed" || status === "withdrawal_requested" ? "warn" : isOpenStatus(status) ? "open" : "done";
  return (
    <span className={`badge ${tone}`}>
      {statusLabel(status)}
      {overdue ? " · overdue" : ""}
    </span>
  );
}
