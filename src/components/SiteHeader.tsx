"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
          <div className="mark" aria-hidden="true">
            MNS
          </div>
          <div>
            <p className="brand-kicker">MNS University of Agriculture, Multan</p>
            <p className="brand-title">Students Complaints Portal</p>
          </div>
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
