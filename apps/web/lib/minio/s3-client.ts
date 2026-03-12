/**
 * MinIO/S3 client for LABZ platform storage control panel.
 * Uses @aws-sdk/client-s3 with custom endpoint for MinIO.
 */

import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl as getPresignedUrl } from "@aws-sdk/s3-request-presigner"

const endpoint = process.env.S3_ENDPOINT_URL ?? ""
const accessKey = process.env.S3_STORAGE_ACCESS_KEY_ID ?? ""
const secretKey = process.env.S3_STORAGE_SECRET_ACCESS_KEY ?? ""
const region = process.env.S3_STORAGE_REGION ?? "us-east-1"
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true"

function getClient(): S3Client {
  if (!endpoint || !accessKey || !secretKey) {
    throw new Error("S3_ENDPOINT_URL, S3_STORAGE_ACCESS_KEY_ID, S3_STORAGE_SECRET_ACCESS_KEY required")
  }
  return new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  })
}

export interface BucketInfo {
  name: string
  creationDate?: Date
}

export interface ObjectInfo {
  key: string
  size?: number
  lastModified?: Date
  etag?: string
}

export async function listBuckets(): Promise<{ buckets: BucketInfo[]; error?: string }> {
  try {
    const client = getClient()
    const res = await client.send(new ListBucketsCommand({}))
    const buckets: BucketInfo[] = (res.Buckets ?? []).map((b) => ({
      name: b.Name ?? "",
      creationDate: b.CreationDate,
    }))
    return { buckets }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return { buckets: [], error: msg }
  }
}

export async function createBucket(name: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getClient()
    await client.send(new CreateBucketCommand({ Bucket: name }))
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return { ok: false, error: msg }
  }
}

export interface ListObjectsResult {
  objects: ObjectInfo[]
  prefixes: string[]
  error?: string
}

export async function listObjects(
  bucket: string,
  prefix?: string
): Promise<ListObjectsResult> {
  try {
    const client = getClient()
    const objects: ObjectInfo[] = []
    const prefixes: string[] = []
    let continuationToken: string | undefined
    do {
      const res = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix || undefined,
          Delimiter: "/",
          ContinuationToken: continuationToken,
        })
      )
      for (const obj of res.Contents ?? []) {
        if (obj.Key) {
          objects.push({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
            etag: obj.ETag,
          })
        }
      }
      for (const p of res.CommonPrefixes ?? []) {
        if (p.Prefix) prefixes.push(p.Prefix)
      }
      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
    } while (continuationToken)
    return { objects, prefixes }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return { objects: [], prefixes: [], error: msg }
  }
}

export async function uploadObject(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array | Blob,
  contentType?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getClient()
    const buffer = body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : body
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    )
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return { ok: false, error: msg }
  }
}

export async function deleteObject(bucket: string, key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getClient()
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return { ok: false, error: msg }
  }
}

export async function deleteObjects(
  bucket: string,
  keys: string[]
): Promise<{ ok: boolean; deleted: number; error?: string }> {
  if (keys.length === 0) return { ok: true, deleted: 0 }
  try {
    const client = getClient()
    const res = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: keys.map((k) => ({ Key: k })),
          Quiet: true,
        },
      })
    )
    const deleted = res.Deleted?.length ?? 0
    return { ok: true, deleted }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return { ok: false, deleted: 0, error: msg }
  }
}

export async function getSignedUrl(
  bucket: string,
  key: string,
  expiresIn = 3600
): Promise<{ url: string; error?: string }> {
  try {
    const client = getClient()
    const url = await getPresignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn }
    )
    return { url }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return { url: "", error: msg }
  }
}

export function getDefaultBucket(): string {
  return process.env.S3_STORAGE_BUCKET_NAME ?? "flowise-dev"
}
