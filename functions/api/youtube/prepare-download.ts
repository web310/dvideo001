// Cloudflare Pages Function for /api/youtube/prepare-download
export async function onRequestPost(context: any) {
  try {
    let body: any = {};
    try {
      body = await context.request.json();
    } catch {
      body = {};
    }

    const { id, format = 'mp4', resolution = '1080p', type = 'video', title = 'video' } = body;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing Video ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const cleanTitle = (title || 'video').replace(/[\\/:*?"<>|]/g, '_').trim();
    let fmt = (type === 'audio' ? format : resolution).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (fmt.includes('1080')) fmt = '1080';
    else if (fmt.includes('720')) fmt = '720';
    else if (fmt.includes('480')) fmt = '480';
    else if (fmt.includes('360')) fmt = '360';
    else if (fmt.includes('1440') || fmt.includes('2k')) fmt = '1440';
    else if (fmt.includes('2160') || fmt.includes('4k')) fmt = '4k';
    else if (['mp3', 'm4a', 'flac', 'wav', 'opus'].includes(fmt)) {
      // keep
    } else {
      fmt = '720';
    }

    const watchUrl = `https://www.youtube.com/watch?v=${id}`;
    let downloadUrl: string | null = null;

    try {
      const initUrl = `https://loader.to/ajax/download.php?button=1&start=1&end=1&format=${fmt}&url=${encodeURIComponent(watchUrl)}`;
      const initRes = await fetch(initUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });

      if (initRes.ok) {
        const initData: any = await initRes.json();
        const progressUrl = initData.progress_url;
        if (progressUrl) {
          for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 1200));
            const pRes = await fetch(progressUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (!pRes.ok) continue;
            const pData: any = await pRes.json();
            if (pData.download_url) {
              downloadUrl = pData.download_url;
              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Loader.to fetch error in Cloudflare function:', e);
    }

    if (downloadUrl) {
      return new Response(JSON.stringify({
        success: true,
        downloadUrl,
        filename: `${cleanTitle}.${format.toLowerCase()}`,
        resolution: type === 'video' ? resolution : undefined,
        format: format.toUpperCase()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Direct high-speed stream could not be converted automatically. Please use the verified gateway links or Web Live Record mode.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Stream preparation error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
