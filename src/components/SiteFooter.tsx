import Link from "next/link";
import { UNIVERSITY_NAME } from "@/lib/university";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="topbar-inner footer-grid">
        <div>
          <strong>{UNIVERSITY_NAME}</strong>
          <p>University Road, Multan, Pakistan</p>
          <p>University exchange: 061-9201541 · info@mnsuam.edu.pk</p>
          <p>
            <a href="https://mnsuam.edu.pk">mnsuam.edu.pk</a>
          </p>
        </div>
        <div>
          <strong>This portal</strong>
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
          <strong>Also available</strong>
          <p>
            Students may also use the{" "}
            <a href="https://www.hec.gov.pk/english/services/students/pages/grp.aspx">HEC grievance portal</a>.
          </p>
          <p>If you are in immediate danger, contact campus security or the police. This portal is not an emergency service.</p>
        </div>
      </div>
    </footer>
  );
}
