import { NextRequest, NextResponse } from 'next/server';
import { VideoInfo, DownloadOption, FetchInfoRequest } from '@/app/types';

// Platform detection
function detectPlatform(url: string): 'YouTube' | 'TikTok' | 'Facebook' | 'Shopee' | 'Unknown' {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'YouTube';
  if (/tiktok\.com/i.test(url)) return 'TikTok';
  if (/facebook\.com|fb\.watch|fb\.me/i.test(url)) return 'Facebook';
  if (/shopee\.(vn|com|co\.id|sg|ph|com\.my|co\.th)/i.test(url)) return 'Shopee';
  return 'Unknown';
}

// YouTube Handler
async function fetchYouTubeInfo(url: string): Promise<VideoInfo> {
  const ytdl = await import('@distube/ytdl-core');
  const info = await ytdl.default.getInfo(url);
  const videoDetails = info.videoDetails;

  // Build quality options from formats
  const seenHeights = new Set<number>();
  const downloadOptions: DownloadOption[] = [];

  // Video+Audio combined formats (mp4)
  const videoFormats = ytdl.default.filterFormats(info.formats, 'videoandaudio');

  // Sort by bitrate descending
  const sorted = videoFormats
    .filter(f => f.container === 'mp4' && f.height)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  for (const format of sorted) {
    const h = format.height || 0;
    if (seenHeights.has(h)) continue;
    seenHeights.add(h);

    const qualityLabel = h >= 1080 ? '1080p' : h >= 720 ? '720p' : h >= 480 ? '480p' : h >= 360 ? '360p' : `${h}p`;
    const labelSuffix = h >= 1080 ? 'Full HD' : h >= 720 ? 'HD' : h >= 480 ? 'SD' : 'Low';

    downloadOptions.push({
      quality: qualityLabel,
      label: `${qualityLabel} ${labelSuffix}`,
      url: format.url,
      type: 'video',
      filesize: format.contentLength ? parseInt(format.contentLength) : undefined,
      ext: 'mp4',
      width: format.width,
      height: format.height,
    });
  }

  // Audio-only (mp3/m4a)
  const audioFormats = ytdl.default.filterFormats(info.formats, 'audioonly');
  const bestAudio = audioFormats
    .filter(f => f.container === 'm4a' || f.container === 'webm')
    .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];

  if (bestAudio) {
    downloadOptions.push({
      quality: 'Audio',
      label: `MP3 Audio Only (${bestAudio.audioBitrate || '?'}kbps)`,
      url: bestAudio.url,
      type: 'audio',
      filesize: bestAudio.contentLength ? parseInt(bestAudio.contentLength) : undefined,
      ext: 'm4a',
    });
  }

  // Get best thumbnail
  const thumbnails = videoDetails.thumbnails;
  const bestThumb = thumbnails.sort((a: { width?: number }, b: { width?: number }) => (b.width || 0) - (a.width || 0))[0];

  return {
    title: videoDetails.title,
    thumbnailUrl: bestThumb?.url || '',
    platform: 'YouTube',
    duration: videoDetails.lengthSeconds ? parseInt(videoDetails.lengthSeconds) : undefined,
    author: videoDetails.author?.name,
    downloadOptions,
    originalUrl: url,
  };
}

// TikTok Handler 
async function fetchTikTokInfo(url: string, includeWatermark: boolean = false): Promise<VideoInfo> {
  // Use tikwm.com public API - reliable and free
  const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;

  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`TikTok API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.code !== 0 || !data.data) {
    throw new Error(data.msg || 'Failed to fetch TikTok video info');
  }

  const videoData = data.data;
  const downloadOptions: DownloadOption[] = [];

  // HD no-watermark (always include)
  if (videoData.hdplay) {
    downloadOptions.push({
      quality: 'HD',
      label: 'HD – Không watermark',
      url: videoData.hdplay,
      type: 'video',
      ext: 'mp4',
      hasWatermark: false,
    });
  }

  // SD no-watermark
  if (videoData.play) {
    downloadOptions.push({
      quality: 'SD',
      label: 'SD – Không watermark',
      url: videoData.play,
      type: 'video',
      ext: 'mp4',
      hasWatermark: false,
    });
  }

  // With watermark (user-selectable)
  if (includeWatermark && videoData.wmplay) {
    downloadOptions.push({
      quality: 'WM',
      label: 'SD – Có watermark TikTok',
      url: videoData.wmplay,
      type: 'video',
      ext: 'mp4',
      hasWatermark: true,
    });
  }

  // Audio (music)
  if (videoData.music) {
    downloadOptions.push({
      quality: 'Audio',
      label: 'MP3 – Âm thanh',
      url: videoData.music,
      type: 'audio',
      ext: 'mp3',
    });
  }

  return {
    title: videoData.title || 'TikTok Video',
    thumbnailUrl: videoData.cover || videoData.origin_cover || '',
    platform: 'TikTok',
    duration: videoData.duration,
    author: videoData.author?.nickname || videoData.author?.unique_id,
    downloadOptions,
    originalUrl: url,
  };
}

// Facebook Handler
async function fetchFacebookInfo(url: string): Promise<VideoInfo> {
  // Fetch the page HTML and extract video URLs from OG tags / JSON-LD
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml',
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Facebook fetch error: ${response.status}. Có thể video là private.`);
  }

  const html = await response.text();
  const downloadOptions: DownloadOption[] = [];

  // Extract title from OG tags
  const titleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
    || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : 'Facebook Video';

  // Extract thumbnail from OG tags
  const thumbMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
  const thumbnailUrl = thumbMatch ? decodeHtmlEntities(thumbMatch[1]) : '';

  // Extract HD video URL
  const hdPatterns = [
    /hd_src(?:_no_ratelimit)?["\\s]*:["\\s]*"([^"]+)"/,
    /"hd_src":"([^"]+)"/,
    /playable_url_quality_hd\\?":"([^"]+)"/,
    /"browser_native_hd_url":"([^"]+)"/,
  ];

  // Extract SD video URL  
  const sdPatterns = [
    /sd_src(?:_no_ratelimit)?["\\s]*:["\\s]*"([^"]+)"/,
    /"sd_src":"([^"]+)"/,
    /playable_url\\?":"([^"]+)"/,
    /"browser_native_sd_url":"([^"]+)"/,
    /"playable_url":"([^"]+)"/,
  ];

  const findUrl = (patterns: RegExp[], html: string): string | null => {
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return decodeHtmlEntities(match[1]).replace(/\\\//g, '/').replace(/\\u0026/g, '&');
    }
    return null;
  };

  const hdUrl = findUrl(hdPatterns, html);
  const sdUrl = findUrl(sdPatterns, html);

  if (hdUrl) {
    downloadOptions.push({
      quality: '720p',
      label: '720p HD',
      url: hdUrl,
      type: 'video',
      ext: 'mp4',
    });
  }

  if (sdUrl) {
    downloadOptions.push({
      quality: '360p',
      label: '360p SD',
      url: sdUrl,
      type: 'video',
      ext: 'mp4',
    });
  }

  if (downloadOptions.length === 0) {
    throw new Error('Không thể trích xuất link video. Video có thể là private hoặc cần đăng nhập.');
  }

  return {
    title,
    thumbnailUrl,
    platform: 'Facebook',
    downloadOptions,
    originalUrl: url,
  };
}

// Shopee Handler
async function fetchShopeeInfo(url: string): Promise<VideoInfo> {
  // Parse product/item ID from Shopee URL
  // Shopee URLs format: shopee.vn/product-name-i.{shopId}.{itemId}
  const itemMatch = url.match(/i\.(\d+)\.(\d+)/);

  if (!itemMatch) {
    throw new Error('Không thể parse Shopee URL. Vui lòng dùng link sản phẩm dạng shopee.vn/...-i.xxx.xxx');
  }

  const shopId = itemMatch[1];
  const itemId = itemMatch[2];

  // Shopee product API
  const apiUrl = `https://shopee.vn/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`;

  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://shopee.vn/',
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Shopee API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.data?.item) {
    throw new Error('Không tìm thấy sản phẩm Shopee hoặc sản phẩm không có video');
  }

  const item = data.data.item;
  const downloadOptions: DownloadOption[] = [];

  // Check for product video
  if (item.video_info_list && item.video_info_list.length > 0) {
    const videoInfo = item.video_info_list[0];

    // Different quality encodings
    if (videoInfo.default_format?.url) {
      downloadOptions.push({
        quality: 'HD',
        label: 'HD – Chất lượng cao',
        url: videoInfo.default_format.url,
        type: 'video',
        ext: 'mp4',
      });
    }

    if (videoInfo.formats && Array.isArray(videoInfo.formats)) {
      for (const fmt of videoInfo.formats) {
        if (fmt.url && fmt.url !== downloadOptions[0]?.url) {
          downloadOptions.push({
            quality: fmt.definition || 'SD',
            label: `${fmt.definition || 'SD'} – Video sản phẩm`,
            url: fmt.url,
            type: 'video',
            ext: 'mp4',
          });
        }
      }
    }
  }

  // Alternative: check item images for video (some Shopee items have video as image_url_10)
  if (downloadOptions.length === 0 && item.video_info_list?.length > 0) {
    throw new Error('Video Shopee không có thể tải được trực tiếp từ sản phẩm này');
  }

  if (downloadOptions.length === 0) {
    throw new Error('Sản phẩm Shopee này không có video');
  }

  const thumbnail = item.image ? `https://down-vn.img.susercontent.com/file/${item.image}` : '';

  return {
    title: item.name || 'Shopee Video',
    thumbnailUrl: thumbnail,
    platform: 'Shopee',
    author: item.shop_name,
    downloadOptions,
    originalUrl: url,
  };
}

// Utility
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\n/g, '')
    .replace(/\\t/g, '');
}

// Main Route Handler
export async function POST(request: NextRequest) {
  try {
    const body: FetchInfoRequest = await request.json();
    const { url, includeWatermark = false } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ message: 'URL is required' }, { status: 400 });
    }

    const cleanUrl = url.trim();
    const platform = detectPlatform(cleanUrl);

    let videoInfo: VideoInfo;

    switch (platform) {
      case 'YouTube':
        videoInfo = await fetchYouTubeInfo(cleanUrl);
        break;
      case 'TikTok':
        videoInfo = await fetchTikTokInfo(cleanUrl, includeWatermark);
        break;
      case 'Facebook':
        videoInfo = await fetchFacebookInfo(cleanUrl);
        break;
      case 'Shopee':
        videoInfo = await fetchShopeeInfo(cleanUrl);
        break;
      default:
        return NextResponse.json(
          { message: 'Nền tảng không được hỗ trợ. Chỉ hỗ trợ YouTube, TikTok, Facebook và Shopee.' },
          { status: 400 }
        );
    }

    return NextResponse.json(videoInfo);
  } catch (error: unknown) {
    console.error('[fetch-info] Error:', error);
    const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy thông tin video';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
