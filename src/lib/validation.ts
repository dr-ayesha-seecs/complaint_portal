import { z } from "zod";
import { CATEGORY_IDS, SEMESTERS } from "./categories";
import { todayKarachi } from "./sla";

export function isPakistanMobile(input: string): boolean {
  return /^(\+92|0)3\d{9}$/.test(normalizePhone(input));
}

export function normalizePhone(input: string): string {
  return input.replace(/[\s-]/g, "");
}

export function isEmailAddress(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

export function isRegistrationNumber(input: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9/-]{3,29}$/.test(input);
}

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

export const complaintSchema = z
  .object({
    category: z.enum(CATEGORY_IDS),
    harassmentType: z.enum(["sexual", "other"]).optional().or(z.literal("")).default(""),
    anonymous: z.boolean(),
    concernsDepartmentHead: z.boolean().default(false),
    facultyId: z.string().trim().min(1, "Choose a faculty.").max(80),
    departmentId: z.string().trim().min(1, "Choose a department.").max(80),
    programme: z.string().trim().min(2, "Enter your programme.").max(160),
    semester: z.enum(SEMESTERS),
    subject: z.string().trim().min(8, "The subject needs at least 8 characters.").max(180),
    description: z.string().trim().min(30, "Describe what happened in at least a few sentences.").max(8000),
    desiredOutcome: optionalText(2000),
    incidentDate: optionalText(10),
    location: optionalText(200),
    respondentName: optionalText(160),
    studentName: optionalText(160),
    registrationNumber: optionalText(40),
    studentEmail: optionalText(160),
    studentPhone: optionalText(30),
    confirmTruth: z.boolean().refine((value) => value, "Please confirm the information is true to the best of your knowledge."),
    confirmPrivacy: z.boolean().refine((value) => value, "Please confirm you have read the privacy notice."),
    confirmNonRetaliation: z.boolean().refine((value) => value, "Please acknowledge the non-retaliation statement."),
    companyWebsite: z.string().max(200).optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.companyWebsite.trim() !== "") {
      ctx.addIssue({ code: "custom", path: ["companyWebsite"], message: "The complaint could not be submitted." });
    }
    if (value.incidentDate && !/^\d{4}-\d{2}-\d{2}$/.test(value.incidentDate)) {
      ctx.addIssue({ code: "custom", path: ["incidentDate"], message: "Enter the date as YYYY-MM-DD." });
    } else if (value.incidentDate && value.incidentDate > todayKarachi()) {
      ctx.addIssue({ code: "custom", path: ["incidentDate"], message: "The incident date cannot be in the future." });
    }
    if (value.category === "harassment") {
      if (value.anonymous) {
        ctx.addIssue({
          code: "custom",
          path: ["anonymous"],
          message: "Harassment complaints cannot be anonymous. Please give your full details.",
        });
      }
      if (value.harassmentType !== "sexual" && value.harassmentType !== "other") {
        ctx.addIssue({
          code: "custom",
          path: ["harassmentType"],
          message: "Say whether this is sexual harassment or another form of harassment.",
        });
      }
      if (value.studentName.trim().length < 3) {
        ctx.addIssue({ code: "custom", path: ["studentName"], message: "Enter your full name." });
      }
      if (!isRegistrationNumber(value.registrationNumber.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["registrationNumber"],
          message: "Enter a valid registration or roll number.",
        });
      }
      if (!isEmailAddress(value.studentEmail.trim().toLowerCase())) {
        ctx.addIssue({ code: "custom", path: ["studentEmail"], message: "Enter a valid email address." });
      }
      if (!isPakistanMobile(value.studentPhone)) {
        ctx.addIssue({
          code: "custom",
          path: ["studentPhone"],
          message: "Enter a Pakistani mobile number, for example 03001234567.",
        });
      }
      return;
    }
    if (!value.anonymous) {
      if (value.studentName.trim().length < 3) {
        ctx.addIssue({ code: "custom", path: ["studentName"], message: "Enter your name, or submit anonymously." });
      }
      const email = value.studentEmail.trim();
      const phone = value.studentPhone.trim();
      const registration = value.registrationNumber.trim();
      if (!email && !phone && !registration) {
        ctx.addIssue({
          code: "custom",
          path: ["studentEmail"],
          message: "Add an email, a mobile number, or a registration number so the university can reach you.",
        });
      }
      if (email && !isEmailAddress(email.toLowerCase())) {
        ctx.addIssue({ code: "custom", path: ["studentEmail"], message: "Enter a valid email address." });
      }
      if (phone && !isPakistanMobile(phone)) {
        ctx.addIssue({
          code: "custom",
          path: ["studentPhone"],
          message: "Enter a Pakistani mobile number, or leave the phone field empty.",
        });
      }
      if (registration && !isRegistrationNumber(registration)) {
        ctx.addIssue({
          code: "custom",
          path: ["registrationNumber"],
          message: "Registration numbers use letters, numbers, and dashes only.",
        });
      }
    }
  });

export type ComplaintInput = z.infer<typeof complaintSchema>;

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string[]> {
  const flat = error.flatten().fieldErrors;
  const out: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages && messages.length > 0) out[key] = messages;
  }
  return out;
}
