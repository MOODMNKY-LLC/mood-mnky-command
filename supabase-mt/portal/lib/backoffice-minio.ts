/**
 * MinIO / S3-compatible storage back office.
 * Uses @aws-sdk/client-s3 with endpoint + forcePathStyle for MinIO.
 * Credentials: from env (MINIO_* or S3_STORAGE_*) for env-minio instance.
 */

import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import type { AppInstance } from "./backoffice-instance";
import { getEnvFromFile } from "@/lib/env-file";

function getMinioSecret(): string | null {
  return (
    process.env.MINIO_ROOT_PASSWORD?.trim() ||
    process.env.S3_STORAGE_SECRET_ACCESS_KEY?.trim() ||
    getEnvFromFile("MINIO_ROOT_PASSWORD") ||
    getEnvFromFile("S3_STORAGE_SECRET_ACCESS_KEY") ||
    null
  );
}

export type MinioCredentials = {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  region: string;
  forcePathStyle: boolean;
};

/**
 * Resolve MinIO credentials from env-default instance (env-minio).
 * For DB-backed instances, endpoint and accessKey come from instance; secret from settings or env.
 */
export function getMinioCredentials(instance: AppInstance): MinioCredentials | null {
  const endpoint = (instance.base_url ?? "").trim();
  const accessKey = (instance.api_key_encrypted ?? "").trim();
  const secretKey =
    (instance.settings?.minio_secret_key as string)?.trim() || getMinioSecret();
  if (!endpoint || !accessKey || !secretKey) return null;
  const region = (process.env.S3_STORAGE_REGION?.trim() || process.env.AWS_REGION?.trim() || "us-east-1") as string;
  const forcePathStyle =
    process.env.S3_FORCE_PATH_STYLE === "true" ||
    process.env.MINIO_FORCE_PATH_STYLE === "true";
  return {
    endpoint,
    accessKey,
    secretKey,
    region,
    forcePathStyle: true,
  };
}

export function createS3Client(creds: MinioCredentials): S3Client {
  return new S3Client({
    region: creds.region,
    endpoint: creds.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: creds.accessKey,
      secretAccessKey: creds.secretKey,
    },
  });
}

export async function listBuckets(client: S3Client) {
  const cmd = new ListBucketsCommand({});
  const out = await client.send(cmd);
  return out.Buckets ?? [];
}

export async function createBucket(client: S3Client, bucket: string) {
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
}

export async function deleteBucket(client: S3Client, bucket: string) {
  await client.send(new DeleteBucketCommand({ Bucket: bucket }));
}

export async function headBucket(client: S3Client, bucket: string) {
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
}

export async function listObjectsV2(
  client: S3Client,
  bucket: string,
  opts: { prefix?: string; maxKeys?: number; continuationToken?: string } = {}
) {
  const cmd = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: opts.prefix || undefined,
    MaxKeys: opts.maxKeys ?? 1000,
    ContinuationToken: opts.continuationToken || undefined,
  });
  const out = await client.send(cmd);
  return {
    contents: out.Contents ?? [],
    isTruncated: out.IsTruncated ?? false,
    nextContinuationToken: out.NextContinuationToken ?? null,
    keyCount: out.KeyCount ?? 0,
  };
}

export async function getObject(
  client: S3Client,
  bucket: string,
  key: string
): Promise<{ body: ReadableStream; contentType?: string; contentLength?: number }> {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const out = await client.send(cmd);
  if (!out.Body) throw new Error("Empty object body");
  return {
    body: out.Body as ReadableStream,
    contentType: out.ContentType,
    contentLength: out.ContentLength,
  };
}

export async function putObject(
  client: S3Client,
  bucket: string,
  key: string,
  body: Uint8Array | ReadableStream,
  contentType?: string
) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteObject(client: S3Client, bucket: string, key: string) {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function headObject(client: S3Client, bucket: string, key: string) {
  const cmd = new HeadObjectCommand({ Bucket: bucket, Key: key });
  return client.send(cmd);
}
