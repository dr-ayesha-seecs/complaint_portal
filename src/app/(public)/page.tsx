import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SLA } from "@/lib/sla";

export default function HomePage() {
  const groups = [...new Set(CATEGORIES.map((item) => item.group))];
  return (
    <div className="wrap">
      <section className="hero">
        <div className="panel">
          <p className="brand-kicker" style={{ color: "var(--gold)" }}>
            Muhammad Nawaz Shareef University of Agriculture, Multan
          </p>
          <h1>A recorded way to raise a student complaint</h1>
          <hr className="gold-rule" />
          <p className="lede">
            Use this portal for teaching, assessment, fees, hostels, facilities, discrimination, ragging, harassment, access, or anything else that is getting in the way of your studies.
            You receive a tracking number immediately. You can follow the case without creating an account.
          </p>
          <div className="actions">
            <Link className="btn" href="/submit">
              File a complaint
            </Link>
            <Link className="btn secondary" href="/track">
              Track a complaint
            </Link>
            <Link className="btn secondary" href="/procedure">
              Read the procedure
            </Link>
          </div>
        </div>
        <aside className="panel">
          <h2>What you can expect</h2>
          <ul>
            <li>An acknowledgement and a unique tracking number as soon as you submit.</li>
            <li>A response target of {SLA.standard.resolutionWorkingDays} working days for most complaints.</li>
            <li>Harassment files referred onward within {SLA.harassment.referralHours} hours, with an inquiry target of {SLA.harassment.inquiryCalendarDays} days.</li>
            <li>A right to appeal, and a clear rule against retaliation.</li>
          </ul>
          <p className="hint">Your name, programme, semester, email, and mobile number are required on every complaint for verification and will remain strictly confidential. Only the officers who need to act on the file can see them.</p>
        </aside>
      </section>

      <section className="section">
        <h2>What you can complain about</h2>
        {groups.map((group) => (
          <div key={group}>
            <h3>{group}</h3>
            <div className="choice-grid">
              {CATEGORIES.filter((item) => item.group === group).map((item) => (
                <Link key={item.id} className="card" href={`/submit?category=${item.id}`}>
                  <strong>{item.en}</strong>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="section grid-3">
        <article className="card">
          <h3>Confidential</h3>
          <p>The file is shared with the people who have to act on it: the chairperson, the dean, and, for harassment, the focal person and committee. It is not published.</p>
        </article>
        <article className="card">
          <h3>No retaliation</h3>
          <p>A complaint made in good faith must not affect your grades, class, hostel, scholarship, or any other university service. Report retaliation as a new complaint.</p>
        </article>
        <article className="card">
          <h3>You stay in control</h3>
          <p>Track the status with your tracking number and secret key. You can appeal an outcome, or withdraw a complaint. Keep the key. A member of staff can issue a new one after confirming your identity.</p>
        </article>
      </section>
    </div>
  );
}
