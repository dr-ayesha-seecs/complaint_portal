"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PUBLIC_VISIT_PATHS } from "@/lib/visit-paths";

const SESSION_KEY = "mnsuam-portal-visit";
const COUNTED = new Set<string>(PUBLIC_VISIT_PATHS);

function canonicalPath(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

export function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    const path = canonicalPath(pathname);
    if (!COUNTED.has(path)) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // If storage is blocked, still send one beacon for this mount.
    }
    const body = JSON.stringify({ path });
    const blob = new Blob([body], { type: "application/json" });
    const sent = typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/visit", blob);
    if (!sent) {
      void fetch("/api/visit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      });
    }
  }, [pathname]);

  return null;
}
