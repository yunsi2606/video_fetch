import { NextRequest, NextResponse } from 'next/server';

// Increase Vercel serverless timeout for video streaming (max 60s on Hobby, 300s on Pro)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const filename = searchParams.get('filename') || 'video.mp4';

  if (!url) {
    return NextResponse.json({ message: 'URL is required' }, { status: 400 });
  }

  try {
    // Determine referer/origin based on URL domain
    let referer = 'https://www.google.com/';
    if (url.includes('tiktok') || url.includes('tikwm')) referer = 'https://www.tiktok.com/';
    if (url.includes('fbcdn') || url.includes('facebook')) referer = 'https://www.facebook.com/';
    if (url.includes('shopee') || url.includes('susercontent') || url.includes('vod.susercontent')) referer = 'https://shopee.vn/';
    if (url.includes('ytimg') || url.includes('googlevideo')) referer = 'https://www.youtube.com/';
    if (url.includes('cobalt.tools') || url.includes('co.wuk.sh')) referer = 'https://cobalt.tools/';

    // Build fetch headers — only forward Range if the client sent one
    const clientRange = request.headers.get('Range');
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Referer': referer,
      'Origin': new URL(referer).origin,
      'Accept': 'video/webm,video/mp4,video/*;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    };
    if (clientRange) {
      fetchHeaders['Range'] = clientRange;
    }

    const response = await fetch(url, { headers: fetchHeaders });

    if (!response.ok && response.status !== 206) {
      return NextResponse.json(
        { message: `Upstream fetch failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('Content-Type') || 'video/mp4';
    const contentLength = response.headers.get('Content-Length');
    const contentRange = response.headers.get('Content-Range');

    // Sanitize filename — RFC 5987 for full Unicode support on all browsers including mobile
    const safeAsciiName = filename
      .replace(/[^\w.\-\s]/g, '_')
      .trim()
      .substring(0, 80) || 'video.mp4';
    const encodedName = encodeURIComponent(filename.substring(0, 100));

    const responseHeaders = new Headers({
      'Content-Type': contentType,
      // RFC 5987: ASCII fallback + UTF-8 encoded name — required for mobile browsers
      'Content-Disposition': `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`,
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    });

    if (contentLength) responseHeaders.set('Content-Length', contentLength);
    if (contentRange) responseHeaders.set('Content-Range', contentRange);
    // Accept-Ranges lets mobile browsers resume downloads
    responseHeaders.set('Accept-Ranges', 'bytes');

    const status = response.status === 206 ? 206 : 200;

    if (!response.body) {
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(response.body, { status, headers: responseHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Proxy download failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
