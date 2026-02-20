import { FlaskConical, BookOpen, Palette, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DojoBlendingLab } from "@/components/dojo/dojo-blending-lab";
import { DojoWheelDialog } from "@/components/dojo/dojo-wheel-dialog";
import { DojoBlendingGuideDialog } from "@/components/dojo/dojo-blending-guide-dialog";
import { DojoSavedBlendsDialog } from "@/components/dojo/dojo-saved-blends-dialog";

export default function DojoCraftingPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Blending Lab</h1>
        <p className="mt-1 text-muted-foreground">
          Explore fragrance families, learn how scents work together, and craft your own blends.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="size-5 text-primary" />
            </div>
            <CardTitle className="text-base">Fragrance Wheel</CardTitle>
            <CardDescription>
              Discover scent families and how they relate. Click segments to explore kindred and complementary scents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DojoWheelDialog
              trigger={
                <Button variant="outline" size="sm">
                  Explore wheel
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="size-5 text-primary" />
            </div>
            <CardTitle className="text-base">Blending Guide</CardTitle>
            <CardDescription>
              Learn how scent families work together. Kindred scents harmonize; complementary scents create contrast.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DojoBlendingGuideDialog
              trigger={
                <Button variant="outline" size="sm">
                  Read guide
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <FlaskConical className="size-5 text-primary" />
            </div>
            <CardTitle className="text-base">Saved Blends</CardTitle>
            <CardDescription>
              Your custom fragrance blends. View or use them as inspiration for new creations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DojoSavedBlendsDialog
              trigger={
                <Button variant="outline" size="sm">
                  View saved blends
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>

      <DojoBlendingLab />
    </div>
  );
}
