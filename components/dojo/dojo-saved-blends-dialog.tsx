"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DojoSavedBlendsList } from "@/components/dojo/dojo-saved-blends-list";

interface DojoSavedBlendsDialogProps {
  trigger: React.ReactNode;
}

export function DojoSavedBlendsDialog({ trigger }: DojoSavedBlendsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Saved Blends</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Your custom fragrance blends. View or delete them.
          </p>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 min-h-0 -mx-6 px-6">
          <DojoSavedBlendsList embedded />
        </div>
      </DialogContent>
    </Dialog>
  );
}
