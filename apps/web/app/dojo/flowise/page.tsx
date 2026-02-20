import { DojoFlowiseConfigClient } from "@/components/dojo/dojo-flowise-config-client";

export default function DojoFlowisePage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-xl font-semibold">Flowise config</h1>
      <p className="text-sm text-muted-foreground">
        Manage override settings for your assigned chatflows. Open any chatflow in Dojo chat to use it.
      </p>
      <DojoFlowiseConfigClient />
    </div>
  );
}
