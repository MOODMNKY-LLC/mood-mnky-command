"use client";

import { useCallback, useMemo } from "react";
import { PROXMOX_PROXY } from "@/lib/proxmox-api";

export type ProxmoxGetParams = Record<
  string,
  string | number | undefined | (string | number)[]
>;

export function useProxmoxApi() {
  const get = useCallback(
    async <T,>(path: string, params?: ProxmoxGetParams): Promise<T> => {
      let url = `${PROXMOX_PROXY}/${path}`;
      if (params && Object.keys(params).length > 0) {
        const search = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v === undefined || v === "") continue;
          if (Array.isArray(v)) {
            v.forEach((vi) => search.append(k, String(vi)));
          } else {
            search.set(k, String(v));
          }
        }
        const qs = search.toString();
        if (qs) url += `?${qs}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? res.statusText);
      }
      return res.json() as Promise<T>;
    },
    []
  );

  return useMemo(() => ({ get }), [get]);
}
