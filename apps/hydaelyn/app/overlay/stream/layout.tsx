import { Suspense } from "react";

export default function OverlayStreamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black/40 p-4 text-white">Loading…</div>}>
      {children}
    </Suspense>
  );
}
