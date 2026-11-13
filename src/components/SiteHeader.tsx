"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { UNIVERSITY_NAME, UNIVERSITY_SITE_URL } from "@/lib/university";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/submit", label: "File a complaint" },
  { href: "/track", label: "Track" },
  { href: "/procedure", label: "Procedure" },
  { href: "/privacy", label: "Privacy" },
  { href: "/login", label: "Staff login" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  links = PUBLIC_LINKS,
  brandHref = "/",
  children,
}: {
  links?: { href: string; label: string }[];
  brandHref?: string;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <>
      <div className="topbar">
        <div className="container">
          <ul>
            <li className="hide-sm">
              <a href="tel:+92619201541">061-9201541</a>
            </li>
            <li>
              <a href="mailto:info@mnsuam.edu.pk">info@mnsuam.edu.pk</a>
            </li>
          </ul>
          <ul>
            <li>
              <a href={UNIVERSITY_SITE_URL} target="_blank" rel="noopener noreferrer">
                University website
              </a>
            </li>
          </ul>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-row">
          <Link
            href={brandHref}
            className="brand"
            aria-label={`${UNIVERSITY_NAME}, Students Complaints Portal home`}
          >
            <img src="/emblem.png" alt="" width={44} height={44} />
            <span className="brand-name">
              <span>Muhammad Nawaz Shareef</span>
              <span>University of Agriculture, Multan</span>
            </span>
            <span className="brand-app">Students Complaints Portal</span>
          </Link>
          <div className="header-actions">
            <nav className="nav" aria-label="Primary">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {children}
          </div>
        </div>
      </header>
    </>
  );
}
