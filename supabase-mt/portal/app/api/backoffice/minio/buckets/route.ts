import { NextResponse } from "next/server";
import { resolveInstance } from "@/lib/backoffice-proxy";
import { canAccessInstance } from "@/lib/backoffice-instance";
import {
  getMinioCredentials,
  createS3Client,
  listBuckets,
  createBucket,
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
      {
        message:
          "MinIO credentials not configured. Set MINIO_ENDPOINT, MINIO_ROOT_USER, MINIO_ROOT_PASSWORD (or S3_* equivalents) in supabase-mt/.env.local.",
      },
      { status: 503 }
    );
  }
  return { client: createS3Client(creds) };
}

/** GET: List all buckets */
export async function GET(request: Request) {
  const result = await getMinioClient(request);
  if (result instanceof NextResponse) return result;
  try {
    const buckets = await listBuckets(result.client);
    return NextResponse.json({
      buckets: buckets.map((b) => ({ name: b.Name, creationDate: b.CreationDate })),
    });
  } catch (err) {
    console.error("MinIO listBuckets error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "List buckets failed" },
      { status: 500 }
    );
  }
}

/** POST: Create a bucket. Body: { name: string } */
export async function POST(request: Request) {
  const result = await getMinioClient(request);
  if (result instanceof NextResponse) return result;
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON body with name required." }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ message: "Body name is required." }, { status: 400 });
  }
  try {
    await createBucket(result.client, name);
    return NextResponse.json({ name, created: true });
  } catch (err) {
    console.error("MinIO createBucket error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Create bucket failed" },
      { status: 500 }
    );
  }
}
