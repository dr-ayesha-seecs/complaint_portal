import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return (
    <div className="wrap">
      <article className="panel">
        <h1>
          Privacy notice
          <span className="ur">رازداری کا نوٹس</span>
        </h1>
        <p>
          This notice explains what the Students Complaints Portal of MNS University of Agriculture, Multan does with personal information. The portal is operated for the university so that students can raise complaints and the university can respond. It is not a public noticeboard.
        </p>

        <h2>Who is responsible</h2>
        <p>
          MNS University of Agriculture, Multan, University Road, Multan. Questions about this notice can go to the Registrar or the Directorate of Students Affairs through the university exchange, 061-9201541, or info@mnsuam.edu.pk. The portal owner inside the university is the Chairperson, Department of Artificial Intelligence and Data Science, Prof. Dr. Ayesha Hakim.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>The complaint itself: category, faculty, department, programme, semester, description, the outcome you want, and any files you attach.</li>
          <li>If you choose not to be anonymous: your name and whatever contact or registration details you give.</li>
          <li>For harassment: your full name, registration or roll number, department, programme, email, and mobile number. These are required. The form will not accept a harassment complaint without them.</li>
          <li>A secret tracking key, stored only as a one-way hash. Staff cannot read the original key. Anonymous keys cannot be reissued.</li>
          <li>A hash of the network address used to submit or track a complaint, for abuse prevention. The raw address is not stored on the complaint.</li>
          <li>Staff accounts: name, official email, role, and a hashed password. Sign-in is recorded in an audit log.</li>
        </ul>

        <h2>Why we use it</h2>
        <p>
          To acknowledge, investigate, respond to, escalate, and appeal complaints; to meet the university&apos;s grievance-redressal duties; and, for harassment, to meet the HEC Policy on Protection Against Sexual Harassment (2020) and the Protection against Harassment of Women at the Workplace Act, 2010. Staff audit logs exist so the university can see who opened or changed a confidential file.
        </p>

        <h2>Who sees it</h2>
        <ul>
          <li>The Vice Chancellor can see every complaint.</li>
          <li>A dean sees complaints for their faculty. A chairperson sees complaints for their department.</li>
          <li>Complaints staff see the faculty or department they are assigned to. Unassigned central staff do not see harassment files.</li>
          <li>The harassment focal person sees harassment files only.</li>
          <li>Email notices go to the chairperson and the dean. Harassment notices also go to the focal person and committee when those addresses are configured. If you say the head of department is involved, the chairperson is not emailed.</li>
          <li>Placeholder addresses (for example those ending in .invalid) are not delivered once live email is switched on.</li>
          <li>We do not sell personal information and we do not use advertising or third-party font and analytics services.</li>
        </ul>

        <h2>How long we keep it</h2>
        <p>
          Ordinary complaint files are kept for 3 years after closure, then reviewed for deletion. Harassment case files are kept for 7 years, reflecting the HEC policy&apos;s treatment of disciplinary records. Audit logs are kept for the same period as the file they relate to. These periods should be confirmed by the Registrar before go-live and can be changed by university rule.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>You may file most complaints without your name. You will need the tracking key to see the status. If you lose an anonymous key, it cannot be restored.</li>
          <li>You may withdraw an ordinary complaint. A harassment complaint may still be examined after a withdrawal request.</li>
          <li>You may ask the Registrar to correct a factual mistake in your contact details.</li>
          <li>Read the <Link href="/procedure">procedure</Link> for response times, appeals, and the rule against retaliation.</li>
        </ul>

        <h2>Security</h2>
        <p>
          Passwords are hashed. Tracking keys are hashed with a server-side pepper. Sessions are stored in an httpOnly cookie. Staff actions are validated on the server, limited by role, and written to an audit log. Attachments are checked for type and size and are downloaded only by staff who are allowed to see that complaint. No system is perfect. Do not put passwords or unrelated identity documents in an attachment.
        </p>
        <p className="hint">This notice is an operational privacy statement for the portal. The university&apos;s legal adviser or the Registrar should review it before the portal is announced on mnsuam.edu.pk.</p>
      </article>
    </div>
  );
}
