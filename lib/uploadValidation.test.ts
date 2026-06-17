import { describe, expect, it } from "vitest";
import { UPLOAD } from "./security/constants";
import { validateChatUpload } from "./uploadValidation";

function makeFile(
  name: string,
  size: number,
  type = "application/octet-stream",
  content = "x"
): File {
  const body = content.repeat(Math.max(1, Math.ceil(size / content.length))).slice(0, size);
  return new File([body], name, { type });
}

describe("validateChatUpload edge cases", () => {
  it("accepts a valid JPEG", () => {
    expect(validateChatUpload(makeFile("photo.jpg", 1024, "image/jpeg"))).toBeNull();
  });

  it("accepts a valid PDF", () => {
    expect(validateChatUpload(makeFile("doc.pdf", 2048, "application/pdf"))).toBeNull();
  });

  it("accepts TXT when browser reports octet-stream", () => {
    expect(validateChatUpload(makeFile("notes.txt", 50, "application/octet-stream"))).toBeNull();
  });

  it("rejects empty files", () => {
    expect(validateChatUpload(makeFile("empty.txt", 0, "text/plain", ""))).toMatch(/empty/i);
  });

  it("rejects files over 10 MB", () => {
    const huge = makeFile("big.png", UPLOAD.maxBytes + 1, "image/png");
    expect(validateChatUpload(huge)).toMatch(/too large/i);
  });

  it("rejects disallowed formats like Word docs", () => {
    expect(
      validateChatUpload(makeFile("report.docx", 1024, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
    ).toMatch(/not allowed/i);
  });

  it("rejects executables even with a .jpg extension", () => {
    expect(
      validateChatUpload(makeFile("malware.jpg", 1024, "application/x-msdownload"))
    ).toMatch(/not allowed/i);
  });

  it("rejects video files", () => {
    expect(validateChatUpload(makeFile("clip.mp4", 1024, "video/mp4"))).toMatch(/not allowed/i);
  });

  it("rejects SVG (XSS vector)", () => {
    expect(validateChatUpload(makeFile("icon.svg", 512, "image/svg+xml"))).toMatch(/not allowed/i);
  });
});
