import type { Metadata } from "next";
import Link from "next/link";
import { COMMITTEE_MEMBERS, COMMITTEE_NAME } from "@/lib/policy";
import { SLA } from "@/lib/sla";

export const metadata: Metadata = { title: "Complaint procedure" };

export default function ProcedurePage() {
  return (
    <div className="wrap">
      <article className="panel">
        <h1>How a complaint is handled</h1>
        <p>
          This is the Students Complaints Portal of Muhammad Nawaz Shareef University of Agriculture, Multan. It is the university&apos;s recorded way for a student to file a complaint, receive a tracking number, and follow the status of the file.
        </p>
        <p>
          Complaints of bullying, discrimination or harassment are handled through the {COMMITTEE_NAME}. The committee ensures strict implementation of the university&apos;s Anti-Bullying and Harassment Policy on campus, arranges guidance sessions, explains the reporting process, and submits a report to the proper forum for further inquiry and action.
        </p>
        <p>The service is free. You do not need an account. You may complain as one student. A group should nominate one person to file and share the tracking key with the others through a safe channel.</p>

        <h2>1. Filing and acknowledgement</h2>
        <p>
          You choose a category, your faculty and department, and describe what happened and what you want done. Your name, programme, semester, email, and mobile number are required for verification and will remain strictly confidential. Anonymous complaints are not accepted. You may attach up to two files (PDF, PNG, JPEG, WEBP, or DOCX, 1 MB each). The portal issues a tracking number immediately. That is the reference you should quote. An acknowledgement, including the secret key, is sent to the email address you give.
        </p>

        <h2>2. Ordinary complaints</h2>
        <p>Ordinary academic, administrative, fee, hostel, transport and facilities complaints are notified to the chairperson of the department and the dean of the faculty. If you say the head of department is involved, the chairperson is not copied. The dean and the Vice Chancellor are notified instead.</p>
        <ul>
          <li>Automatic acknowledgement: immediate.</li>
          <li>A person acknowledges the file and starts the review: {SLA.standard.humanAckWorkingDays} working days.</li>
          <li>Written outcome: {SLA.standard.resolutionWorkingDays} working days from filing. A complex case may be extended, with reasons recorded, up to {SLA.standard.extensionWorkingDays} working days.</li>
          <li>Working days are Monday to Friday, Pakistan time.</li>
          <li>You may ask for the outcome to be reviewed within {SLA.standard.appealWindowWorkingDays} working days. That review is due within {SLA.standard.appealDecisionWorkingDays} working days.</li>
        </ul>

        <h2>3. Bullying, discrimination and harassment</h2>
        <p>
          These complaints are confidential. Your name, programme, semester, email and mobile number are required for verification and remain strictly confidential. A harassment complaint also requires your registration or roll number, department and programme. Those rules are enforced in the browser and again on the server.
        </p>
        <p>
          The file is sent to the departmental chairperson and the dean, unless you say the head of department is involved, and to the {COMMITTEE_NAME} when those addresses have been configured. Directors, deans and heads of department are required to enforce the Anti-Bullying and Harassment Policy, not to take part in bullying, discrimination or harassment, and to report promptly any such conduct they observe, learn about, or reasonably suspect. A staff member who knowingly allows such conduct to continue is subject to discipline. The university may look into conduct that violates the policy even if no formal complaint is later pursued.
        </p>
        <h3>The official committee</h3>
        <p>The committee is:</p>
        <ul>
          {COMMITTEE_MEMBERS.map((member) => (
            <li key={member.name}>
              <strong>{member.role}:</strong> {member.name}
            </li>
          ))}
        </ul>
        <p>The committee&apos;s terms of reference are:</p>
        <ul>
          <li>To ensure strict implementation of the Anti-Bullying and Harassment Policy on campus.</li>
          <li>To arrange guidance sessions for students and employees on how to protect themselves from bullying, discrimination and harassment.</li>
          <li>To orient students and employees about the reporting process for incidents of bullying and harassment.</li>
          <li>To submit a report to the proper forum for further inquiry and action.</li>
        </ul>
        <h3>Investigation and outcome</h3>
        <ul>
          <li>There is no fixed deadline for reporting bullying, discrimination, harassment, retaliation or sexual assault. You are encouraged to report promptly so that the matter can be examined while memories and other evidence are still fresh.</li>
          <li>The portal acknowledges the file immediately and notifies the committee. A person should acknowledge the file within {SLA.standard.humanAckWorkingDays} working days.</li>
          <li>The university will conduct a prompt, thorough and impartial investigation as necessary and appropriate, and will keep the investigation confidential to the extent possible. The aim is to complete the investigation within {SLA.harassment.inquiryCalendarDays} days of the report. If more time is needed, you will be told, and given a new timetable where that is appropriate.</li>
          <li>Where the complaint alleges a potential violation of the policy, the investigation includes an interview with both parties, with the person who made the initial report if that is someone else, and with any other person who may have information. Both parties have an opportunity to be heard and to present information. Relevant documents may be reviewed. Everyone involved is expected to cooperate. The investigation is strictly internal to the university.</li>
          <li>Every such complaint creates an investigatory file, which holds the initial complaint, the final investigative report including any remedial action, and documents created or used during the investigation.</li>
          <li>Findings are reported to both parties and to the relevant director or dean. Where a violation is found, the relevant department or office must take prompt and appropriate remedial action, which may include disciplinary action. Depending on the circumstances, that may include a reprimand or verbal counselling, training, censure, removal of privileges, a letter of warning or suspension, or dismissal. Discipline need not be progressive: a first violation may warrant suspension or dismissal, depending on the nature and severity of the conduct.</li>
          <li>The head of department or equivalent officer must confirm to the concerned dean or director, within {SLA.harassment.implementationDays} days, that the appropriate remedial or disciplinary action has been taken, and must monitor the situation so that the steps are completed and the conduct does not continue.</li>
          <li>The committee submits its report to the proper forum for further inquiry and action. If you are dissatisfied with how the file was handled, you may ask the Registrar or the Vice Chancellor to look at it again.</li>
          <li>If you ask to withdraw a bullying, discrimination or harassment complaint, the university records that request and may still have a duty to proceed.</li>
        </ul>
        <h3>Confidentiality and non-retaliation</h3>
        <p>
          The university will maintain the confidentiality of the complaint, and the privacy of the people involved, to the greatest extent possible, consistent with a thorough investigation and with the law. Staff who receive a notice are told not to forward it.
        </p>
        <p>
          The university will not retaliate against anyone who reports a perceived violation, takes part in an investigation, or otherwise opposes perceived discrimination, harassment or retaliation, including as a witness, or against anyone associated with that person, such as a family member. Retaliation is itself a serious violation of the policy and is reported and examined in the same way. Anyone found to have retaliated is subject to the same disciplinary action as for other violations of the policy. Report retaliation as a new complaint on this portal.
        </p>

        <h2>4. Other sensitive complaints</h2>
        <p>
          Bribery, safety, and disability or access complaints also require your name, programme, semester, email and mobile number, which remain strictly confidential. Disability or access complaints may be addressed to Disability and Accessibility Coordination under University Administration, or to your department, and can be escalated to the Vice Chancellor.
        </p>
        <p>If someone is in danger now, contact campus security or the police before using this form. This portal is not an emergency service.</p>

        <h2>5. Tracking, escalation, and review</h2>
        <p>
          Open <Link href="/track">Track</Link> and enter the tracking number and secret key. You will see the status, the due date, and messages written for you. Internal staff notes stay internal. If the due date passes, the file is marked overdue for the Vice Chancellor, the dean, and the chairperson.
        </p>
        <p>
          Staff can escalate a file to the dean and then to the Vice Chancellor. For ordinary complaints you can ask for the outcome to be reviewed once, inside the time limit above. For bullying, discrimination or harassment, the committee reports to the proper forum, and you may ask the Registrar or the Vice Chancellor to review how the file was handled.
        </p>

        <h2>6. Impartiality and your rights</h2>
        <ul>
          <li>The people handling the complaint should not have a personal stake in the outcome. Say so on the form if the head of department is involved.</li>
          <li>You may withdraw an ordinary complaint at any time before it is finally closed.</li>
          <li>You may ask for this procedure in another format through the Directorate of Students Affairs or Disability and Accessibility Coordination.</li>
          <li>Nothing in this portal replaces a report to campus security or a complaint to the police where you are entitled to make one.</li>
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
