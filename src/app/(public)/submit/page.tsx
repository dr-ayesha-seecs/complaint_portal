import { Suspense } from "react";
import type { Metadata } from "next";
import { SubmitForm } from "@/components/SubmitForm";
import { SubmitFormSkeleton } from "@/components/SubmitFormSkeleton";
import { getCachedPublicOrganisation } from "@/lib/public-org";

export const metadata: Metadata = { title: "File a complaint" };
// Prerender the form. Refresh at most once a minute, or immediately when Contacts change.
export const dynamic = "force-static";
export const revalidate = 60;

export default async function SubmitPage() {
  const org = await getCachedPublicOrganisation();
  return (
    <div className="wrap">
      <Suspense fallback={<SubmitFormSkeleton />}>
        <SubmitForm org={org} turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} />
      </Suspense>
    </div>
  );
}
