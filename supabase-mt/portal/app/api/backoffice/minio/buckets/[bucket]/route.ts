import { NextResponse } from "next/server";
import { resolveInstance } from "@/lib/backoffice-proxy";
import { canAccessInstance } from "@/lib/backoffice-instance";
import {
  getMinioCredentials,
  createS3Client,
  deleteBucket,
  headBucket,
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

/** GET: Head bucket (check exists) */
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
  try {
    await headBucket(result.client, bucket);
    return NextResponse.json({ bucket, exists: true });
  } catch (err) {
    if ((err as { name?: string }).name === "NotFound") {
      return NextResponse.json({ message: "Bucket not found." }, { status: 404 });
    }
    console.error("MinIO headBucket error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Head bucket failed" },
      { status: 500 }
    );
  }
}

/** DELETE: Delete a bucket (must be empty) */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bucket: string }> }
) {
  const { bucket } = await params;
  if (!bucket) {
    return NextResponse.json({ message: "Bucket name required." }, { status: 400 });
  }
  const result = await getMinioClient(request);
  if (result instanceof NextResponse) return result;
  try {
    await deleteBucket(result.client, bucket);
    return NextResponse.json({ bucket, deleted: true });
  } catch (err) {
    console.error("MinIO deleteBucket error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Delete bucket failed" },
      { status: 500 }
    );
  }
}
