import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { toPublicOrg } from "@/data/organisation";
import { publicOrganisation } from "./admin";

export const PUBLIC_ORG_TAG = "public-org";
export const PUBLIC_ORG_REVALIDATE_SECONDS = 60;

/** Bundled faculty and department ids/names used when the directory cannot be read. */
export function bundledPublicOrg() {
  return toPublicOrg().faculties;
}

/**
 * Public form directory, cached so /submit can be prerendered or ISR'd.
 * Falls back to src/data/organisation.ts if Turso is unavailable (for example at build time).
 */
export const getCachedPublicOrganisation = unstable_cache(
  async () => {
    try {
      return await publicOrganisation();
    } catch (error) {
      console.error("[mnsuam] Using bundled organisation data for the public form.", error);
      return bundledPublicOrg();
    }
  },
  ["public-org"],
  { revalidate: PUBLIC_ORG_REVALIDATE_SECONDS, tags: [PUBLIC_ORG_TAG] },
);

export function revalidatePublicOrganisation(): void {
  revalidateTag(PUBLIC_ORG_TAG);
  revalidatePath("/submit");
}
