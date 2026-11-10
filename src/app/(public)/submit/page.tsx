import type { Metadata } from "next";
import { SubmitForm } from "@/components/SubmitForm";
import { publicOrganisation } from "@/lib/admin";
import { CATEGORY_IDS, type CategoryId } from "@/lib/categories";

export const metadata: Metadata = { title: "File a complaint" };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const org = await publicOrganisation();
  const preset = CATEGORY_IDS.includes(params.category as CategoryId) ? (params.category as CategoryId) : "";
  return (
    <div className="wrap">
      <SubmitForm org={org} preset={preset} turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} />
    </div>
  );
}
