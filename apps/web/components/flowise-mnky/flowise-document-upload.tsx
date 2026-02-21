"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileUp, Loader2 } from "lucide-react";
import { FlowiseStoreSelector } from "./flowise-store-selector";

export interface FlowiseDocumentUploadProps {
  onUploadComplete?: () => void;
  className?: string;
}

export function FlowiseDocumentUpload({
  onUploadComplete,
  className,
}: FlowiseDocumentUploadProps) {
  const [storeId, setStoreId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!storeId) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll("files") as File[];
    if (!files.length || !files[0]?.size) return;

    setUploading(true);
    setError(null);
    try {
      const uploadFormData = new FormData();
      files.forEach((f) => uploadFormData.append("files", f));

      const res = await fetch(`/api/flowise/document-store/upsert/${storeId}`, {
        method: "POST",
        credentials: "same-origin",
        body: uploadFormData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error ?? "Upload failed");
      }
      form.reset();
      onUploadComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
        <FileUp className="h-4 w-4" />
        Document store
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Upload files to a Flowise document store (RAG). Documents are tagged with your profile for
        per-user retrieval when using Supabase vector store.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <FlowiseStoreSelector
          value={storeId}
          onValueChange={setStoreId}
          placeholder="Select store"
          disabled={uploading}
        />
        <div className="space-y-1">
          <Label className="text-xs">Files</Label>
          <input
            type="file"
            name="files"
            multiple
            className="block w-full max-w-[240px] text-sm file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground file:hover:bg-primary/90"
          />
        </div>
        <Button type="submit" size="sm" disabled={!storeId || uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
        </Button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
