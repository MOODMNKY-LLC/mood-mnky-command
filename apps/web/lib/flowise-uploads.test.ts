import assert from "node:assert";
import { describe, it } from "node:test";
import type { FileUIPart } from "ai";
import { filePartsToFlowiseUploads } from "./flowise-uploads";

describe("filePartsToFlowiseUploads", () => {
  it("converts file parts to Flowise uploads shape with data URL", () => {
    const files: FileUIPart[] = [
      {
        type: "file",
        url: "data:image/png;base64,abc123",
        filename: "photo.png",
        mediaType: "image/png",
      },
    ];
    const result = filePartsToFlowiseUploads(files);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, "file");
    assert.strictEqual(result[0].name, "photo.png");
    assert.strictEqual(result[0].mime, "image/png");
    assert.strictEqual(result[0].data, "data:image/png;base64,abc123");
  });

  it("omits data when url is not a data URL", () => {
    const files: FileUIPart[] = [
      {
        type: "file",
        url: "https://example.com/file.pdf",
        filename: "doc.pdf",
        mediaType: "application/pdf",
      },
    ];
    const result = filePartsToFlowiseUploads(files);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].data, undefined);
    assert.strictEqual(result[0].name, "doc.pdf");
    assert.strictEqual(result[0].mime, "application/pdf");
  });

  it("uses defaults for missing filename and mediaType", () => {
    const files: FileUIPart[] = [
      { type: "file", url: "", filename: undefined, mediaType: undefined },
    ];
    const result = filePartsToFlowiseUploads(files);
    assert.strictEqual(result[0].name, "file");
    assert.strictEqual(result[0].mime, "application/octet-stream");
  });

  it("handles multiple files", () => {
    const files: FileUIPart[] = [
      { type: "file", url: "data:x;base64,a", filename: "a.txt", mediaType: "text/plain" },
      { type: "file", url: "", filename: "b.pdf", mediaType: "application/pdf" },
    ];
    const result = filePartsToFlowiseUploads(files);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].name, "a.txt");
    assert.strictEqual(result[1].name, "b.pdf");
  });
});
