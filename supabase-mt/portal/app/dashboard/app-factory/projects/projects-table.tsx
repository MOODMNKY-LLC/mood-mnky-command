"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AppFactoryProjectRow } from "@/lib/app-factory/actions";
import {
  deleteProject,
  fixCoolifyApplicationConfig,
  getCoolifyAppStatus,
  getCoolifyDeploymentProgress,
  runPullChanges,
  type CoolifyAppStatusResult,
} from "@/lib/app-factory/actions";
import { ExternalLink, GitPullRequest, Loader2, Trash2, Wrench } from "lucide-react";

const DEPLOY_POLL_INTERVAL_MS = 15000;
const TERMINAL_SUCCESS = ["success", "succeeded", "finished"];
const TERMINAL_FAILURE = ["failed", "error", "cancelled"];

function deploymentStatusLabel(status: string): string {
  const s = status?.toLowerCase().trim() ?? "";
  if (TERMINAL_SUCCESS.some((t) => s === t)) return "Live";
  if (TERMINAL_FAILURE.some((t) => s === t)) return "Failed";
  if (s === "pending" || s === "in_progress" || s === "in progress") return "Building";
  return status || "—";
}

function deploymentStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  const s = status?.toLowerCase().trim() ?? "";
  if (TERMINAL_SUCCESS.some((t) => s === t)) return "default";
  if (TERMINAL_FAILURE.some((t) => s === t)) return "destructive";
  return "secondary";
}

type ProjectsTableProps = {
  initialProjects: AppFactoryProjectRow[];
};

type DeploymentProgressState = {
  status: string;
  deploymentUrl: string | null;
};

export function ProjectsTable({ initialProjects }: ProjectsTableProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [statusByProjectId, setStatusByProjectId] = useState<Record<string, CoolifyAppStatusResult>>({});
  const [deploymentProgressByProjectId, setDeploymentProgressByProjectId] = useState<
    Record<string, DeploymentProgressState>
  >({});
  const [loadingStatusId, setLoadingStatusId] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [fixingCoolifyId, setFixingCoolifyId] = useState<string | null>(null);
  const [pullingProjectId, setPullingProjectId] = useState<string | null>(null);

  const fetchDeploymentProgress = useCallback(async (projectId: string, applicationUuid: string) => {
    const result = await getCoolifyDeploymentProgress(applicationUuid);
    if (result.success) {
      setDeploymentProgressByProjectId((prev) => ({
        ...prev,
        [projectId]: { status: result.status, deploymentUrl: result.deploymentUrl ?? null },
      }));
    }
  }, []);

  useEffect(() => {
    const projectAppPairs = projects
      .filter((p): p is AppFactoryProjectRow & { coolify_application_uuid: string } => !!p.coolify_application_uuid)
      .map((p) => ({ projectId: p.id, appUuid: p.coolify_application_uuid! }));

    if (projectAppPairs.length === 0) return;

    const run = () => {
      projectAppPairs.forEach(({ projectId, appUuid }) => fetchDeploymentProgress(projectId, appUuid));
    };
    run();
    const interval = setInterval(run, DEPLOY_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [projects, fetchDeploymentProgress]);

  const handleViewDeployment = async (projectId: string, applicationUuid: string) => {
    if (statusByProjectId[projectId]?.success) return;
    setLoadingStatusId(projectId);
    const result = await getCoolifyAppStatus(applicationUuid);
    setStatusByProjectId((prev) => ({ ...prev, [projectId]: result }));
    setLoadingStatusId(null);
  };

  const handlePullChanges = async (projectId: string) => {
    setPullingProjectId(projectId);
    const result = await runPullChanges(projectId);
    setPullingProjectId(null);
    if (result.success) {
      const project = projects.find((p) => p.id === projectId);
      if (project?.coolify_application_uuid) {
        await fetchDeploymentProgress(projectId, project.coolify_application_uuid);
      }
      alert(result.message);
    } else {
      alert(result.error);
    }
  };

  const handleFixCoolify = async (applicationUuid: string) => {
    setFixingCoolifyId(applicationUuid);
    const result = await fixCoolifyApplicationConfig(applicationUuid);
    setFixingCoolifyId(null);
    if (result.success) {
      alert("Coolify config updated and redeploy triggered. Check Coolify for build status.");
    } else {
      alert(result.error);
    }
  };

  const handleDelete = async (projectId: string) => {
    setDeleting(true);
    const result = await deleteProject(projectId);
    setDeleting(false);
    setDeleteProjectId(null);
    if (result.success) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setStatusByProjectId((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
      if (result.warning) alert(result.warning);
    } else {
      console.error(result.error);
      alert(result.error);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Deployment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No projects yet. Create one via the Launch Wizard.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => {
              const appUuid = project.coolify_application_uuid;
              const statusResult = statusByProjectId[project.id];
              const loading = loadingStatusId === project.id;

              return (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="font-mono text-xs">{project.slug}</TableCell>
                  <TableCell>
                    <Badge variant={project.status === "generated" ? "default" : "secondary"}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {appUuid ? (
                        <>
                          {deploymentProgressByProjectId[project.id] ? (
                            <Badge
                              variant={deploymentStatusVariant(deploymentProgressByProjectId[project.id].status)}
                              className={
                                deploymentProgressByProjectId[project.id].status &&
                                !TERMINAL_SUCCESS.includes(deploymentProgressByProjectId[project.id].status.toLowerCase()) &&
                                !TERMINAL_FAILURE.includes(deploymentProgressByProjectId[project.id].status.toLowerCase())
                                  ? "animate-pulse"
                                  : ""
                              }
                            >
                              {deploymentStatusLabel(deploymentProgressByProjectId[project.id].status)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              —
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePullChanges(project.id)}
                            disabled={pullingProjectId === project.id}
                            title="Regenerate from template, push to repo, and trigger Coolify redeploy"
                          >
                            {pullingProjectId === project.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <GitPullRequest className="h-4 w-4 shrink-0" />
                                <span className="ml-1">Pull</span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFixCoolify(appUuid)}
                            disabled={fixingCoolifyId === appUuid}
                            title="Fix Coolify start command and trigger redeploy (use if app restarts in loop)"
                          >
                            {fixingCoolifyId === appUuid ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Wrench className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDeployment(project.id, appUuid)}
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : statusResult?.success ? (
                              "View"
                            ) : (
                              "View deployment"
                            )}
                          </Button>
                          {statusResult?.success && (
                            <span className="flex items-center gap-2 text-sm flex-wrap">
                              <Badge variant="outline">{statusResult.app.status ?? "—"}</Badge>
                              {statusResult.app.fqdn && (
                                <a
                                  href={
                                    statusResult.app.fqdn.startsWith("http")
                                      ? statusResult.app.fqdn
                                      : `https://${statusResult.app.fqdn}`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  Open app <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {statusResult.coolifyBaseUrl && (
                                <a
                                  href={statusResult.coolifyBaseUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-muted-foreground hover:underline text-xs"
                                >
                                  Coolify <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not deployed</span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteProjectId(project.id)}
                        title="Delete project"
                        aria-label="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteProjectId} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this project, its Coolify application (if deployed), and its GitHub repository. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteProjectId) handleDelete(deleteProjectId);
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
