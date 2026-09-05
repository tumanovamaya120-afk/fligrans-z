import express from "express";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { Readable } from "stream";
import { createServer as createViteServer } from "vite";
// @ts-ignore
import { ttdl, youtube, igdl, aio } from "btch-downloader";

const execFileAsync = promisify(execFile);

interface DownloadOption {
  id: string;
  label: string;
  quality: string;
  format: "mp4" | "mp3";
  url: string;
  size?: string;
  type: "video" | "audio";
  isHD?: boolean;
  isWatermarkFree?: boolean;
}

interface NormalizedVideo {
  id: string;
  platform: "instagram" | "tiktok" | "youtube";
  title: string;
  author: string;
  authorUrl?: string;
  thumbnail: string;
  duration?: string;
  originalUrl: string;
  downloads: DownloadOption[];
  previewUrl?: string;
  timestamp: number;
}

function detectPlatform(url: string): "instagram" | "tiktok" | "youtube" | "unknown" {
  const lower = url.toLowerCase();
  if (lower.includes("instagram.com") || lower.includes("instagr.am")) {
    return "instagram";
  }
  if (lower.includes("tiktok.com") || lower.includes("tiktokv.com") || lower.includes("douyin.com")) {
    return "tiktok";
  }
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return "youtube";
  }
  return "unknown";
}

async function resolveRedirectUrl(rawUrl: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(rawUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeout);
    return response.url || rawUrl;
  } catch {
    return rawUrl;
  }
}

// -------------------------------------------------------------
// TIKTOK EXTRACTOR
// -------------------------------------------------------------
async function extractTikTok(url: string): Promise<NormalizedVideo> {
  const targetUrl = await resolveRedirectUrl(url);

  // 1. Try btch-downloader ttdl
  try {
    const res = await ttdl(targetUrl);
    if (res && res.status && (res.video?.length || res.audio?.length)) {
      const downloads: DownloadOption[] = [];
      const videoLinks = Array.isArray(res.video) ? res.video : res.video ? [res.video] : [];
      const audioLinks = Array.isArray(res.audio) ? res.audio : res.audio ? [res.audio] : [];

      videoLinks.forEach((vUrl: string, idx: number) => {
        if (vUrl) {
          downloads.push({
            id: `tt-video-${idx}`,
            label: idx === 0 ? "HD Video (Filigransız)" : `Video Alternatif ${idx + 1}`,
            quality: "1080p / 720p HD",
            format: "mp4",
            url: vUrl,
            type: "video",
            isHD: true,
            isWatermarkFree: true,
          });
        }
      });

      audioLinks.forEach((aUrl: string, idx: number) => {
        if (aUrl) {
          downloads.push({
            id: `tt-audio-${idx}`,
            label: "Orijinal Ses / MP3",
            quality: "320kbps",
            format: "mp3",
            url: aUrl,
            type: "audio",
          });
        }
      });

      if (downloads.length > 0) {
        return {
          id: `tiktok-${Date.now()}`,
          platform: "tiktok",
          title: (res as any).title || "TikTok Videosu",
          author: (res as any).author || "TikTok Kullanıcısı",
          thumbnail: (res as any).thumbnail || "",
          originalUrl: url,
          downloads,
          previewUrl: downloads[0]?.url,
          timestamp: Date.now(),
        };
      }
    }
  } catch (err) {
    console.warn("TikTok ttdl error:", err);
  }

  // 2. Try snapsave-media-downloader
  try {
    const { snapsave } = await import("snapsave-media-downloader");
    const snapRes = await snapsave(targetUrl);
    if (snapRes && snapRes.success && snapRes.data?.media?.length) {
      const downloads: DownloadOption[] = snapRes.data.media.map((item: any, idx: number) => ({
        id: `snap-tt-${idx}`,
        label: item.quality ? `Video ${item.quality}` : `HD Video ${idx + 1}`,
        quality: item.quality || "HD",
        format: "mp4",
        url: item.url,
        type: "video",
        isHD: true,
        isWatermarkFree: true,
      }));

      return {
        id: `tiktok-${Date.now()}`,
        platform: "tiktok",
        title: snapRes.data.description || "TikTok Videosu",
        author: "TikTok",
        thumbnail: snapRes.data.preview || "",
        originalUrl: url,
        downloads,
        previewUrl: downloads[0]?.url,
        timestamp: Date.now(),
      };
    }
  } catch (err) {
    console.warn("TikTok snapsave error:", err);
  }

  // 3. Try TikWM public API
  try {
    const formParams = new URLSearchParams();
    formParams.append("url", targetUrl);
    formParams.append("count", "12");
    formParams.append("cursor", "0");
    formParams.append("web", "1");
    formParams.append("hd", "1");

    const tikwmRes = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
      body: formParams.toString(),
    });

    const tikwmData = await tikwmRes.json();
    if (tikwmData && tikwmData.code === 0 && tikwmData.data) {
      const d = tikwmData.data;
      const downloads: DownloadOption[] = [];

      if (d.hdplay || d.play) {
        downloads.push({
          id: "tikwm-hd",
          label: "HD Video (Filigransız)",
          quality: "HD 1080p",
          format: "mp4",
          url: d.hdplay ? `https://www.tikwm.com${d.hdplay}` : `https://www.tikwm.com${d.play}`,
          type: "video",
          isHD: true,
          isWatermarkFree: true,
        });
      }

      if (d.play && d.hdplay) {
        downloads.push({
          id: "tikwm-sd",
          label: "Standart Video (Filigransız)",
          quality: "SD 720p",
          format: "mp4",
          url: `https://www.tikwm.com${d.play}`,
          type: "video",
          isWatermarkFree: true,
        });
      }

      if (d.music) {
        downloads.push({
          id: "tikwm-music",
          label: "Müzik / Ses (MP3)",
          quality: "320kbps",
          format: "mp3",
          url: d.music.startsWith("http") ? d.music : `https://www.tikwm.com${d.music}`,
          type: "audio",
        });
      }

      if (downloads.length > 0) {
        return {
          id: `tiktok-${Date.now()}`,
          platform: "tiktok",
          title: d.title || "TikTok Videosu",
          author: d.author?.nickname || d.author?.unique_id || "TikTok Kullanıcısı",
          authorUrl: d.author?.unique_id ? `https://www.tiktok.com/@${d.author.unique_id}` : undefined,
          thumbnail: d.cover ? (d.cover.startsWith("http") ? d.cover : `https://www.tikwm.com${d.cover}`) : "",
          duration: d.duration ? `${d.duration}s` : undefined,
          originalUrl: url,
          downloads,
          previewUrl: downloads[0]?.url,
          timestamp: Date.now(),
        };
      }
    }
  } catch (err) {
    console.warn("TikTok TikWM error:", err);
  }

  throw new Error("TikTok videosu bulunamadı veya bağlantı gizli/geçersiz.");
}

// -------------------------------------------------------------
// YOUTUBE SHORTS EXTRACTOR
// -------------------------------------------------------------
async function extractYouTube(url: string): Promise<NormalizedVideo> {
  const targetUrl = await resolveRedirectUrl(url);

  // 1. Try btch-downloader youtube
  try {
    const res = await youtube(targetUrl);
    if (res && res.status && (res.mp4 || res.mp3)) {
      const downloads: DownloadOption[] = [];

      if (res.mp4) {
        downloads.push({
          id: "yt-mp4-hd",
          label: "MP4 Video (HD Kalite)",
          quality: "1080p / 720p HD",
          format: "mp4",
          url: res.mp4,
          type: "video",
          isHD: true,
        });
      }

      if (res.mp3) {
        downloads.push({
          id: "yt-mp3",
          label: "MP3 Ses Dosyası",
          quality: "Yüksek Kalite Ses",
          format: "mp3",
          url: res.mp3,
          type: "audio",
        });
      }

      return {
        id: `yt-${Date.now()}`,
        platform: "youtube",
        title: res.title || "YouTube Shorts",
        author: res.author || "YouTube Kanalı",
        thumbnail: res.thumbnail || "",
        originalUrl: url,
        downloads,
        previewUrl: res.mp4,
        timestamp: Date.now(),
      };
    }
  } catch (err) {
    console.warn("YouTube btch error:", err);
  }

  // 2. Try cobalt / invidious fallback
  try {
    const videoIdMatch = targetUrl.match(/(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (videoId) {
      // Invidious API
      const invidiousInstances = [
        "https://inv.nadeko.net",
        "https://invidious.nerdvpn.de",
        "https://invidious.f5.si",
      ];

      for (const inst of invidiousInstances) {
        try {
          const invRes = await fetch(`${inst}/api/v1/videos/${videoId}`, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(4000),
          });
          if (invRes.ok) {
            const data = await invRes.json();
            const streams = data.formatStreams || [];
            if (streams.length > 0) {
              const downloads: DownloadOption[] = streams.map((s: any, idx: number) => ({
                id: `inv-${idx}`,
                label: `MP4 Video (${s.qualityLabel || s.resolution || "HD"})`,
                quality: s.qualityLabel || s.resolution || "HD",
                format: "mp4",
                url: s.url,
                type: "video",
                isHD: true,
              }));

              return {
                id: `yt-${Date.now()}`,
                platform: "youtube",
                title: data.title || "YouTube Shorts",
                author: data.author || "YouTube",
                thumbnail: data.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                originalUrl: url,
                downloads,
                previewUrl: downloads[0]?.url,
                timestamp: Date.now(),
              };
            }
          }
        } catch {
          // continue to next instance
        }
      }
    }
  } catch (err) {
    console.warn("YouTube invidious error:", err);
  }

  throw new Error("YouTube Shorts videosu bulunamadı. Lütfen geçerli bir YouTube Shorts linki girin.");
}

// -------------------------------------------------------------
// INSTAGRAM EXTRACTOR
// -------------------------------------------------------------
async function extractInstagram(url: string): Promise<NormalizedVideo> {
  const targetUrl = await resolveRedirectUrl(url);

  // 1. Try python parth_dl helper
  try {
    const scriptPath = path.join(process.cwd(), "server", "get_instagram.py");
    const { stdout } = await execFileAsync("python3", [scriptPath, targetUrl], {
      timeout: 10000,
      env: { ...process.env, PYTHONPATH: process.cwd() },
    });

    const parsed = JSON.parse(stdout.trim());
    if (parsed.success && parsed.data) {
      const data = parsed.data;
      const downloads: DownloadOption[] = [];
      const entries = data.entries || [data];

      entries.forEach((entry: any, idx: number) => {
        const formats = entry.formats || [];
        const videoFormat = formats.find((f: any) => f.kind === "video") || formats[0];
        const mediaUrl = videoFormat?.url || entry.url;

        if (mediaUrl) {
          downloads.push({
            id: `ig-${idx}`,
            label: entry.kind === "video" || videoFormat?.kind === "video"
              ? (idx === 0 ? "HD Video (Reel / Gönderi)" : `Video Alternatif ${idx + 1}`)
              : `Fotoğraf / Medya ${idx + 1}`,
            quality: videoFormat?.resolution || "1080p HD",
            format: "mp4",
            url: mediaUrl,
            type: "video",
            isHD: true,
          });
        }
      });

      if (downloads.length > 0) {
        return {
          id: `instagram-${Date.now()}`,
          platform: "instagram",
          title: data.caption || data.title || "Instagram Reels / Gönderi",
          author: data.username ? `@${data.username}` : "Instagram Kullanıcısı",
          authorUrl: data.username ? `https://www.instagram.com/${data.username}` : undefined,
          thumbnail: data.thumbnail || downloads[0]?.url || "",
          originalUrl: url,
          downloads,
          previewUrl: downloads[0]?.url,
          timestamp: Date.now(),
        };
      }
    }
  } catch (err) {
    console.warn("Instagram python parth_dl error:", err);
  }

  // 2. Try btch-downloader igdl / aio
  try {
    const res = await igdl(targetUrl);
    if (res && res.status && res.result?.length) {
      const downloads: DownloadOption[] = res.result.map((item: any, idx: number) => ({
        id: `ig-btch-${idx}`,
        label: idx === 0 ? "HD Video (Reel / Gönderi)" : `Medya ${idx + 1}`,
        quality: "1080p HD",
        format: "mp4",
        url: item.url,
        type: "video",
        isHD: true,
      }));

      return {
        id: `instagram-${Date.now()}`,
        platform: "instagram",
        title: "Instagram Reels Videosu",
        author: "Instagram",
        thumbnail: res.result[0]?.thumbnail || "",
        originalUrl: url,
        downloads,
        previewUrl: downloads[0]?.url,
        timestamp: Date.now(),
      };
    }
  } catch (err) {
    console.warn("Instagram btch igdl error:", err);
  }

  // 3. Try snapsave
  try {
    const { snapsave } = await import("snapsave-media-downloader");
    const snapRes = await snapsave(targetUrl);
    if (snapRes && snapRes.success && snapRes.data?.media?.length) {
      const downloads: DownloadOption[] = snapRes.data.media.map((item: any, idx: number) => ({
        id: `snap-ig-${idx}`,
        label: item.quality ? `Video (${item.quality})` : `HD Video ${idx + 1}`,
        quality: item.quality || "HD",
        format: "mp4",
        url: item.url,
        type: "video",
        isHD: true,
      }));

      return {
        id: `instagram-${Date.now()}`,
        platform: "instagram",
        title: snapRes.data.description || "Instagram Reels Videosu",
        author: "Instagram",
        thumbnail: snapRes.data.preview || "",
        originalUrl: url,
        downloads,
        previewUrl: downloads[0]?.url,
        timestamp: Date.now(),
      };
    }
  } catch (err) {
    console.warn("Instagram snapsave error:", err);
  }

  throw new Error("Instagram videosu indirilemedi. Hesabın herkese açık (public) olduğundan ve linkin geçerli bir Reels/Gönderi olduğundan emin olun.");
}

// -------------------------------------------------------------
// MAIN SERVER & EXPRESS APP
// -------------------------------------------------------------
export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

  // Extract media endpoint
  app.post("/api/extract", async (req, res) => {
    const rawUrl = req.body?.url?.trim();
    if (!rawUrl) {
      res.status(400).json({ success: false, error: "Lütfen bir video linki yapıştırın." });
      return;
    }

    try {
      new URL(rawUrl);
    } catch {
      res.status(400).json({ success: false, error: "Geçerli bir web adresi (URL) girin." });
      return;
    }

    const platform = detectPlatform(rawUrl);

    try {
      let result: NormalizedVideo;

      if (platform === "tiktok") {
        result = await extractTikTok(rawUrl);
      } else if (platform === "youtube") {
        result = await extractYouTube(rawUrl);
      } else if (platform === "instagram") {
        result = await extractInstagram(rawUrl);
      } else {
        // Try all-in-one detection
        try {
          result = await extractTikTok(rawUrl);
        } catch {
          try {
            result = await extractInstagram(rawUrl);
          } catch {
            result = await extractYouTube(rawUrl);
          }
        }
      }

      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error("Extraction error for URL:", rawUrl, err);
      res.status(422).json({
        success: false,
        error: err.message || "Video bilgileri alınamadı. Lütfen linki kontrol edin.",
      });
    }
  });

  // Streaming download proxy endpoint
  // Ensures user browser receives an attachment with correct filename and content-type
  // Includes auto-retry and direct CDN resolution to prevent 10.1 KB error / placeholder downloads
  app.get("/api/download", async (req, res) => {
    const fileUrl = req.query.url as string;
    const requestedName = (req.query.filename as string) || "video.mp4";
    const type = (req.query.type as string) || "video";

    if (!fileUrl) {
      res.status(400).send("URL parameter is required");
      return;
    }

    // Prepare URL candidates:
    // If it is a rapidcdn JWT token URL, decode the direct fbcdn URL
    let directUrlCandidate: string | null = null;
    let directHeaders: Record<string, string> | null = null;
    if (fileUrl.includes("rapidcdn.app") && fileUrl.includes("token=")) {
      try {
        const tokenMatch = fileUrl.match(/token=([^&]+)/);
        if (tokenMatch) {
          const payload = JSON.parse(Buffer.from(tokenMatch[1].split(".")[1], "base64url").toString());
          if (payload.url) {
            directUrlCandidate = payload.url;
            directHeaders = payload.headers || {};
          }
        }
      } catch {
        // ignore
      }
    }

    const defaultHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Encoding": "identity",
    };

    if (fileUrl.includes("tiktokcdn") || fileUrl.includes("tiktok.com") || fileUrl.includes("tikwm")) {
      defaultHeaders["Referer"] = "https://www.tiktok.com/";
    } else if (fileUrl.includes("instagram.com") || fileUrl.includes("cdninstagram")) {
      defaultHeaders["Referer"] = "https://www.instagram.com/";
    }

    // Try directUrlCandidate first if available (faster & bypasses proxy delays), then fallback to fileUrl
    const candidates = directUrlCandidate
      ? [
          { url: directUrlCandidate, headers: { ...defaultHeaders, ...(directHeaders || {}) } },
          { url: fileUrl, headers: defaultHeaders },
        ]
      : [{ url: fileUrl, headers: defaultHeaders }];

    let validResponse: Response | null = null;
    let finalContentType = type === "audio" ? "audio/mpeg" : "video/mp4";
    let finalContentLength: string | null = null;

    for (const candidate of candidates) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const resp = await fetch(candidate.url, {
            headers: candidate.headers,
            redirect: "follow",
          });

          const ct = resp.headers.get("content-type") || "";
          const cl = resp.headers.get("content-length");
          const lengthNum = cl ? parseInt(cl, 10) : 0;

          // An error page, captcha, or pending conversion page is typically text/html or application/json
          // and usually ~10 KB in size.
          const isErrorPayload = ct.includes("text/html") || ct.includes("application/json");
          const isSuspiciouslySmall = lengthNum > 0 && lengthNum < 15000 && type === "video";

          if (resp.ok && !isErrorPayload && !isSuspiciouslySmall && resp.body) {
            validResponse = resp;
            finalContentType = ct || (type === "audio" ? "audio/mpeg" : "video/mp4");
            finalContentLength = cl;
            break;
          }

          // If upstream server returned placeholder or rate-limited, wait briefly before retrying
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 800 * attempt));
          }
        } catch {
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 800 * attempt));
          }
        }
      }

      if (validResponse) break;
    }

    if (!validResponse || !validResponse.body) {
      // NEVER redirect or stream an HTML page as an attachment (which results in saving a 10.1 KB corrupt file!)
      // Instead send a clear 503 so frontend can retry automatically
      res.status(503).json({
        success: false,
        error: "Video akışı hazırlanıyor veya geçici olarak ulaşılamadı. Lütfen birkaç saniye sonra tekrar deneyin.",
      });
      return;
    }

    const cleanFilename = requestedName.replace(/[^a-zA-Z0-9_.-]/g, "_");

    res.setHeader("Content-Disposition", `attachment; filename="${cleanFilename}"`);
    res.setHeader("Content-Type", finalContentType);
    if (finalContentLength && parseInt(finalContentLength, 10) > 0) {
      res.setHeader("Content-Length", finalContentLength);
    }
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    const nodeStream = Readable.fromWeb(validResponse.body as any);
    nodeStream.pipe(res);

    req.on("close", () => {
      if (req.destroyed) {
        nodeStream.destroy();
      }
    });

    nodeStream.on("error", (err) => {
      console.error("Stream piping error:", err);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });
  });

  // Vite middleware setup and dev server runner
  async function startServer() {
    const PORT = 3000;
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Video Downloader Server running on http://localhost:${PORT}`);
    });
  }

  // When running in standalone container or local dev (not serverless like Vercel function)
  if (!process.env.VERCEL) {
    startServer();
  }

  export default app;
