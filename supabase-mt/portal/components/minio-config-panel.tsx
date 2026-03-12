"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";
import {
  FolderOpen,
  HardDrive,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Download,
} from "lucide-react";

const MINIO_BUCKETS = "/api/backoffice/minio/buckets";
const MINIO_BUCKET = (b: string) => `/api/backoffice/minio/buckets/${encodeURIComponent(b)}`;
const MINIO_OBJECTS = (b: string) =>
  `/api/backoffice/minio/buckets/${encodeURIComponent(b)}/objects`;
const MINIO_OBJECT = (b: string, k: string) =>
  `/api/backoffice/minio/buckets/${encodeURIComponent(b)}/objects/${k.split("/").map(encodeURIComponent).join("/")}`;

function useMinioApi(instanceId: string | null) {
  const q = instanceId ? `?instanceId=${encodeURIComponent(instanceId)}` : "";

  const get = useCallback(
    async <T,>(url: string): Promise<T> => {
      if (!instanceId) throw new Error("No instance selected");
      const res = await fetch(url + (url.includes("?") ? "&" : "?") + `instanceId=${encodeURIComponent(instanceId)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? res.statusText);
      }
      return res.json() as Promise<T>;
    },
    [instanceId]
  );

  const del = useCallback(
    async (url: string): Promise<void> => {
      if (!instanceId) throw new Error("No instance selected");
      const res = await fetch(url + (url.includes("?") ? "&" : "?") + `instanceId=${encodeURIComponent(instanceId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? res.statusText);
      }
    },
    [instanceId]
  );

  const postJson = useCallback(
    async <T,>(url: string, body: unknown): Promise<T> => {
      if (!instanceId) throw new Error("No instance selected");
      const res = await fetch(url + (url.includes("?") ? "&" : "?") + `instanceId=${encodeURIComponent(instanceId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? res.statusText);
      }
      return res.json() as Promise<T>;
    },
    [instanceId]
  );

  const postForm = useCallback(
    async (url: string, formData: FormData): Promise<void> => {
      if (!instanceId) throw new Error("No instance selected");
      const u = new URL(url, window.location.origin);
      u.searchParams.set("instanceId", instanceId);
      const res = await fetch(u.toString(), {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? res.statusText);
      }
    },
    [instanceId]
  );

  return useMemo(() => ({ get, del, postJson, postForm }), [get, del, postJson, postForm]);
}

type BucketItem = { name?: string; creationDate?: string };

function MinioOverview({ instanceId }: { instanceId: string }) {
  const api = useMinioApi(instanceId);
  const [bucketCount, setBucketCount] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<{ buckets?: BucketItem[] }>(MINIO_BUCKETS)
      .then((r) => setBucketCount(Array.isArray(r?.buckets) ? r.buckets.length : 0))
      .catch(() => setBucketCount(null));
  }, [instanceId, api]);

  if (bucketCount === null) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <div className="text-2xl font-semibold tabular-nums">{bucketCount}</div>
        <div className="text-xs text-muted-foreground">Buckets</div>
      </div>
    </div>
  );
}

function BucketsTab({ instanceId }: { instanceId: string }) {
  const api = useMinioApi(instanceId);
  const [list, setList] = useState<BucketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteBucket, setDeleteBucket] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<{ buckets: BucketItem[] }>(MINIO_BUCKETS)
      .then((res) => setList(res.buckets ?? []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      toast.error("Bucket name required");
      return;
    }
    setSubmitting(true);
    try {
      await api.postJson<{ name: string }>(MINIO_BUCKETS, { name });
      toast.success(`Bucket "${name}" created`);
      setCreateOpen(false);
      setNewName("");
      fetchList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bucket: string) => {
    try {
      await api.del(MINIO_BUCKET(bucket));
      toast.success(`Bucket "${bucket}" deleted`);
      setDeleteBucket(null);
      fetchList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{list.length} bucket(s)</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" /> Create bucket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create bucket</DialogTitle>
                <DialogDescription>Enter a new bucket name (S3-compatible).</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Label htmlFor="bucket-name">Bucket name</Label>
                <Input
                  id="bucket-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="my-bucket"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No buckets. Create one to get started.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((b) => (
              <TableRow key={b.name ?? ""}>
                <TableCell className="font-mono text-sm">{b.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {b.creationDate ? new Date(b.creationDate).toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteBucket(b.name ?? "")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <AlertDialog open={!!deleteBucket} onOpenChange={(o) => !o && setDeleteBucket(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bucket?</AlertDialogTitle>
            <AlertDialogDescription>
              Bucket &quot;{deleteBucket}&quot; must be empty. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteBucket && handleDelete(deleteBucket)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type ObjectItem = { key?: string; size?: number; lastModified?: string };

function ObjectsTab({ instanceId }: { instanceId: string }) {
  const api = useMinioApi(instanceId);
  const [buckets, setBuckets] = useState<BucketItem[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefix, setPrefix] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadKey, setUploadKey] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const fetchBuckets = useCallback(() => {
    api
      .get<{ buckets: BucketItem[] }>(MINIO_BUCKETS)
      .then((res) => setBuckets(res.buckets ?? []))
      .catch((e) => toast.error(e.message));
  }, [api]);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  const fetchObjects = useCallback(() => {
    if (!selectedBucket) {
      setObjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const url = `${MINIO_OBJECTS(selectedBucket)}?maxKeys=500${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ""}`;
    api
      .get<{ contents: ObjectItem[] }>(url)
      .then((res) => setObjects(res.contents ?? []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [api, selectedBucket, prefix]);

  useEffect(() => {
    fetchObjects();
  }, [fetchObjects]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = uploadKey.trim();
    if (!key || !uploadFile) {
      toast.error("Object key and file required");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("key", key);
      formData.set("file", uploadFile);
      await api.postForm(MINIO_OBJECTS(selectedBucket), formData);
      toast.success(`Uploaded ${key}`);
      setUploadOpen(false);
      setUploadKey("");
      setUploadFile(null);
      fetchObjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await api.del(MINIO_OBJECT(selectedBucket, key));
      toast.success(`Deleted ${key}`);
      setDeleteKey(null);
      fetchObjects();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-sm">Bucket</Label>
        <Select value={selectedBucket} onValueChange={setSelectedBucket}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select bucket" />
          </SelectTrigger>
          <SelectContent>
            {buckets.map((b) => (
              <SelectItem key={b.name ?? ""} value={b.name ?? ""}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Prefix (optional)"
          className="w-40"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
        />
        <Button variant="outline" size="sm" onClick={fetchObjects}>
          Refresh
        </Button>
        {selectedBucket && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" /> Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleUpload}>
                <DialogHeader>
                  <DialogTitle>Upload object</DialogTitle>
                  <DialogDescription>
                    Object key (path) and file. Key can include slashes (e.g. folder/file.txt).
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="obj-key">Object key</Label>
                    <Input
                      id="obj-key"
                      value={uploadKey}
                      onChange={(e) => setUploadKey(e.target.value)}
                      placeholder="path/to/file.txt"
                    />
                  </div>
                  <div>
                    <Label htmlFor="obj-file">File</Label>
                    <Input
                      id="obj-file"
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Uploading…" : "Upload"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {!selectedBucket ? (
        <p className="text-sm text-muted-foreground">Select a bucket to list and manage objects.</p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{objects.length} object(s)</p>
          {objects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No objects in this bucket (or prefix).</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Last modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {objects.map((o) => (
                  <TableRow key={o.key ?? ""}>
                    <TableCell className="font-mono text-sm break-all">{o.key}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {o.size != null ? `${(o.size / 1024).toFixed(1)} KB` : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {o.lastModified
                        ? new Date(o.lastModified).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={`${typeof window !== "undefined" ? window.location.origin : ""}${MINIO_OBJECT(selectedBucket, o.key ?? "")}?instanceId=${encodeURIComponent(instanceId)}`}
                          download={(o.key ?? "").split("/").pop()}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteKey(o.key ?? "")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
      <AlertDialog open={!!deleteKey} onOpenChange={(o) => !o && setDeleteKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete object?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteKey}&quot; will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteKey && handleDelete(deleteKey)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function MinioConfigPanel() {
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instanceId");

  if (!instanceId) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-muted-foreground">
          Select an instance from Admin → App instances, or open Configure on a MinIO instance.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Instance:</span>
        <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
          {instanceId.slice(0, 12)}…
        </code>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">Change</Link>
        </Button>
      </div>
      <MinioOverview instanceId={instanceId} />
      <Tabs defaultValue="buckets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buckets" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> Buckets
          </TabsTrigger>
          <TabsTrigger value="objects" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" /> Objects
          </TabsTrigger>
        </TabsList>
        <TabsContent value="buckets" className="mt-4">
          <BucketsTab instanceId={instanceId} />
        </TabsContent>
        <TabsContent value="objects" className="mt-4">
          <ObjectsTab instanceId={instanceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
