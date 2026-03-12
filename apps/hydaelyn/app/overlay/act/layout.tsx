import { Suspense } from "react";

export default function OverlayActLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black/90 text-white">
          Loading overlay…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
