"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export type FlowiseStore = { id: string; name?: string };

export interface FlowiseStoreSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  scope?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FlowiseStoreSelector({
  value,
  onValueChange,
  scope = "dojo",
  placeholder = "Select store",
  disabled = false,
  className,
}: FlowiseStoreSelectorProps) {
  const [stores, setStores] = useState<FlowiseStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/flowise/document-store/stores", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        const list =
          Array.isArray(data) ? data : (data as { stores?: FlowiseStore[] })?.stores ?? [];
        setStores(
          list.map((s: { id: string; name?: string }) => ({ id: s.id, name: s.name }))
        );
      })
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, [scope]);

  if (loading) {
    return (
      <div className={className}>
        <Label className="text-xs">Store</Label>
        <div className="flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading stores…
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Label className="text-xs">Store</Label>
      <Select
        value={value || "__none__"}
        onValueChange={(v) => onValueChange(v === "__none__" ? "" : v)}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 w-[200px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{placeholder}</SelectItem>
          {stores.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name ?? s.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
