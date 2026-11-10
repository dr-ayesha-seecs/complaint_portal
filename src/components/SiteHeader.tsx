"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", en: "Home", ur: "ہوم" },
  { href: "/submit", en: "File a complaint", ur: "شکایت درج کریں" },
  { href: "/track", en: "Track", ur: "ٹریکنگ" },
  { href: "/procedure", en: "Procedure", ur: "طریقہ کار" },
  { href: "/privacy", en: "Privacy", ur: "رازداری" },
  { href: "/login", en: "Staff login", ur: "عملہ لاگ اِن" },
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
            <p className="brand-ur">طلبہ شکایات پورٹل · ایم این ایس یونیورسٹی آف ایگریکلچر، ملتان</p>
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
              <span>{link.en}</span>
              <small>{link.ur}</small>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
