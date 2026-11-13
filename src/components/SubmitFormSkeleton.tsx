export function SubmitFormSkeleton() {
  return (
    <div className="panel" aria-busy="true" aria-live="polite">
      <p className="visually-hidden">Loading the complaint form.</p>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-choice" />
        <div className="skeleton skeleton-choice" />
        <div className="skeleton skeleton-choice" />
        <div className="skeleton skeleton-choice" />
      </div>
      <div className="skeleton skeleton-legend" />
      <div className="skeleton skeleton-field" />
      <div className="skeleton skeleton-field" />
      <div className="skeleton skeleton-field" />
    </div>
  );
}
