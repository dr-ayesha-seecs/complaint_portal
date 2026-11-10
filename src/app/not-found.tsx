import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="content" className="wrap">
        <h1>Page not found</h1>
        <p>That page is not on the complaints portal.</p>
        <p>
          <Link className="btn" href="/">
            Back to the portal
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
