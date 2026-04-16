import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const filename = searchParams.get('filename') || 'video.mp4';

  if (!url) {
    return NextResponse.json({ message: 'URL is required' }, { status: 400 });
  }

  try {
    // Determine referer based on URL domain
    let referer = 'https://www.google.com/';
    if (url.includes('tiktok') || url.includes('tikwm')) referer = 'https://www.tiktok.com/';
    if (url.includes('fbcdn') || url.includes('facebook')) referer = 'https://www.facebook.com/';
    if (url.includes('shopee')) referer = 'https://shopee.vn/';
    if (url.includes('ytimg') || url.includes('googlevideo')) referer = 'https://www.youtube.com/';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': referer,
        'Origin': new URL(referer).origin,
        'Accept': 'video/webm,video/mp4,video/*;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Range': request.headers.get('Range') || 'bytes=0-',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: `Upstream fetch failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('Content-Type') || 'video/mp4';
    const contentLength = response.headers.get('Content-Length');
    const contentRange = response.headers.get('Content-Range');

    // Sanitize filename for Content-Disposition
    const safeFilename = filename
      .replace(/[^\w.\-áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ\s]/gi, '')
      .trim()
      .substring(0, 100) || 'video.mp4';

    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });

    if (contentLength) headers.set('Content-Length', contentLength);
    if (contentRange) {
      headers.set('Content-Range', contentRange);
    }

    const status = response.status === 206 ? 206 : 200;

    if (!response.body) {
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(response.body, { status, headers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Proxy download failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
