"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FragranceWheel } from "@/components/blending/fragrance-wheel";
import type { FragranceFamily } from "@/lib/types";

interface DojoWheelDialogProps {
  trigger: React.ReactNode;
}

export function DojoWheelDialog({ trigger }: DojoWheelDialogProps) {
  const [selectedFamily, setSelectedFamily] = useState<FragranceFamily | null>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fragrance Wheel</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Discover scent families and how they relate. Click segments to explore kindred and complementary scents.
          </p>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/30 p-4 [&_.fill-foreground]:fill-foreground [&_.fill-muted-foreground]:fill-muted-foreground">
          <FragranceWheel
            selectedFamily={selectedFamily}
            onSelectFamily={setSelectedFamily}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
