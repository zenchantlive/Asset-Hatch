/**
 * GLB Model Proxy API Route
 * 
 * Proxies GLB files from Tripo CDN to avoid CORS issues.
 * The Tripo CDN doesn't set CORS headers, so we fetch server-side
 * and serve with proper headers.
 * 
 * GET /api/proxy-model?url=<tripo-url>
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the model URL from query params
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }
    
    // Validate it's a Tripo URL
    if (!url.startsWith('https://tripo-data.')) {
      return NextResponse.json(
        { error: 'Invalid URL - must be from tripo-data domain' },
        { status: 400 }
      );
    }
    
    console.log('📥 Proxying model from:', url);
    
    // Fetch the GLB file from Tripo
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('❌ Tripo fetch failed:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch model from Tripo' },
        { status: response.status }
      );
    }
    
    // Get the binary data
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('✅ Model fetched:', buffer.length, 'bytes');
    
    // Return with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*', // Allow CORS
      },
    });
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to proxy model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
