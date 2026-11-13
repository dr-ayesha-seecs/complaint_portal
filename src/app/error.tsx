"use client";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <SiteHeader />
      <main id="content" className="wrap">
        <h1>Something went wrong</h1>
        <p>Please try again. If this continues, visit the Directorate of Students Affairs or call the university exchange on 061-9201541.</p>
        <button className="btn" type="button" onClick={() => reset()}>
          Try again
        </button>
      </main>
      <SiteFooter />
    </>
  );
}
