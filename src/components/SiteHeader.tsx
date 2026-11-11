"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UNIVERSITY_NAME } from "@/lib/university";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/submit", label: "File a complaint" },
  { href: "/track", label: "Track" },
  { href: "/procedure", label: "Procedure" },
  { href: "/privacy", label: "Privacy" },
  { href: "/login", label: "Staff login" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand-row">
          <Link href="/" className="brand-home">
            {/* Official header wordmark: https://www.mnsuam.edu.pk/images/logos/logo-mnsuam.png */}
            <img
              className="brand-logo"
              src="/logo-mnsuam.png"
              width={236}
              height={59}
              alt={UNIVERSITY_NAME}
            />
            <p className="brand-title">Students Complaints Portal</p>
          </Link>
        </div>
        <nav className="nav" aria-label="Primary">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
