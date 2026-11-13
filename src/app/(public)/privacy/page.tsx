import type { Metadata } from "next";
import Link from "next/link";
import { COMMITTEE_NAME, REGISTRAR_ADDRESS, REGISTRAR_EMAIL, REGISTRAR_PHONE } from "@/lib/policy";

export const metadata: Metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return (
    <div className="wrap">
      <article className="panel">
        <h1>Privacy notice</h1>
        <p>
          This notice explains what the Students Complaints Portal of Muhammad Nawaz Shareef University of Agriculture, Multan does with personal information. The portal is operated for the university so that students can raise complaints and the university can respond. It is not a public noticeboard.
        </p>

        <h2>Who is responsible</h2>
        <p>
          Muhammad Nawaz Shareef University of Agriculture, Multan, {REGISTRAR_ADDRESS}. Questions about this notice can go to the Registrar Office through the university exchange, {REGISTRAR_PHONE}, or {REGISTRAR_EMAIL}. The portal owner inside the university is the Chairperson, Department of Artificial Intelligence and Data Science, Prof. Dr. Ayesha Hakim, who is also the Convener of the {COMMITTEE_NAME}.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>The complaint itself: category, faculty, department, programme, semester, description, the outcome you want, and any files you attach.</li>
          <li>Your name, programme, semester, email, and mobile number, which are required for verification on every complaint and remain strictly confidential, together with any registration details you give.</li>
          <li>For harassment: your full name, registration or roll number, department, programme, email, and mobile number. These are required. The form will not accept a harassment complaint without them.</li>
          <li>A secret tracking key, stored only as a one-way hash. Staff cannot read the original key. A member of staff can issue a new key after confirming your identity.</li>
          <li>A hash of the network address used to submit or track a complaint, for abuse prevention. The raw address is not stored on the complaint.</li>
          <li>Staff accounts: name, official email, role, and a hashed password. Sign-in is recorded in an audit log.</li>
        </ul>

        <h2>Why we use it</h2>
        <p>
          To acknowledge, investigate, respond to, escalate, and review complaints, and to let the university carry out the Anti-Bullying and Harassment Policy through the {COMMITTEE_NAME}. Staff audit logs exist so the university can see who opened or changed a confidential file.
        </p>

        <h2>Who sees it</h2>
        <ul>
          <li>The Vice Chancellor can see every complaint.</li>
          <li>A dean sees complaints for their faculty. A chairperson sees complaints for their department.</li>
          <li>Complaints staff see the faculty or department they are assigned to. Unassigned central staff do not see bullying, discrimination or harassment files.</li>
          <li>The {COMMITTEE_NAME} sees bullying, discrimination and harassment files.</li>
          <li>Email notices go to the chairperson and the dean. Notices of bullying, discrimination or harassment also go to the committee when those addresses are configured. If you say the head of department is involved, the chairperson is not emailed.</li>
          <li>Placeholder addresses (for example those ending in .invalid) are not delivered once live email is switched on.</li>
          <li>We do not sell personal information and we do not use advertising or third-party font and analytics services.</li>
        </ul>

        <h2>How long we keep it</h2>
        <p>
          Investigatory files for bullying, discrimination and harassment, including the initial complaint, the final report and documents used in the investigation, are kept for seven years after the investigation concludes. Ordinary complaint files and the audit logs that relate to them are kept as university records for as long as they are needed to administer the case and any later review, and are then reviewed for deletion. The software does not delete files automatically.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Anonymous complaints are not accepted. Your name, programme, semester, email, and mobile number are required for verification and will remain strictly confidential. You will need the tracking key to see the status. If you lose the key, a member of staff can issue a new one after confirming your identity.</li>
          <li>You may withdraw an ordinary complaint. A bullying, discrimination or harassment complaint may still be examined after a withdrawal request.</li>
          <li>You may ask the Registrar to correct a factual mistake in your contact details.</li>
          <li>Read the <Link href="/procedure">procedure</Link> for response times, the official committee, and the rule against retaliation.</li>
        </ul>

        <h2>Security</h2>
        <p>
          Passwords are hashed. Tracking keys are hashed with a server-side pepper. Sessions are stored in an httpOnly cookie. Staff actions are validated on the server, limited by role, and written to an audit log. Attachments are checked for type and size and are downloaded only by staff who are allowed to see that complaint. No system is perfect. Do not put passwords or unrelated identity documents in an attachment.
        </p>
      </article>
    </div>
  );
}
