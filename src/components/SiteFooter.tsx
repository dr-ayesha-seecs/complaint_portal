import Link from "next/link";
import { UNIVERSITY_NAME, UNIVERSITY_SITE_URL } from "@/lib/university";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="foot-brand">
          <img src="/emblem.png" alt="" width={42} height={42} />
          <div>
            <b>{UNIVERSITY_NAME}</b>
            <span>Students Complaints Portal</span>
          </div>
        </div>
        <div>
          <h2>Contact</h2>
          <p>Old Shujabad Road, Shershah Town, Multan, Pakistan</p>
          <p>
            University exchange: <a href="tel:+92619201541">061-9201541</a>
          </p>
          <p>
            <a href="mailto:info@mnsuam.edu.pk">info@mnsuam.edu.pk</a>
          </p>
          <p>
            <a href={UNIVERSITY_SITE_URL} target="_blank" rel="noopener noreferrer">
              University website
            </a>
          </p>
        </div>
        <div>
          <h2>This portal</h2>
          <p>
            <Link href="/procedure">How a complaint is handled</Link>
          </p>
          <p>
            <Link href="/privacy">Privacy notice</Link>
          </p>
          <p>
            <Link href="/embed">Link from the university website</Link>
          </p>
        </div>
        <div>
          <h2>Also available</h2>
          <p>
            Students may also use the{" "}
            <a href="https://www.hec.gov.pk/english/services/students/pages/grp.aspx">HEC grievance portal</a>.
          </p>
          <p>If you are in immediate danger, contact campus security or the police. This portal is not an emergency service.</p>
        </div>
      </div>
      <div className="footer-legal">
        <div className="container">
          <p>
            © {year} {UNIVERSITY_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
