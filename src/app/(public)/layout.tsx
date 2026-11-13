import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { VisitBeacon } from "@/components/VisitBeacon";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="content">{children}</main>
      <SiteFooter />
      <VisitBeacon />
    </>
  );
}
