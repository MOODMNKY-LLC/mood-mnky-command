/**
 * Context7 MCP Plugin API Route
 * Provides access to Context7 documentation and code examples
 */

import { NextRequest, NextResponse } from 'next/server'
import { getContext7MCPService } from '@/lib/services/context7-mcp.service'

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action')

    if (action === 'docs') {
      return await handleGetDocumentation(request)
    } else if (action === 'examples') {
      return await handleGetExamples(request)
    } else if (action === 'search') {
      return await handleSearch(request)
    } else if (action === 'version') {
      return await handleGetVersion(request)
    } else if (action === 'cache-stats') {
      return await handleCacheStats(request)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] Context7 API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action')

    if (action === 'invalidate-cache') {
      return await handleInvalidateCache(request)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] Context7 API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Get documentation from Context7
 */
async function handleGetDocumentation(request: NextRequest): Promise<NextResponse> {
  const libraries = request.nextUrl.searchParams.get('libraries')
  const libraryList = libraries ? libraries.split(',').map(l => l.trim()) : []

  try {
    const context7Service = getContext7MCPService()
    const docs = await context7Service.fetchDocumentation(libraryList)

    console.log(`[v0] Retrieved ${docs.length} documentation entries from Context7`)

    return NextResponse.json(
      {
        documentation: docs,
        metadata: {
          requestedLibraries: libraryList,
          resultCount: docs.length,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Documentation retrieval error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Documentation retrieval failed' },
      { status: 500 }
    )
  }
}

/**
 * Get code examples from Context7
 */
async function handleGetExamples(request: NextRequest): Promise<NextResponse> {
  const library = request.nextUrl.searchParams.get('library')
  const topic = request.nextUrl.searchParams.get('topic')

  if (!library) {
    return NextResponse.json({ error: 'Missing library parameter' }, { status: 400 })
  }

  try {
    const context7Service = getContext7MCPService()
    const examples = await context7Service.getCodeExamples(library, topic || undefined)

    console.log(`[v0] Retrieved ${examples.length} code examples for ${library}`)

    return NextResponse.json(
      {
        examples,
        metadata: {
          library,
          topic: topic || 'all',
          resultCount: examples.length,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Examples retrieval error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Examples retrieval failed' },
      { status: 500 }
    )
  }
}

/**
 * Search documentation in Context7
 */
async function handleSearch(request: NextRequest): Promise<NextResponse> {
  const query = request.nextUrl.searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Missing search query parameter' }, { status: 400 })
  }

  try {
    const context7Service = getContext7MCPService()
    const results = await context7Service.searchDocumentation(query)

    console.log(`[v0] Found ${results.length} search results for: ${query}`)

    return NextResponse.json(
      {
        results,
        metadata: {
          query,
          resultCount: results.length,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}

/**
 * Get library version information
 */
async function handleGetVersion(request: NextRequest): Promise<NextResponse> {
  const library = request.nextUrl.searchParams.get('library')

  if (!library) {
    return NextResponse.json({ error: 'Missing library parameter' }, { status: 400 })
  }

  try {
    const context7Service = getContext7MCPService()
    const version = await context7Service.getLibraryVersion(library)

    if (!version) {
      return NextResponse.json(
        { error: `Version information not found for library: ${library}` },
        { status: 404 }
      )
    }

    console.log(`[v0] Retrieved version for ${library}: ${version}`)

    return NextResponse.json(
      {
        library,
        version,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Version retrieval error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Version retrieval failed' },
      { status: 500 }
    )
  }
}

/**
 * Invalidate cache entries
 */
async function handleInvalidateCache(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const { pattern } = body

  try {
    const context7Service = getContext7MCPService()
    const clearedCount = context7Service.invalidateCache(pattern)

    console.log(`[v0] Invalidated ${clearedCount} cache entries`)

    return NextResponse.json(
      {
        success: true,
        clearedEntries: clearedCount,
        pattern: pattern || 'all',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Cache invalidation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cache invalidation failed' },
      { status: 500 }
    )
  }
}

/**
 * Get cache statistics
 */
async function handleCacheStats(request: NextRequest): Promise<NextResponse> {
  try {
    const context7Service = getContext7MCPService()
    const stats = context7Service.getCacheStats()

    return NextResponse.json(
      {
        cache: stats,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Cache stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Stats retrieval failed' },
      { status: 500 }
    )
  }
}
