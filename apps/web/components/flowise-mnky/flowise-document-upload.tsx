"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUp, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !files.length) return;

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
      setFiles([]);
      onUploadComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addFiles = (fileList: FileList | File[]) => {
    const next = Array.from(fileList).filter((f) => f.size > 0);
    setFiles((prev) => [...prev, ...next]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <FlowiseStoreSelector
          value={storeId}
          onValueChange={setStoreId}
          placeholder="Select store"
          disabled={uploading}
        />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors px-6 py-8",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-muted-foreground/40 hover:bg-accent/50"
          )}
        >
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {isDragOver ? "Drop files here" : "Click or drag files to upload"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            PDF, TXT, MD, or other documents
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,text/*,application/pdf"
            onChange={(e) => {
              if (e.target.files?.length) {
                addFiles(e.target.files);
                e.target.value = "";
              }
            }}
            className="hidden"
          />
        </div>
        {files.length > 0 && (
          <div className="flex flex-col gap-2">
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="min-w-0 truncate text-xs font-medium">{f.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
                disabled={uploading}
              >
                Clear
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!storeId || uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Upload {files.length} file{files.length !== 1 ? "s" : ""}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
