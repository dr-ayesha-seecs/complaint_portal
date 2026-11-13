import type { Metadata } from "next";
import Link from "next/link";
import { SLA } from "@/lib/sla";

export const metadata: Metadata = { title: "Complaint procedure" };

export default function ProcedurePage() {
  return (
    <div className="wrap">
      <article className="panel">
        <h1>How a complaint is handled</h1>
        <p>
          This procedure is the university&apos;s online system of grievance redressal. It follows the HEC expectation that a student can file a complaint on the university portal, receive a reference number, and see the status. It also follows the HEC Policy on Protection Against Sexual Harassment in Higher Education Institutions (effective 1 July 2020), the Protection against Harassment of Women at the Workplace Act, 2010, the spirit of the UK Office of the Independent Adjudicator Good Practice Framework, and ISO 10002 on complaints handling.
        </p>
        <p>The service is free. You do not need an account. You may complain as one student. A group should nominate one person to file and share the tracking key with the others through a safe channel.</p>

        <h2>1. Filing and acknowledgement</h2>
        <p>
          You choose a category, your faculty and department, your programme and semester, and describe what happened and what you want done. Your name is required for verification and will remain strictly confidential. You may attach up to two files (PDF, PNG, JPEG, WEBP, or DOCX, 1 MB each). The portal issues a tracking number immediately. That is the reference you should quote. If you give an email address, the same acknowledgement is sent there, together with a secret key.
        </p>

        <h2>2. Ordinary complaints</h2>
        <ul>
          <li>Automatic acknowledgement: immediate.</li>
          <li>A person acknowledges the file and starts the review: {SLA.standard.humanAckWorkingDays} working days.</li>
          <li>Written outcome: {SLA.standard.resolutionWorkingDays} working days from filing. A complex case may be extended, with reasons recorded, up to {SLA.standard.extensionWorkingDays} working days, and should still finish inside {SLA.standard.outerCalendarDays} calendar days.</li>
          <li>Working days are Monday to Friday, Pakistan time.</li>
          <li>The chairperson of the department and the dean of the faculty are notified. If you say the head of department is involved, the chairperson is not copied. The dean and the Vice Chancellor are notified instead.</li>
          <li>Appeal: within {SLA.standard.appealWindowWorkingDays} working days of the outcome. The review decision is due within {SLA.standard.appealDecisionWorkingDays} working days.</li>
        </ul>

        <h2>3. Harassment, including sexual harassment</h2>
        <p>Harassment complaints require your full name, registration or roll number, department, programme, email, and mobile number. Your name is required for verification and will remain strictly confidential. That rule is enforced in the browser and again on the server.</p>
        <ul>
          <li>The complaint is confidential. Staff are told not to forward the notice.</li>
          <li>It is sent to the departmental chairperson and the dean, unless you say the head of department is involved.</li>
          <li>It is also sent to the harassment focal person and the inquiry committee when those addresses have been configured.</li>
          <li>Referral target: within {SLA.harassment.referralHours} hours, in line with the HEC policy requirement that a complaint reach the inquiry committee within 24 hours.</li>
          <li>The inquiry should recommend a decision to the Vice Chancellor within {SLA.harassment.inquiryCalendarDays} days. An endorsed recommendation should be implemented within {SLA.harassment.implementationDays} days.</li>
          <li>You, and the person complained about, may appeal within {SLA.harassment.appealWindowCalendarDays} days. Where the 2010 Act applies, an appeal to the Ombudsperson remains available.</li>
          <li>If you ask to withdraw a harassment complaint, the university records that request and may still have a duty to proceed.</li>
          <li>Retaliation or threats against you, or against anyone who helps with the case, are themselves misconduct. Report them.</li>
        </ul>
        <p>A complaint that is knowingly false and made to harm someone is a serious matter under the HEC policy. A complaint made honestly, even if it is not upheld, is not.</p>

        <h2>4. Other sensitive complaints</h2>
        <p>
          Discrimination, ragging, bullying, bribery, safety, and disability or access complaints also require your name, which remains strictly confidential. Disability complaints may be addressed to Disability and Accessibility Coordination under University Administration, or to your department, and can be escalated to the Vice Chancellor. This matches the direction of the HEC Policy for Students with Disabilities.
        </p>
        <p>Ragging is treated as a conduct complaint. If someone is in danger now, contact campus security or the police before using this form.</p>

        <h2>5. Tracking, escalation, and appeal</h2>
        <p>
          Open <Link href="/track">Track</Link> and enter the tracking number and secret key. You will see the status, the due date, and messages written for you. Internal staff notes stay internal. If the due date passes, the file is marked overdue for the Vice Chancellor, the dean, and the chairperson.
        </p>
        <p>Staff can escalate a file to the dean and then to the Vice Chancellor. You can appeal once after an outcome, inside the time limit above. The appeal asks the next level to look at the decision again.</p>

        <h2>6. Impartiality and your rights</h2>
        <ul>
          <li>The people handling the complaint should not have a personal stake in the outcome. Say so on the form if the head of department is involved.</li>
          <li>You may withdraw an ordinary complaint at any time before it is finally closed.</li>
          <li>You may ask for this procedure in another format through the Directorate of Students Affairs or Disability and Accessibility Coordination.</li>
          <li>Nothing in this portal replaces a criminal complaint to the police, or a complaint to the HEC, where you are entitled to make one.</li>
        </ul>
        <p>
          <Link className="btn" href="/submit">
            File a complaint
          </Link>
        </p>
      </article>
    </div>
  );
}
