import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DojoPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Your Dojo
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your personal space—wellness, learning, and projects.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your default agent and experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dojo/preferences">Open Preferences</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>MNKY VERSE</CardTitle>
            <CardDescription>
              Explore the Verse: shop, chat, and community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/verse">Enter Verse</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
