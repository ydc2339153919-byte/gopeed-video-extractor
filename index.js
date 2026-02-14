/**
 * GoSpeed 通用视频提取器扩展
 * 功能：输入任意网站URL，自动抓取页面中的所有视频链接
 * 支持格式：MP4, WebM, M3U8, MPD, AVI, MOV, FLV, MKV等
 */

// 视频文件扩展名列表
const VIDEO_EXTENSIONS = [
  '.mp4', '.webm', '.m3u8', '.mpd', '.avi', '.mov', 
  '.flv', '.mkv', '.wmv', '.m4v', '.ogv', '.ts', 
  '.m4s', '.f4v', '.3gp', '.3g2'
];

// 视频MIME类型列表
const VIDEO_MIME_TYPES = [
  'video/mp4', 'video/webm', 'video/x-m4v', 'video/quicktime',
  'video/x-msvideo', 'video/x-flv', 'video/x-matroska',
  'application/x-mpegURL', 'application/vnd.apple.mpegurl',
  'application/dash+xml', 'video/MP2T', 'video/ogg'
];

// 常见视频域名关键词
const VIDEO_DOMAIN_KEYWORDS = [
  'video', 'stream', 'play', 'media', 'cdn', 'vod',
  'm3u8', 'mp4', 'hls', 'dash', 'blob'
];

/**
 * 扩展主入口函数
 * @param {object} ctx - GoSpeed扩展上下文
 * @param {object} ctx.req - 请求对象
 * @param {string} ctx.req.url - 用户输入的URL
 */
function resolve(ctx) {
  const url = ctx.req.url;
  
  // 验证URL格式
  if (!isValidUrl(url)) {
    ctx.error('请输入有效的URL地址');
    return;
  }
  
  // 获取页面内容
  const html = fetchPage(url);
  
  if (!html) {
    ctx.error('无法获取页面内容，请检查URL是否可访问');
    return;
  }
  
  // 提取视频链接
  const videos = extractVideos(html, url);
  
  if (videos.length === 0) {
    ctx.error('未在页面中找到视频资源');
    return;
  }
  
  // 去重并格式化结果
  const uniqueVideos = deduplicateVideos(videos);
  
  // 返回解析结果
  ctx.res = {
    name: extractPageTitle(html) || '视频资源',
    files: uniqueVideos.map((video, index) => ({
      name: video.name || `视频_${index + 1}`,
      size: video.size || -1,
      url: video.url,
      type: video.type || 'video',
      ext: video.ext || guessExtension(video.url)
    }))
  };
}

/**
 * 验证URL是否有效
 * @param {string} url - 待验证的URL
 * @returns {boolean}
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch (e) {
    return false;
  }
}

/**
 * 获取页面HTML内容
 * @param {string} url - 页面URL
 * @returns {string|null} HTML内容
 */
function fetchPage(url) {
  try {
    const response = http.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    });
    
    if (response.statusCode === 200) {
      return response.body;
    }
    return null;
  } catch (e) {
    console.error('获取页面失败:', e.message);
    return null;
  }
}

/**
 * 从HTML中提取视频链接
 * @param {string} html - HTML内容
 * @param {string} baseUrl - 基础URL用于解析相对路径
 * @returns {Array} 视频信息数组
 */
function extractVideos(html, baseUrl) {
  const videos = [];
  const base = new URL(baseUrl);
  
  // 1. 提取<video>标签中的视频
  extractVideoTags(html, base).forEach(v => videos.push(v));
  
  // 2. 提取<source>标签中的视频
  extractSourceTags(html, base).forEach(v => videos.push(v));
  
  // 3. 提取<iframe>嵌入的视频
  extractIframeVideos(html, base).forEach(v => videos.push(v));
  
  // 4. 提取JavaScript中的视频URL
  extractJsVideos(html, base).forEach(v => videos.push(v));
  
  // 5. 提取a标签中的视频链接
  extractAnchorVideos(html, base).forEach(v => videos.push(v));
  
  // 6. 提取M3U8播放列表
  extractM3U8Playlists(html, base).forEach(v => videos.push(v));
  
  // 7. 提取DASH MPD播放列表
  extractDASHManifests(html, base).forEach(v => videos.push(v));
  
  // 8. 提取Blob URL相关视频
  extractBlobVideos(html, base).forEach(v => videos.push(v));
  
  return videos;
}

/**
 * 提取<video>标签中的视频
 */
function extractVideoTags(html, base) {
  const videos = [];
  const videoRegex = /<video[^>]*>([\s\S]*?)<\/video>/gi;
  const srcRegex = /src=["']([^"']+)["']/gi;
  const posterRegex = /poster=["']([^"']+)["']/i;
  
  let match;
  while ((match = videoRegex.exec(html)) !== null) {
    const videoTag = match[0];
    const videoContent = match[1];
    
    // 提取src属性
    let srcMatch;
    while ((srcMatch = srcRegex.exec(videoTag)) !== null) {
      const src = resolveUrl(srcMatch[1], base);
      if (src && isVideoUrl(src)) {
        videos.push({
          url: src,
          name: extractNameFromUrl(src),
          type: 'video',
          ext: guessExtension(src)
        });
      }
    }
    
    // 检查video标签内的source标签
    const sourceRegex = /<source[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let sourceMatch;
    while ((sourceMatch = sourceRegex.exec(videoContent)) !== null) {
      const src = resolveUrl(sourceMatch[1], base);
      if (src && isVideoUrl(src)) {
        videos.push({
          url: src,
          name: extractNameFromUrl(src),
          type: 'video',
          ext: guessExtension(src)
        });
      }
    }
  }
  
  return videos;
}

/**
 * 提取<source>标签中的视频
 */
function extractSourceTags(html, base) {
  const videos = [];
  const sourceRegex = /<source[^>]*src=["']([^"']+)["'][^>]*(?:type=["']([^"']+)["'])?[^>]*>/gi;
  
  let match;
  while ((match = sourceRegex.exec(html)) !== null) {
    const src = resolveUrl(match[1], base);
    const type = match[2] || '';
    
    if (src && (isVideoUrl(src) || isVideoMimeType(type))) {
      videos.push({
        url: src,
        name: extractNameFromUrl(src),
        type: 'video',
        ext: guessExtension(src) || guessExtFromMime(type)
      });
    }
  }
  
  return videos;
}

/**
 * 提取<iframe>嵌入的视频
 */
function extractIframeVideos(html, base) {
  const videos = [];
  const iframeRegex = /<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi;
  
  let match;
  while ((match = iframeRegex.exec(html)) !== null) {
    const src = resolveUrl(match[1], base);
    
    if (src && isVideoEmbedUrl(src)) {
      videos.push({
        url: src,
        name: '嵌入视频',
        type: 'iframe',
        ext: 'html'
      });
    }
  }
  
  return videos;
}

/**
 * 提取JavaScript中的视频URL
 */
function extractJsVideos(html, base) {
  const videos = [];
  
  // 匹配常见的视频URL模式
  const patterns = [
    // 标准URL格式
    /["'](https?:\/\/[^"']+\.(?:mp4|webm|m3u8|mpd|avi|mov|flv|mkv)(?:\?[^"']*)?)["']/gi,
    // videoUrl: "xxx" 格式
    /videoUrl\s*[:=]\s*["']([^"']+)["']/gi,
    // video_url: "xxx" 格式
    /video_url\s*[:=]\s*["']([^"']+)["']/gi,
    // playUrl: "xxx" 格式
    /playUrl\s*[:=]\s*["']([^"']+)["']/gi,
    // src: "xxx.mp4" 格式
    /src\s*[:=]\s*["'](https?:\/\/[^"']+)["']/gi,
    // JSON中的url字段
    /"url"\s*:\s*"([^"]+)"/gi,
    // 带有video关键字的URL
    /["'](https?:\/\/[^"']*(?:video|stream|play|media|cdn)[^"']*\.(?:mp4|webm|m3u8|ts)[^"']*)["']/gi
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1];
      const resolvedUrl = resolveUrl(url, base);
      
      if (resolvedUrl && isVideoUrl(resolvedUrl)) {
        videos.push({
          url: resolvedUrl,
          name: extractNameFromUrl(resolvedUrl),
          type: 'video',
          ext: guessExtension(resolvedUrl)
        });
      }
    }
  });
  
  return videos;
}

/**
 * 提取a标签中的视频链接
 */
function extractAnchorVideos(html, base) {
  const videos = [];
  const anchorRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = resolveUrl(match[1], base);
    const text = match[2].trim();
    
    if (href && isVideoUrl(href)) {
      videos.push({
        url: href,
        name: text || extractNameFromUrl(href),
        type: 'video',
        ext: guessExtension(href)
      });
    }
  }
  
  return videos;
}

/**
 * 提取M3U8播放列表
 */
function extractM3U8Playlists(html, base) {
  const videos = [];
  const m3u8Regex = /["'](https?:\/\/[^"']+\.m3u8(?:\?[^"']*)?)["']/gi;
  
  let match;
  while ((match = m3u8Regex.exec(html)) !== null) {
    const url = resolveUrl(match[1], base);
    if (url) {
      videos.push({
        url: url,
        name: extractNameFromUrl(url) || 'HLS视频流',
        type: 'hls',
        ext: 'm3u8'
      });
    }
  }
  
  return videos;
}

/**
 * 提取DASH MPD播放列表
 */
function extractDASHManifests(html, base) {
  const videos = [];
  const mpdRegex = /["'](https?:\/\/[^"']+\.mpd(?:\?[^"']*)?)["']/gi;
  
  let match;
  while ((match = mpdRegex.exec(html)) !== null) {
    const url = resolveUrl(match[1], base);
    if (url) {
      videos.push({
        url: url,
        name: extractNameFromUrl(url) || 'DASH视频流',
        type: 'dash',
        ext: 'mpd'
      });
    }
  }
  
  return videos;
}

/**
 * 提取Blob URL相关视频信息
 */
function extractBlobVideos(html, base) {
  const videos = [];
  
  // 查找blob: URL
  const blobRegex = /["'](blob:[^"']+)["']/gi;
  let match;
  while ((match = blobRegex.exec(html)) !== null) {
    videos.push({
      url: match[1],
      name: 'Blob视频流',
      type: 'blob',
      ext: 'unknown',
      note: 'Blob URL需要在浏览器环境中解析'
    });
  }
  
  // 查找MediaSource相关代码
  const mediaSourceRegex = /MediaSource|createObjectURL|appendBuffer/gi;
  if (mediaSourceRegex.test(html)) {
    // 尝试提取相关的分段视频URL
    const segmentRegex = /["'](https?:\/\/[^"']+\.ts(?:\?[^"']*)?)["']/gi;
    while ((match = segmentRegex.exec(html)) !== null) {
      const url = resolveUrl(match[1], base);
      if (url) {
        videos.push({
          url: url,
          name: extractNameFromUrl(url) || '视频分段',
          type: 'segment',
          ext: 'ts'
        });
      }
    }
  }
  
  return videos;
}

/**
 * 解析相对URL为绝对URL
 */
function resolveUrl(url, base) {
  if (!url) return null;
  
  try {
    // 处理协议相对URL
    if (url.startsWith('//')) {
      return base.protocol + url;
    }
    
    // 处理绝对URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // 处理相对URL
    if (url.startsWith('/')) {
      return base.origin + url;
    } else {
      return new URL(url, base.href).href;
    }
  } catch (e) {
    return null;
  }
}

/**
 * 检查URL是否为视频URL
 */
function isVideoUrl(url) {
  if (!url) return false;
  
  const lowerUrl = url.toLowerCase();
  
  // 检查扩展名
  for (const ext of VIDEO_EXTENSIONS) {
    if (lowerUrl.includes(ext) || lowerUrl.endsWith(ext)) {
      return true;
    }
  }
  
  // 检查视频关键词
  for (const keyword of VIDEO_DOMAIN_KEYWORDS) {
    if (lowerUrl.includes(keyword)) {
      // 进一步验证是否有视频扩展名或参数
      if (/\.(mp4|webm|m3u8|mpd|ts|flv)/i.test(url) || 
          /[?&](video|stream|format|quality)=/i.test(url)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 检查MIME类型是否为视频
 */
function isVideoMimeType(mimeType) {
  if (!mimeType) return false;
  return VIDEO_MIME_TYPES.some(type => 
    mimeType.toLowerCase().includes(type.toLowerCase())
  );
}

/**
 * 检查是否为视频嵌入URL
 */
function isVideoEmbedUrl(url) {
  if (!url) return false;
  
  const videoEmbedPatterns = [
    /youtube\.com\/embed/i,
    /youtube-nocookie\.com\/embed/i,
    /player\.vimeo\.com/i,
    /vimeo\.com\/video/i,
    /dailymotion\.com\/embed/i,
    /youku\.com\/embed/i,
    /bilibili\.com\/player/i,
    /player\.bilibili\.com/i,
    /iqiyi\.com\/.*player/i,
    /v\.qq\.com\/.*player/i,
    /tv\.sohu\.com\/.*player/i,
    /video\.tudou\.com/i
  ];
  
  return videoEmbedPatterns.some(pattern => pattern.test(url));
}

/**
 * 从URL提取文件名
 */
function extractNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    
    if (filename && filename.includes('.')) {
      return decodeURIComponent(filename);
    }
    
    // 尝试从查询参数获取名称
    const title = urlObj.searchParams.get('title') || 
                  urlObj.searchParams.get('name') ||
                  urlObj.searchParams.get('filename');
    if (title) {
      return decodeURIComponent(title);
    }
    
    return '视频_' + Date.now();
  } catch (e) {
    return '视频_' + Date.now();
  }
}

/**
 * 从URL猜测文件扩展名
 */
function guessExtension(url) {
  if (!url) return 'mp4';
  
  const lowerUrl = url.toLowerCase();
  
  for (const ext of VIDEO_EXTENSIONS) {
    if (lowerUrl.includes(ext) || lowerUrl.endsWith(ext.split('?')[0])) {
      return ext.replace('.', '');
    }
  }
  
  // 从MIME类型参数猜测
  const mimeMatch = url.match(/[?&]mime=(?:video%2F)?(\w+)/i);
  if (mimeMatch) {
    return mimeMatch[1];
  }
  
  return 'mp4';
}

/**
 * 从MIME类型猜测扩展名
 */
function guessExtFromMime(mimeType) {
  if (!mimeType) return 'mp4';
  
  const mimeMap = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/x-m4v': 'm4v',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/x-flv': 'flv',
    'video/x-matroska': 'mkv',
    'application/x-mpegURL': 'm3u8',
    'application/vnd.apple.mpegurl': 'm3u8',
    'application/dash+xml': 'mpd',
    'video/MP2T': 'ts',
    'video/ogg': 'ogv'
  };
  
  const normalizedMime = mimeType.toLowerCase().split(';')[0].trim();
  return mimeMap[normalizedMime] || 'mp4';
}

/**
 * 提取页面标题
 */
function extractPageTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * 视频去重
 */
function deduplicateVideos(videos) {
  const seen = new Map();
  
  return videos.filter(video => {
    const key = video.url;
    if (seen.has(key)) {
      return false;
    }
    seen.set(key, true);
    return true;
  });
}

// 导出扩展
module.exports = {
  resolve
};
