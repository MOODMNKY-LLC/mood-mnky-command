import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerseCommunityPage() {
  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-16 md:px-6">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-verse-button/10 p-6">
            <Users className="h-16 w-16 text-verse-button" />
          </div>
        </div>
        <h1 className="font-verse-heading text-2xl font-semibold text-verse-text">
          Community
        </h1>
        <p className="mt-3 text-verse-text-muted">
          Forums, events, and collaborative projects are coming soon. Join us for
          wellness discussions and fragrance discovery.
        </p>
        <Button asChild className="mt-6">
          <Link href="/verse">Back to Portal</Link>
        </Button>
      </div>
    </div>
  );
}
