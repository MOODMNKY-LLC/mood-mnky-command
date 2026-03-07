import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getTemplatesWithVersions } from "@/lib/app-factory/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TemplateWithVersions } from "@/lib/app-factory/data";

export const dynamic = "force-dynamic";

export default async function AppFactoryTemplatesPage() {
  let templates: TemplateWithVersions[] = [];
  try {
    templates = await getTemplatesWithVersions();
  } catch (e) {
    console.error("Failed to load templates:", e);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Registry of approved templates and versions for app generation.
          </p>
        </div>
        <Link
          href="/dashboard/app-factory/launch"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Launch new project
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template registry</CardTitle>
          <CardDescription>
            Templates and versions used in the Launch Wizard. Source path is used by the generator to copy template files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              No templates found. Add rows to <code className="rounded bg-muted px-1">template_registry</code> and{" "}
              <code className="rounded bg-muted px-1">template_versions</code> via migrations or SQL.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Current version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source path</TableHead>
                  <TableHead>Versions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.display_name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{t.template_key}</code>
                    </TableCell>
                    <TableCell>{t.current_version ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "active" ? "default" : "secondary"}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {t.source_path ?? "—"}
                    </TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside text-sm space-y-0.5">
                        {t.versions.map((v) => (
                          <li key={v.id}>
                            <span className="font-mono">{v.version}</span>
                            {v.release_notes && (
                              <span className="text-muted-foreground ml-1">— {v.release_notes.slice(0, 50)}
                                {v.release_notes.length > 50 ? "…" : ""}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            See <code className="rounded bg-muted px-1">portal/docs/APP-FACTORY-DEPLOYMENT-SPEC.md</code> for template manifest format.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
