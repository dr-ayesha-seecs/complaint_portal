import { HttpError } from "./http";

const MAX_BYTES = 1024 * 1024;
export const MAX_ATTACHMENTS = 2;
export const MAX_ATTACHMENT_BYTES = MAX_BYTES;

type Kind = { ext: string[]; mime: string; match: (bytes: Uint8Array) => boolean };

const KINDS: Kind[] = [
  { ext: ["pdf"], mime: "application/pdf", match: (b) => starts(b, [0x25, 0x50, 0x44, 0x46]) },
  { ext: ["png"], mime: "image/png", match: (b) => starts(b, [0x89, 0x50, 0x4e, 0x47]) },
  { ext: ["jpg", "jpeg"], mime: "image/jpeg", match: (b) => starts(b, [0xff, 0xd8, 0xff]) },
  {
    ext: ["webp"],
    mime: "image/webp",
    match: (b) => starts(b, [0x52, 0x49, 0x46, 0x46]) && b.length > 12 && starts(b.subarray(8), [0x57, 0x45, 0x42, 0x50]),
  },
  {
    ext: ["docx"],
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    match: (b) => starts(b, [0x50, 0x4b, 0x03, 0x04]),
  },
];

function starts(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) return false;
  return magic.every((value, index) => bytes[index] === value);
}

export function extensionOf(filename: string): string {
  const part = filename.split(".").pop()?.toLowerCase() ?? "";
  return part.replace(/[^a-z0-9]/g, "");
}

export function inspectFile(filename: string, bytes: Uint8Array): { filename: string; mime: string } {
  if (bytes.byteLength === 0) throw new HttpError(400, "One of the files is empty.");
  if (bytes.byteLength > MAX_BYTES) throw new HttpError(400, "Each file must be 1 MB or smaller.");
  const ext = extensionOf(filename);
  const kind = KINDS.find((item) => item.ext.includes(ext));
  if (!kind || !kind.match(bytes)) {
    throw new HttpError(400, "Attachments must be PDF, PNG, JPEG, WEBP, or DOCX files.");
  }
  const safe = filename.replace(/[^\w.\- ()]/g, "_").slice(0, 120) || `attachment.${ext}`;
  return { filename: safe, mime: kind.mime };
}

export function asBytes(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) return new Uint8Array(data);
  throw new HttpError(500, "The attachment could not be read.");
}
