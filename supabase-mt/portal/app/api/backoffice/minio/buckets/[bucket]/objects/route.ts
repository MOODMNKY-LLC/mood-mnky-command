import { NextResponse } from "next/server";
import { resolveInstance } from "@/lib/backoffice-proxy";
import { canAccessInstance } from "@/lib/backoffice-instance";
import {
  getMinioCredentials,
  createS3Client,
  listObjectsV2,
  putObject,
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

/** GET: List objects in bucket. Query: prefix?, maxKeys?, continuationToken? */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bucket: string }> }
) {
  const { bucket } = await params;
  if (!bucket) {
    return NextResponse.json({ message: "Bucket name required." }, { status: 400 });
  }
  const result = await getMinioClient(request);
  if (result instanceof NextResponse) return result;
  const url = new URL(request.url);
  const prefix = url.searchParams.get("prefix") ?? undefined;
  const maxKeys = url.searchParams.get("maxKeys");
  const continuationToken = url.searchParams.get("continuationToken") ?? undefined;
  try {
    const out = await listObjectsV2(result.client, bucket, {
      prefix: prefix || undefined,
      maxKeys: maxKeys ? parseInt(maxKeys, 10) : 1000,
      continuationToken,
    });
    return NextResponse.json({
      contents: out.contents.map((o) => ({
        key: o.Key,
        size: o.Size,
        lastModified: o.LastModified,
        etag: o.ETag,
      })),
      isTruncated: out.isTruncated,
      nextContinuationToken: out.nextContinuationToken,
      keyCount: out.keyCount,
    });
  } catch (err) {
    console.error("MinIO listObjects error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "List objects failed" },
      { status: 500 }
    );
  }
}

/** POST: Put object. FormData: key (string), file (File). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bucket: string }> }
) {
  const { bucket } = await params;
  if (!bucket) {
    return NextResponse.json({ message: "Bucket name required." }, { status: 400 });
  }
  const result = await getMinioClient(request);
  if (result instanceof NextResponse) return result;
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "FormData with key and file required." }, { status: 400 });
  }
  const key = formData.get("key")?.toString()?.trim();
  const file = formData.get("file") as File | null;
  if (!key) {
    return NextResponse.json({ message: "Form field 'key' is required." }, { status: 400 });
  }
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ message: "Form field 'file' is required." }, { status: 400 });
  }
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || undefined;
    await putObject(result.client, bucket, key, new Uint8Array(buf), contentType);
    return NextResponse.json({ bucket, key, put: true });
  } catch (err) {
    console.error("MinIO putObject error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Put object failed" },
      { status: 500 }
    );
  }
}
