"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStreamSession, deleteStreamSession } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

type Session = {
  id: string;
  name: string;
  overlay_token: string;
  created_at: string;
  source: string;
};

export function LiveContextClient({
  sessions,
  baseUrl,
}: {
  sessions: Session[];
  baseUrl: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await createStreamSession(name);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
  }

  function copyUrl(url: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  }

  async function handleDelete(s: Session) {
    if (!confirm(`Delete session "${s.name}"? This cannot be undone.`)) return;
    setDeletingId(s.id);
    const result = await deleteStreamSession(s.id);
    setDeletingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create stream session</CardTitle>
          <CardDescription>
            Create a new session to get an overlay token and URLs for OBS and ACT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Session name</Label>
              <Input
                id="session-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tuesday prog"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create session"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div id="sessions" className="space-y-4">
        <h2 className="text-lg font-semibold">Your sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground">No sessions yet. Create one above.</p>
        ) : (
          <ul className="space-y-4">
            {sessions.map((s) => {
              const obsUrl = baseUrl ? `${baseUrl}/overlay/stream?token=${s.overlay_token}` : "";
              const actIngestUrl = baseUrl ? `${baseUrl}/overlays/act-ingest/index.html?token=${s.overlay_token}` : "";
              const actOverlayFullUrl = baseUrl ? `${baseUrl}/overlay/act?token=${s.overlay_token}` : "";
              return (
                <Card key={s.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{s.source}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(s)}
                          disabled={deletingId === s.id}
                          aria-label={`Delete session ${s.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Created {new Date(s.created_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">OBS overlay URL</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={obsUrl}
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyUrl(obsUrl)}
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use this URL in OBS Browser Source. Add to scene, set size, optionally enable click-through.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">ACT ingest overlay URL</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={actIngestUrl}
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyUrl(actIngestUrl)}
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add this URL in OverlayPlugin as a new overlay. The token is in the URL; combat data will be sent to Hydaelyn.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">ACT overlay (full — Parse + Ingest + Settings)</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={actOverlayFullUrl}
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyUrl(actOverlayFullUrl)}
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        React overlay with DPS table, ingest status, and settings. Use in OverlayPlugin or OBS with ?OVERLAY_WS=ws://127.0.0.1:10501/ws.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        In ACT, OverlayPlugin will append &amp;HOST_PORT=ws://127.0.0.1/fake/ to the URL — that is normal and the overlay still works.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Overlay token</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={s.overlay_token}
                          className="font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyUrl(s.overlay_token)}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
