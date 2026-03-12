import { Suspense } from "react";
import Link from "next/link";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

function UpdatePasswordContent() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <UpdatePasswordForm />
      <Link
        href="/"
        className="mt-6 text-sm text-muted-foreground hover:text-foreground"
      >
        Back to home
      </Link>
    </main>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
      <UpdatePasswordContent />
    </Suspense>
  );
}
