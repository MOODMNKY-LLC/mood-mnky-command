import { DojoSavedBlendsList } from "@/components/dojo/dojo-saved-blends-list";

export default function DojoSavedBlendsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saved Blends</h1>
        <p className="mt-1 text-muted-foreground">
          Your custom fragrance blends. Use them as inspiration or load them into the blending calculator.
        </p>
      </div>

      <DojoSavedBlendsList />
    </div>
  );
}
