/**
 * Upload Verse chat file parts to storage and return durable public URLs.
 * Used so attachments remain visible after reload and to avoid sending large base64 in JSON.
 */

export type VerseFilePart = {
  url: string;
  filename?: string;
  mediaType?: string;
};

export type UploadedVerseFile = {
  url: string;
  filename: string;
  mediaType: string;
};

/**
 * For each file part (data URL or blob URL), fetch as blob, upload to /api/verse/upload-attachment,
 * and return the durable file descriptors.
 */
export async function uploadVerseAttachments(
  parts: VerseFilePart[],
  sessionId: string | null
): Promise<UploadedVerseFile[]> {
  if (!parts.length) return [];

  const formData = new FormData();
  formData.set("sessionId", sessionId ?? "no-session");

  for (const part of parts) {
    const res = await fetch(part.url);
    const blob = await res.blob();
    const name = part.filename ?? "file";
    const type = part.mediaType ?? (blob.type || "application/octet-stream");
    const file = new File([blob], name, { type });
    formData.append("files", file);
  }

  const response = await fetch("/api/verse/upload-attachment", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string })?.error ?? "Upload failed"
    );
  }

  const data = (await response.json()) as { files: UploadedVerseFile[] };
  return data.files ?? [];
}
