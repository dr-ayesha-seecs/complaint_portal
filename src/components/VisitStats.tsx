export function VisitStats({ total, today }: { total: number; today: number }) {
  return (
    <section className="visit-stats" aria-label="Portal visits">
      <h2>Portal visits</h2>
      <p>
        <strong>{total}</strong> in total, <strong>{today}</strong> today (Pakistan time).
      </p>
      <p className="hint">Each browser session on the public portal is counted once. No names or IP addresses are stored.</p>
    </section>
  );
}
