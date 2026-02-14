/**
 * GoSpeed 通用视频提取器扩展
 * 功能：输入任意网站URL，自动抓取页面中的所有视频链接
 * 支持格式：MP4, WebM, M3U8, MPD等
 */

gopeed.events.onResolve(async function (ctx) {
  const url = ctx.req.url;
  
  // 验证URL
  if (!url || !url.startsWith('http')) {
    return;
  }
  
  // 获取页面内容
  const resp = await fetch(url, {
    headers: {
      'User-Agent': gopeed.settings.ua,
    },
  });
  
  const html = await resp.text();
  
  if (!html) {
    return;
  }
  
  // 提取视频链接
  const files = [];
  const seen = new Set();
  
  // 1. 提取video标签中的视频
  const videoRegex = /<video[^>]*src=["']([^"']+)["']/gi;
  let match;
  while ((match = videoRegex.exec(html)) !== null) {
    const videoUrl = resolveUrl(match[1], url);
    if (videoUrl && !seen.has(videoUrl)) {
      seen.add(videoUrl);
      files.push({
        name: extractName(videoUrl),
        size: -1,
        req: {
          url: videoUrl
        }
      });
    }
  }
  
  // 2. 提取source标签中的视频
  const sourceRegex = /<source[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((match = sourceRegex.exec(html)) !== null) {
    const videoUrl = resolveUrl(match[1], url);
    if (videoUrl && isVideoUrl(videoUrl) && !seen.has(videoUrl)) {
      seen.add(videoUrl);
      files.push({
        name: extractName(videoUrl),
        size: -1,
        req: {
          url: videoUrl
        }
      });
    }
  }
  
  // 3. 提取M3U8链接
  const m3u8Regex = /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi;
  while ((match = m3u8Regex.exec(html)) !== null) {
    const videoUrl = match[1];
    if (!seen.has(videoUrl)) {
      seen.add(videoUrl);
      files.push({
        name: 'HLS视频流.m3u8',
        size: -1,
        req: {
          url: videoUrl
        }
      });
    }
  }
  
  // 4. 提取MPD链接
  const mpdRegex = /["'](https?:\/\/[^"']+\.mpd[^"']*)["']/gi;
  while ((match = mpdRegex.exec(html)) !== null) {
    const videoUrl = match[1];
    if (!seen.has(videoUrl)) {
      seen.add(videoUrl);
      files.push({
        name: 'DASH视频流.mpd',
        size: -1,
        req: {
          url: videoUrl
        }
      });
    }
  }
  
  // 5. 提取MP4等直接视频链接
  const mp4Regex = /["'](https?:\/\/[^"']+\.(?:mp4|webm|avi|mov|flv|mkv)(?:\?[^"']*)?)["']/gi;
  while ((match = mp4Regex.exec(html)) !== null) {
    const videoUrl = match[1];
    if (!seen.has(videoUrl)) {
      seen.add(videoUrl);
      files.push({
        name: extractName(videoUrl),
        size: -1,
        req: {
          url: videoUrl
        }
      });
    }
  }
  
  // 只有找到视频才返回结果
  if (files.length > 0) {
    // 提取页面标题
    let title = '视频资源';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    ctx.res = {
      name: title,
      files: files
    };
  }
});

/**
 * 解析URL为绝对路径
 */
function resolveUrl(href, baseUrl) {
  if (!href) return null;
  try {
    if (href.startsWith('//')) {
      return 'https:' + href;
    }
    if (href.startsWith('http')) {
      return href;
    }
    return new URL(href, baseUrl).href;
  } catch (e) {
    return null;
  }
}

/**
 * 检查是否为视频URL
 */
function isVideoUrl(url) {
  if (!url) return false;
  const exts = ['.mp4', '.webm', '.m3u8', '.mpd', '.avi', '.mov', '.flv', '.mkv', '.ts'];
  const lower = url.toLowerCase();
  return exts.some(ext => lower.includes(ext));
}

/**
 * 从URL提取文件名
 */
function extractName(url) {
  try {
    const path = new URL(url).pathname;
    const name = path.split('/').pop();
    return name || '视频文件';
  } catch (e) {
    return '视频文件';
  }
}
