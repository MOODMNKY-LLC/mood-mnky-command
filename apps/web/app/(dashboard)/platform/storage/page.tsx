"use client"

import { useCallback, useRef, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  HardDrive,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Copy,
  ChevronRight,
  FolderOpen,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface BucketInfo {
  name: string
  creationDate?: string
}

interface ObjectInfo {
  key: string
  size?: number
  lastModified?: string
  etag?: string
}

interface BucketsResponse {
  buckets?: BucketInfo[]
  error?: string
}

interface ObjectsResponse {
  objects?: ObjectInfo[]
  prefixes?: string[]
  error?: string
}

const DEFAULT_BUCKET = "flowise-dev"

function formatBytes(bytes?: number) {
  if (bytes == null) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d?: string) {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleString()
  } catch {
    return d
  }
}

export default function StoragePage() {
  const [selectedBucket, setSelectedBucket] = useState<string>(DEFAULT_BUCKET)
  const [manualBucket, setManualBucket] = useState("")
  const [prefix, setPrefix] = useState("")
  const [createBucketName, setCreateBucketName] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const bucket = selectedBucket || manualBucket.trim() || DEFAULT_BUCKET

  const { data: bucketsData, error: bucketsError, isLoading: bucketsLoading, mutate: mutateBuckets } =
    useSWR<BucketsResponse>("/api/platform/storage/buckets", fetcher, { revalidateOnFocus: false })

  const prefixQuery = prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""
  const objectsUrl = bucket
    ? `/api/platform/storage/buckets/${encodeURIComponent(bucket)}/objects${prefixQuery}`
    : ""
  const objectsSwrKey = bucket ? objectsUrl : null
  const { data: objectsData, error: objectsError, isLoading: objectsLoading, mutate: mutateObjects } =
    useSWR<ObjectsResponse>(objectsSwrKey, fetcher, { revalidateOnFocus: false })

  const buckets = bucketsData?.buckets ?? []
  const listBucketsError = bucketsData?.error ?? bucketsError?.message
  const objects = objectsData?.objects ?? []
  const prefixes = objectsData?.prefixes ?? []
  const objectsErrorMsg = objectsData?.error ?? objectsError?.message

  const handleCreateBucket = useCallback(async () => {
    const name = createBucketName.trim()
    if (!name) {
      toast.error("Bucket name required")
      return
    }
    setCreateLoading(true)
    try {
      const res = await fetch("/api/platform/storage/buckets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error("Create bucket failed", { description: data.error ?? "Unknown error" })
        return
      }
      toast.success("Bucket created", { description: name })
      setCreateOpen(false)
      setCreateBucketName("")
      mutateBuckets()
      setSelectedBucket(name)
    } finally {
      setCreateLoading(false)
    }
  }, [createBucketName, mutateBuckets])

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file?.size) return
      setUploadLoading(true)
      try {
        const formData = new FormData()
        formData.append("file", file)
        if (prefix) formData.append("key", `${prefix}${file.name}`)
        const res = await fetch(`/api/platform/storage/buckets/${encodeURIComponent(bucket)}/objects`, {
          method: "POST",
          body: formData,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error("Upload failed", { description: data.error ?? "Unknown error" })
          return
        }
        toast.success("Uploaded", { description: file.name })
        mutateObjects()
      } finally {
        setUploadLoading(false)
      }
    },
    [bucket, prefix, mutateObjects]
  )

  const onFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleUpload(file)
      e.target.value = ""
    },
    [handleUpload]
  )

  const handleDeleteSelected = useCallback(async () => {
    const keys = Array.from(selectedKeys)
    if (keys.length === 0) {
      toast.error("Select objects to delete")
      return
    }
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/platform/storage/buckets/${encodeURIComponent(bucket)}/objects`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error("Delete failed", { description: data.error ?? "Unknown error" })
        return
      }
      toast.success("Deleted", { description: `${data.deleted ?? keys.length} object(s)` })
      setSelectedKeys(new Set())
      mutateObjects()
    } finally {
      setDeleteLoading(false)
    }
  }, [bucket, selectedKeys, mutateObjects])

  const handleGetSignedUrl = useCallback(async (key: string) => {
    try {
      const res = await fetch(`/api/platform/storage/buckets/${encodeURIComponent(bucket)}/objects/signed-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, expiresIn: 3600 }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error("Failed to get URL", { description: data.error })
        return
      }
      await navigator.clipboard.writeText(data.url)
      toast.success("Signed URL copied to clipboard")
    } catch (e) {
      toast.error("Copy failed", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }, [bucket])

  const navigateToPrefix = (path: string) => {
    setPrefix(path.endsWith("/") ? path : `${path}/`)
  }

  const navigateUp = () => {
    const parts = prefix.replace(/\/$/, "").split("/").filter(Boolean)
    parts.pop()
    setPrefix(parts.length ? `${parts.join("/")}/` : "")
  }

  const breadcrumbParts = prefix ? ["", ...prefix.replace(/\/$/, "").split("/")] : []

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSelectAll = () => {
    const fileKeys = objects.map((o) => o.key)
    if (selectedKeys.size >= fileKeys.length) {
      setSelectedKeys(new Set())
    } else {
      setSelectedKeys(new Set(fileKeys))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Storage
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          MinIO/S3 bucket and object management
        </p>
      </div>

      <Tabs defaultValue="objects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="buckets">Buckets</TabsTrigger>
          <TabsTrigger value="objects">Objects</TabsTrigger>
        </TabsList>

        <TabsContent value="buckets" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-primary" />
                  Buckets
                </div>
                <Button
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                  disabled={!!listBucketsError}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create bucket
                </Button>
              </CardTitle>
              <CardDescription>
                {listBucketsError
                  ? "Bucket listing requires admin credentials. Enter bucket name manually below."
                  : "Select a bucket or create a new one."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {listBucketsError && (
                <Alert className="mb-4">
                  <AlertDescription>
                    {listBucketsError}. Using default bucket: {DEFAULT_BUCKET}. You can enter a bucket name manually.
                  </AlertDescription>
                </Alert>
              )}
              {bucketsLoading ? (
                <p className="text-sm text-muted-foreground">Loading buckets…</p>
              ) : buckets.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {buckets.map((b) => (
                    <Button
                      key={b.name}
                      variant={selectedBucket === b.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedBucket(b.name)
                        setPrefix("")
                      }}
                    >
                      {b.name}
                    </Button>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 flex items-center gap-2">
                <Label htmlFor="manual-bucket" className="text-sm">Manual bucket name</Label>
                <Input
                  id="manual-bucket"
                  placeholder={DEFAULT_BUCKET}
                  value={manualBucket}
                  onChange={(e) => setManualBucket(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const name = manualBucket.trim() || DEFAULT_BUCKET
                    setSelectedBucket(name)
                    setPrefix("")
                  }}
                >
                  Use
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objects" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  Objects in {bucket}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={() => {}}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {uploadLoading ? "Uploading…" : "Upload"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    disabled={deleteLoading || selectedKeys.size === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete ({selectedKeys.size})
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => mutateObjects()}
                    disabled={objectsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${objectsLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {prefix ? `Prefix: ${prefix}` : "Root"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {objectsErrorMsg && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{objectsErrorMsg}</AlertDescription>
                </Alert>
              )}
              {prefix && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={navigateUp}
                  >
                    ← Up
                  </Button>
                  <span className="text-muted-foreground">Breadcrumb:</span>
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setPrefix("")}
                  >
                    {bucket}
                  </button>
                  {breadcrumbParts.slice(1).map((part, i) => {
                    const p = breadcrumbParts.slice(1, i + 2).join("/") + "/"
                    return (
                      <span key={p} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => setPrefix(p)}
                        >
                          {part || "(root)"}
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              {objectsLoading ? (
                <p className="text-sm text-muted-foreground">Loading objects…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={objects.length > 0 && selectedKeys.size >= objects.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Last modified</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prefixes.map((p) => {
                      const displayName = p.slice(prefix.length).replace(/\/$/, "") || "(folder)"
                      return (
                        <TableRow key={p}>
                          <TableCell />
                          <TableCell>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-primary hover:underline"
                              onClick={() => navigateToPrefix(p)}
                            >
                              <FolderOpen className="h-4 w-4" />
                              {displayName}/
                            </button>
                          </TableCell>
                          <TableCell className="text-muted-foreground">—</TableCell>
                          <TableCell className="text-muted-foreground">—</TableCell>
                          <TableCell />
                        </TableRow>
                      )
                    })}
                    {objects.map((obj) => {
                      const displayName = obj.key.slice(prefix.length)
                      return (
                        <TableRow key={obj.key}>
                          <TableCell>
                            <Checkbox
                              checked={selectedKeys.has(obj.key)}
                              onCheckedChange={() => toggleSelect(obj.key)}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{displayName}</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatBytes(obj.size)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(obj.lastModified)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleGetSignedUrl(obj.key)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
              {!objectsLoading && objects.length === 0 && !objectsErrorMsg && (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No objects. Upload a file or navigate into a folder.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create bucket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-bucket-name">Bucket name</Label>
              <Input
                id="create-bucket-name"
                placeholder="my-bucket"
                value={createBucketName}
                onChange={(e) => setCreateBucketName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBucket} disabled={createLoading}>
              {createLoading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
