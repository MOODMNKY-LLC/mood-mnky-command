/**
 * Storage API Route
 * Handles file uploads, downloads, and management operations via MinIO
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMinIOService } from '@/lib/services/minio.service'

export async function POST(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action')

    if (action === 'upload') {
      return await handleUpload(request)
    } else if (action === 'presigned-url') {
      return await handlePresignedUrl(request)
    } else if (action === 'delete') {
      return await handleDelete(request)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] Storage API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action')

    if (action === 'list') {
      return await handleListFiles(request)
    } else if (action === 'download') {
      return await handleDownload(request)
    } else if (action === 'metadata') {
      return await handleMetadata(request)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] Storage API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Handle file upload
 */
async function handleUpload(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const bucket = (formData.get('bucket') as string) || 'chat-documents'
  const folder = (formData.get('folder') as string) || ''

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file size (max 100MB)
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })
  }

  try {
    const minioService = getMinIOService()
    const buffer = Buffer.from(await file.arrayBuffer())

    const fileData = await minioService.uploadFile(buffer, file.name, {
      bucket,
      folder,
      metadata: {
        'Content-Type': file.type || 'application/octet-stream',
        'Original-Name': file.name,
        'Upload-Time': new Date().toISOString(),
      },
      tags: {
        uploadType: 'chat',
        userId: 'temp-session', // Would be replaced with actual user ID
      },
    })

    console.log(`[v0] File uploaded: ${file.name} to ${bucket}/${folder}`)

    return NextResponse.json(fileData, { status: 200 })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle file listing
 */
async function handleListFiles(request: NextRequest): Promise<NextResponse> {
  const bucket = request.nextUrl.searchParams.get('bucket') || 'chat-documents'
  const folder = request.nextUrl.searchParams.get('folder') || ''
  const maxKeys = parseInt(request.nextUrl.searchParams.get('maxKeys') || '100', 10)

  try {
    const minioService = getMinIOService()
    const { files, isTruncated } = await minioService.listFiles(bucket, folder, maxKeys)

    console.log(`[v0] Listed ${files.length} files from ${bucket}/${folder}`)

    return NextResponse.json(
      {
        files,
        bucket,
        folder,
        isTruncated,
        total: files.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] List error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Listing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle file download
 */
async function handleDownload(request: NextRequest): Promise<NextResponse> {
  const bucket = request.nextUrl.searchParams.get('bucket')
  const object = request.nextUrl.searchParams.get('object')

  if (!bucket || !object) {
    return NextResponse.json({ error: 'Missing bucket or object' }, { status: 400 })
  }

  try {
    const minioService = getMinIOService()
    const buffer = await minioService.downloadFile(bucket, object)

    console.log(`[v0] Downloaded file: ${object} from ${bucket}`)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${object.split('/').pop()}"`,
      },
    })
  } catch (error) {
    console.error('[v0] Download error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle presigned URL generation
 */
async function handlePresignedUrl(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const { bucket, object, expirySeconds = 3600 } = body

  if (!bucket || !object) {
    return NextResponse.json({ error: 'Missing bucket or object' }, { status: 400 })
  }

  try {
    const minioService = getMinIOService()
    const url = await minioService.generatePresignedUrl(bucket, object, expirySeconds)

    console.log(`[v0] Generated presigned URL for: ${object}`)

    return NextResponse.json(
      {
        url,
        object,
        bucket,
        expiresAt: new Date(Date.now() + expirySeconds * 1000).toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Presigned URL error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'URL generation failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle object metadata retrieval
 */
async function handleMetadata(request: NextRequest): Promise<NextResponse> {
  const bucket = request.nextUrl.searchParams.get('bucket')
  const object = request.nextUrl.searchParams.get('object')

  if (!bucket || !object) {
    return NextResponse.json({ error: 'Missing bucket or object' }, { status: 400 })
  }

  try {
    const minioService = getMinIOService()
    const metadata = await minioService.getObjectMetadata(bucket, object)

    console.log(`[v0] Retrieved metadata for: ${object}`)

    return NextResponse.json(metadata, { status: 200 })
  } catch (error) {
    console.error('[v0] Metadata error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Metadata retrieval failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle file deletion
 */
async function handleDelete(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const { bucket, object } = body

  if (!bucket || !object) {
    return NextResponse.json({ error: 'Missing bucket or object' }, { status: 400 })
  }

  try {
    const minioService = getMinIOService()
    const metadata = await minioService.getObjectMetadata(bucket, object)
    await minioService.deleteFile(bucket, object)

    console.log(`[v0] Deleted file: ${object} from ${bucket}`)

    return NextResponse.json(
      {
        success: true,
        deletedObject: object,
        bucket,
        deletedSize: parseInt(metadata.size, 10),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Deletion failed' },
      { status: 500 }
    )
  }
}
