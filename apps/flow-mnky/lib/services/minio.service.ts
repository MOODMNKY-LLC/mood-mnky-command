/**
 * MinIO S3-Compatible Storage Service
 * Handles all file uploads, downloads, and storage operations
 */

import { Client } from 'minio'
import { getValidatedConfig } from '@/lib/env-validation'

interface MinIOFile {
  id: string
  name: string
  bucket: string
  size: number
  contentType: string
  uploadedAt: Date
  presignedUrl?: string
}

interface UploadOptions {
  bucket: string
  folder?: string
  metadata?: Record<string, string>
  tags?: Record<string, string>
}

class MinIOService {
  private client: Client | null = null

  private getClient(): Client {
    if (!this.client) {
      const config = getValidatedConfig()
      this.client = new Client({
        endPoint: config.minio.endpoint,
        port: config.minio.port,
        useSSL: config.minio.useSSL,
        accessKey: config.minio.accessKey,
        secretKey: config.minio.secretKey,
        region: config.minio.region,
      })
    }
    return this.client
  }

  /**
   * Ensure bucket exists, create if necessary
   */
  async ensureBucket(bucketName: string): Promise<void> {
    const client = this.getClient()
    try {
      const exists = await client.bucketExists(bucketName)
      if (!exists) {
        await client.makeBucket(bucketName, 'us-east-1')
        console.log(`[v0] Created MinIO bucket: ${bucketName}`)
      }
    } catch (error) {
      console.error(`[v0] Error ensuring bucket ${bucketName}:`, error)
      throw error
    }
  }

  /**
   * Upload file to MinIO
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    options: UploadOptions
  ): Promise<MinIOFile> {
    const client = this.getClient()
    const { bucket, folder = '', metadata = {}, tags = {} } = options

    // Ensure bucket exists
    await this.ensureBucket(bucket)

    // Build object name with folder structure
    const objectName = folder ? `${folder}/${fileName}` : fileName
    const timestamp = Date.now()
    const fileId = `${timestamp}-${fileName}`

    try {
      // Upload file with metadata and tags
      await client.putObject(bucket, objectName, fileBuffer, fileBuffer.length, {
        'Content-Type': metadata['Content-Type'] || 'application/octet-stream',
        ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`x-amz-meta-${k}`, v])),
      })

      // Set object tags
      if (Object.keys(tags).length > 0) {
        await client.setObjectTagging(bucket, objectName, tags)
      }

      console.log(`[v0] Uploaded file to MinIO: ${objectName}`)

      return {
        id: fileId,
        name: fileName,
        bucket,
        size: fileBuffer.length,
        contentType: metadata['Content-Type'] || 'application/octet-stream',
        uploadedAt: new Date(),
      }
    } catch (error) {
      console.error(`[v0] Error uploading file to MinIO:`, error)
      throw error
    }
  }

  /**
   * Download file from MinIO
   */
  async downloadFile(bucket: string, objectName: string): Promise<Buffer> {
    const client = this.getClient()

    try {
      const stream = await client.getObject(bucket, objectName)
      const chunks: Buffer[] = []

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })
    } catch (error) {
      console.error(`[v0] Error downloading file from MinIO:`, error)
      throw error
    }
  }

  /**
   * Delete file from MinIO
   */
  async deleteFile(bucket: string, objectName: string): Promise<void> {
    const client = this.getClient()

    try {
      await client.removeObject(bucket, objectName)
      console.log(`[v0] Deleted file from MinIO: ${objectName}`)
    } catch (error) {
      console.error(`[v0] Error deleting file from MinIO:`, error)
      throw error
    }
  }

  /**
   * List files in bucket with pagination
   */
  async listFiles(
    bucket: string,
    prefix: string = '',
    maxKeys: number = 100
  ): Promise<{ files: MinIOFile[]; isTruncated: boolean }> {
    const client = this.getClient()
    const files: MinIOFile[] = []
    let isTruncated = false

    try {
      const objectsList = client.listObjects(bucket, prefix, true)

      let count = 0
      for await (const obj of objectsList) {
        if (count >= maxKeys) {
          isTruncated = true
          break
        }

        if (obj.name) {
          files.push({
            id: obj.name,
            name: obj.name.split('/').pop() || obj.name,
            bucket,
            size: obj.size || 0,
            contentType: 'application/octet-stream',
            uploadedAt: new Date(obj.lastModified || Date.now()),
          })
          count++
        }
      }

      return { files, isTruncated }
    } catch (error) {
      console.error(`[v0] Error listing files in MinIO:`, error)
      throw error
    }
  }

  /**
   * Generate presigned URL for temporary download access
   */
  async generatePresignedUrl(
    bucket: string,
    objectName: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    const client = this.getClient()

    try {
      const url = await client.presignedGetObject(bucket, objectName, expirySeconds)
      console.log(`[v0] Generated presigned URL for: ${objectName}`)
      return url
    } catch (error) {
      console.error(`[v0] Error generating presigned URL:`, error)
      throw error
    }
  }

  /**
   * Set tags on object for organization and metadata
   */
  async setObjectTags(bucket: string, objectName: string, tags: Record<string, string>): Promise<void> {
    const client = this.getClient()

    try {
      await client.setObjectTagging(bucket, objectName, tags)
      console.log(`[v0] Set tags on object: ${objectName}`)
    } catch (error) {
      console.error(`[v0] Error setting object tags:`, error)
      throw error
    }
  }

  /**
   * Get object metadata
   */
  async getObjectMetadata(bucket: string, objectName: string): Promise<Record<string, string>> {
    const client = this.getClient()

    try {
      const stat = await client.statObject(bucket, objectName)
      return {
        size: String(stat.size),
        lastModified: new Date(stat.lastModified).toISOString(),
        etag: stat.etag,
        contentType: stat.metaData?.['content-type'] as string || 'application/octet-stream',
      }
    } catch (error) {
      console.error(`[v0] Error getting object metadata:`, error)
      throw error
    }
  }

  /**
   * Copy object from one location to another (for backups)
   */
  async copyObject(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string
  ): Promise<void> {
    const client = this.getClient()

    try {
      await client.copyObject(destBucket, destObject, `${sourceBucket}/${sourceObject}`)
      console.log(`[v0] Copied object from ${sourceObject} to ${destObject}`)
    } catch (error) {
      console.error(`[v0] Error copying object:`, error)
      throw error
    }
  }

  /**
   * Test MinIO connectivity
   */
  async testConnectivity(): Promise<boolean> {
    const client = this.getClient()

    try {
      const buckets = await client.listBuckets()
      console.log(`[v0] MinIO connectivity test passed. Found ${buckets.length} buckets`)
      return true
    } catch (error) {
      console.error(`[v0] MinIO connectivity test failed:`, error)
      return false
    }
  }
}

// Singleton instance
let minioService: MinIOService | null = null

export function getMinIOService(): MinIOService {
  if (!minioService) {
    minioService = new MinIOService()
  }
  return minioService
}

export type { MinIOFile }
