import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { UNIVERSITY_NAME, UNIVERSITY_SHORT } from "@/lib/university";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `Students Complaints Portal | ${UNIVERSITY_NAME}`,
    template: `%s | ${UNIVERSITY_SHORT} Complaints`,
  },
  description: `File and track a student complaint at ${UNIVERSITY_NAME}. Confidential handling, a tracking number, and published response times.`,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#003060",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
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
