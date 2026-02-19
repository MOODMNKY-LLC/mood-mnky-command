"use client";

import useSWR from "swr";
import Link from "next/link";
import { FlaskConical, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type SavedBlend = {
  id: string;
  name: string;
  product_type: string;
  batch_weight_g: number;
  fragrance_load_pct: number;
  fragrances: Array<{
    oilId?: string;
    oilName?: string;
    proportionPct?: number;
  }>;
  notes?: string | null;
  created_at: string;
};

interface DojoSavedBlendsListProps {
  /** When true, shown inside Dojo dialog; empty state avoids Verse links */
  embedded?: boolean;
}

export function DojoSavedBlendsList({ embedded }: DojoSavedBlendsListProps = {}) {
  const { data, error, isLoading, mutate } = useSWR<{ blends: SavedBlend[] }>(
    "/api/dojo/saved-blends",
    fetcher,
    { revalidateOnFocus: false }
  );

  const blends = data?.blends ?? [];

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error: err } = await supabase.from("saved_blends").delete().eq("id", id);
    if (!err) {
      mutate();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Failed to load saved blends. Please try again.
        </CardContent>
      </Card>
    );
  }

  if (blends.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <FlaskConical className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">No saved blends yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {embedded
                ? "Use the Blending Lab below to create your first blend."
                : "Create custom blends via the LABZ chat assistant or blending calculator."}
            </p>
          </div>
          {!embedded && (
            <Button asChild>
              <Link href="/verse/chat">Open LABZ Chat</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {blends.map((blend) => (
        <Card key={blend.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <FlaskConical className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{blend.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(blend.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete blend?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove &quot;{blend.name}&quot;. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(blend.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{blend.product_type}</Badge>
              <Badge variant="outline">
                {blend.batch_weight_g}g @ {blend.fragrance_load_pct}%
              </Badge>
            </div>
            {blend.fragrances && blend.fragrances.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Fragrances
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {blend.fragrances.map((f, i) => (
                    <Badge key={i} variant="outline" className="text-xs font-normal">
                      {f.oilName ?? "Unknown"}{" "}
                      {f.proportionPct != null && `(${f.proportionPct}%)`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {blend.notes && (
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                {blend.notes}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
