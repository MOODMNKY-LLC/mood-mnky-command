import Link from "next/link";
import { Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DojoXpCardProps {
  xpTotal: number;
  level: number;
}

export function DojoXpCard({ xpTotal, level }: DojoXpCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">XP & Level</CardTitle>
        <Award className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          Level {level}
        </div>
        <p className="text-muted-foreground text-xs">
          {xpTotal.toLocaleString()} XP total
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link href="/dojo/profile">View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
