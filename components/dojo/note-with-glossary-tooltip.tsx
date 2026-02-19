"use client";

import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { noteToSlug } from "@/lib/fragrance-search";

interface FragranceNoteData {
  note: {
    name: string;
    descriptionShort: string;
    olfactiveProfile: string;
    facts: string;
  };
}

interface NoteWithGlossaryTooltipProps {
  note: string;
  variant: "top" | "middle" | "base";
  children: React.ReactNode;
}

function GlossaryTooltipContent({
  slug,
  noteName,
}: {
  slug: string;
  noteName: string;
}) {
  const [data, setData] = useState<FragranceNoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    fetch(`/api/fragrance-notes/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <span className="text-xs">Loading...</span>;
  }
  if (error || !data?.note) {
    return <span className="text-xs">{noteName}</span>;
  }

  const { note } = data;
  return (
    <div className="max-w-xs space-y-2 py-1">
      <p className="text-xs font-medium">{note.name}</p>
      {note.descriptionShort && (
        <p className="text-xs text-muted-foreground">{note.descriptionShort}</p>
      )}
      {note.olfactiveProfile && (
        <p className="text-[10px] text-muted-foreground">
          <span className="font-medium">Profile:</span> {note.olfactiveProfile}
        </p>
      )}
      {note.facts && (
        <p className="text-[10px] text-muted-foreground">
          <span className="font-medium">Facts:</span> {note.facts}
        </p>
      )}
    </div>
  );
}

export function NoteWithGlossaryTooltip({
  note,
  variant,
  children,
}: NoteWithGlossaryTooltipProps) {
  const slug = noteToSlug(note);

  if (!slug) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-sm"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <GlossaryTooltipContent slug={slug} noteName={note} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
