/**
 * GoSpeed 通用视频提取器扩展
 * @version 1.0.3
 * 支持Cloudflare保护的网站
 */

gopeed.events.onResolve(async function (ctx) {
  const url = ctx.req.url;
  
  if (!url) return;
  
  // 如果是直接的视频URL
  if (/\.(mp4|webm|m3u8|mpd)(\?|$)/i.test(url)) {
    const name = url.split('/').pop().split('?')[0];
    ctx.res = {
      name: name,
      files: [{
        name: name,
        size: -1,
        req: { url: url },
      }],
    };
    return;
  }
  
  try {
    const urlObj = new URL(url);
    
    // 获取页面内容
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
      },
    });
    
    if (!resp.ok) {
      console.error('HTTP Error:', resp.status);
      return;
    }
    
    const html = await resp.text();
    if (!html || html.length < 100) {
      console.error('Empty response');
      return;
    }
    
    const files = [];
    const seen = new Set();
    
    // 匹配视频URL
    const patterns = [
      // M3U8 - 最常见
      /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
      // MPD
      /["'](https?:\/\/[^"']+\.mpd[^"']*)["']/gi,
      // MP4等
      /["'](https?:\/\/[^"']+\.(?:mp4|webm|avi|mov|flv|mkv)(?:\?[^"']*)?)["']/gi,
      // TS分段
      /["'](https?:\/\/[^"']+\.ts(?:\?[^"']*)?)["']/gi,
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let videoUrl = match[1];
        
        // 清理URL
        videoUrl = videoUrl.replace(/\\/g, '');
        
        if (!seen.has(videoUrl)) {
          seen.add(videoUrl);
          
          // 提取文件名
          let name = 'video_' + files.length + '.mp4';
          try {
            const path = new URL(videoUrl).pathname;
            const filename = path.split('/').pop();
            if (filename && filename.includes('.')) {
              name = decodeURIComponent(filename);
            }
          } catch (e) {}
          
          // 根据扩展名调整名称
          if (videoUrl.includes('.m3u8')) {
            name = name.replace(/\.[^.]+$/, '.m3u8');
          } else if (videoUrl.includes('.mpd')) {
            name = name.replace(/\.[^.]+$/, '.mpd');
          }
          
          files.push({
            name: name,
            size: -1,
            req: { 
              url: videoUrl,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': urlObj.origin + '/',
                'Accept': '*/*',
                'Accept-Language': 'zh-CN,zh;q=0.9',
              },
            },
          });
        }
      }
    }
    
    // 提取video/source标签
    const tagPatterns = [
      /<video[^>]*src=["']([^"']+)["']/gi,
      /<source[^>]*src=["']([^"']+)["']/gi,
    ];
    
    for (const pattern of tagPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let videoUrl = match[1];
        
        if (videoUrl.startsWith('//')) {
          videoUrl = 'https:' + videoUrl;
        } else if (videoUrl.startsWith('/')) {
          videoUrl = urlObj.origin + videoUrl;
        }
        
        if (!seen.has(videoUrl) && videoUrl.startsWith('http')) {
          seen.add(videoUrl);
          files.push({
            name: 'video_' + files.length + '.mp4',
            size: -1,
            req: { 
              url: videoUrl,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': url,
              },
            },
          });
        }
      }
    }
    
    if (files.length > 0) {
      let title = '视频资源';
      const m = html.match(/<title>([^<]+)<\/title>/i);
      if (m) title = m[1].trim().substring(0, 50);
      
      ctx.res = { name: title, files: files };
    }
  } catch (e) {
    console.error('解析错误:', e.message);
  }
});
