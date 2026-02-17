"use client";

import { useCallback } from "react";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import { usePromptInputAttachments } from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";

export function VerseAttachmentsDisplay() {
  const attachments = usePromptInputAttachments();
  const handleRemove = useCallback(
    (id: string) => attachments.remove(id),
    [attachments]
  );
  if (attachments.files.length === 0) return null;
  return (
    <Attachments
      variant="inline"
      className={cn(
        "rounded-lg border border-[var(--verse-border)] bg-[var(--verse-bg)] p-2"
      )}
    >
      {attachments.files.map((attachment) => (
        <Attachment key={attachment.id} data={attachment} onRemove={handleRemove}>
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}
