"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="content" className="wrap">
      <h1>Something went wrong</h1>
      <p>Please try again. If this continues, visit the Directorate of Students Affairs or call the university exchange on 061-9201541.</p>
      <button className="btn" type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
