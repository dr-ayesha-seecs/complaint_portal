import type { Metadata } from "next";
import { UNIVERSITY_NAME, UNIVERSITY_SHORT } from "@/lib/university";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `Students Complaints Portal | ${UNIVERSITY_NAME}`,
    template: `%s | ${UNIVERSITY_SHORT} Complaints`,
  },
  description: `File and track a student complaint at ${UNIVERSITY_NAME}. Confidential handling, a tracking number, and published response times.`,
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#content">
          Skip to content
        </a>
        {children}
        <noscript>
          <p className="wrap banner warn">JavaScript is required to file a complaint or sign in. You can still read the procedure and privacy notice.</p>
        </noscript>
      </body>
    </html>
  );
}
