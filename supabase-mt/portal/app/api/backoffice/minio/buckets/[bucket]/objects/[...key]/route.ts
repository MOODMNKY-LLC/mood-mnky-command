import { NextResponse } from "next/server";
import { resolveInstance } from "@/lib/backoffice-proxy";
import { canAccessInstance } from "@/lib/backoffice-instance";
import {
  getMinioCredentials,
  createS3Client,
  getObject,
  deleteObject,
  headObject,
} from "@/lib/backoffice-minio";

async function getMinioClient(request: Request) {
  const instance = await resolveInstance(request);
  if (!instance) {
    return NextResponse.json(
      { message: "Instance not found. Use instanceId=env-minio or a valid instance id." },
      { status: 400 }
    );
  }
  if (instance.app_type !== "minio") {
    return NextResponse.json({ message: "Instance is not a MinIO instance." }, { status: 400 });
  }
  const allowed = await canAccessInstance(instance);
  if (!allowed) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }
  const creds = getMinioCredentials(instance);
  if (!creds) {
    return NextResponse.json(
      { message: "MinIO credentials not configured." },
      { status: 503 }
    );
  }
  return { client: createS3Client(creds) };
}

/** GET: Download object */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bucket: string; key: string[] }> }
) {
  const { bucket, key: keyParts } = await params;
  const key = keyParts?.length ? keyParts.join("/") : "";
  if (!bucket || !key) {
    return NextResponse.json({ message: "Bucket and object key required." }, { status: 400 });
  }
  const result = await getMinioClient(request);
  if (result instanceof NextResponse) return result;
  try {
    const out = await getObject(result.client, bucket, key);
    const headers = new Headers();
    if (out.contentType) headers.set("Content-Type", out.contentType);
    if (out.contentLength != null) headers.set("Content-Length", String(out.contentLength));
    const filename = key.split("/").pop() ?? "download";
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    return new NextResponse(out.body as BodyInit, { status: 200, headers });
  } catch (err) {
    if ((err as { name?: string }).name === "NoSuchKey") {
      return NextResponse.json({ message: "Object not found." }, { status: 404 });
    }
    console.error("MinIO getObject error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Get object failed" },
      { status: 500 }
    );
  }
}

/** HEAD: Object metadata */
export async function HEAD(
  request: Request,
  { params }: { params: Promise<{ bucket: string; key: string[] }> }
) {
  const { bucket, key: keyParts } = await params;
  const key = keyParts?.length ? keyParts.join("/") : "";
  if (!bucket || !key) {
    return new NextResponse(null, { status: 400 });
  }
  const result = await getMinioClient(request);
  if (result instanceof NextResponse) return result;
  try {
    const out = await headObject(result.client, bucket, key);
    const headers = new Headers();
    if (out.ContentLength != null) headers.set("Content-Length", String(out.ContentLength));
    if (out.ContentType) headers.set("Content-Type", out.ContentType);
    if (out.LastModified) headers.set("Last-Modified", out.LastModified.toUTCString());
    return new NextResponse(null, { status: 200, headers });
  } catch (err) {
    if ((err as { name?: string }).name === "NotFound") {
      return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(null, { status: 500 });
  }
}

/** DELETE: Delete object */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bucket: string; key: string[] }> }
) {
  const { bucket, key: keyParts } = await params;
  const key = keyParts?.length ? keyParts.join("/") : "";
  if (!bucket || !key) {
    return NextResponse.json({ message: "Bucket and object key required." }, { status: 400 });
  }
  const result = await getMinioClient(request);
  if (result instanceof NextResponse) return result;
  try {
    await deleteObject(result.client, bucket, key);
    return NextResponse.json({ bucket, key, deleted: true });
  } catch (err) {
    console.error("MinIO deleteObject error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Delete object failed" },
      { status: 500 }
    );
  }
}
