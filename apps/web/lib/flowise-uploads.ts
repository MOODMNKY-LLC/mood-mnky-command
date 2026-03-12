import type { FileUIPart } from "ai";

export type FlowiseUpload = {
  data?: string;
  type: string;
  name: string;
  mime: string;
};

/**
 * Converts AI SDK FileUIPart[] (with optional data URL) to Flowise predict API uploads shape.
 * Used when sending chat messages with attachments to /api/flowise/predict.
 */
export function filePartsToFlowiseUploads(files: FileUIPart[]): FlowiseUpload[] {
  return files.map((part) => {
    const url = part.url ?? "";
    const data = url.startsWith("data:") ? url : undefined;
    return {
      data,
      type: "file",
      name: part.filename ?? "file",
      mime: part.mediaType ?? "application/octet-stream",
    };
  });
}
