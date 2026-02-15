/**
 * GoSpeed 通用视频提取器扩展
 * @version 1.0.1
 * @description 输入任意网站URL，自动抓取页面中的所有视频链接
 * 
 * 更新日志:
 * v1.0.1 - 修复manifest.json格式，优化视频URL匹配
 * v1.0.0 - 初始版本
 */

gopeed.events.onResolve(async function (ctx) {
  const url = ctx.req.url;
  
  // 简单验证
  if (!url) return;
  
  // 如果是直接的视频URL，直接返回
  if (/\.(mp4|webm|m3u8|mpd)(\?|$)/i.test(url)) {
    const name = url.split('/').pop().split('?')[0];
    ctx.res = {
      name: name,
      files: [{
        name: name,
        size: -1,
        req: {
          url: url,
        },
      }],
    };
    return;
  }
  
  // 获取页面内容
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  
  const html = await resp.text();
  if (!html) return;
  
  const files = [];
  const seen = new Set();
  
  // 匹配所有视频URL
  const patterns = [
    /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /["'](https?:\/\/[^"']+\.mpd[^"']*)["']/gi,
    /["'](https?:\/\/[^"']+\.(?:mp4|webm|avi|mov|flv|mkv)(?:\?[^"']*)?)["']/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const videoUrl = match[1];
      if (!seen.has(videoUrl)) {
        seen.add(videoUrl);
        // 提取文件名
        let name = 'video_' + files.length;
        try {
          name = new URL(videoUrl).pathname.split('/').pop() || 'video_' + files.length;
        } catch (e) {}
        
        files.push({
          name: name,
          size: -1,
          req: {
            url: videoUrl,
          },
        });
      }
    }
  }
  
  if (files.length > 0) {
    let title = '视频资源';
    const m = html.match(/<title>([^<]+)<\/title>/i);
    if (m) title = m[1].trim();
    
    ctx.res = {
      name: title,
      files: files,
    };
  }
});
