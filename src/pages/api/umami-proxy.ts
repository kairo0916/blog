// src/pages/api/umami-proxy.ts
import type { APIRoute } from "astro";
import { umamiConfig } from "../../config";

/**
 * Robust Umami proxy:
 * - Reads baseUrl & shareId from umamiConfig
 * - Server-side fetch to avoid browser CORS
 * - If upstream returns HTML (bot challenge), attempt fetch again with browser-like headers
 * - Returns structured JSON for frontend to parse
 */

function snippet(text: string, n = 1500) {
  return text ? String(text).slice(0, n) : "";
}

export const GET: APIRoute = async () => {
  try {
    if (!umamiConfig || !umamiConfig.enable) {
      return new Response(JSON.stringify({ ok: false, error: "Umami disabled in config" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const baseUrl = String(umamiConfig.baseUrl || "").trim();
    const shareId = String(umamiConfig.shareId || umamiConfig.websiteId || umamiConfig.siteId || "").trim();
    const timezone = umamiConfig.timezone ? String(umamiConfig.timezone) : "";

    if (!baseUrl || !shareId) {
      return new Response(JSON.stringify({ ok: false, error: "Missing umamiConfig.baseUrl or shareId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cleanBase = baseUrl.replace(/\/+$/, "");
    const targetUrl = `${cleanBase}/share/${encodeURIComponent(shareId)}${timezone ? `?timezone=${encodeURIComponent(timezone)}` : ""}`;

    // Basic headers
    const baseHeaders: Record<string, string> = {
      Accept: "application/json, text/plain, */*",
    };
    if (process.env.UMAMI_TOKEN) {
      baseHeaders.Authorization = `Bearer ${process.env.UMAMI_TOKEN}`;
    }

    // 1) Try plain fetch
    let upstreamRes = await fetch(targetUrl, { method: "GET", headers: baseHeaders });
    let raw = await upstreamRes.text();

    // If upstream returned HTML or common bot-challenge, try again with browser-like headers
    const looksLikeHtml = raw && raw.trim().startsWith("<");
    const challengeIndicators = /just a moment|cf-chl-bypass|cloudflare|please enable javascript|captcha/i;
    if ((looksLikeHtml && challengeIndicators.test(raw)) || upstreamRes.status === 403) {
      // Try with more browser-like headers (some sites block non-browser UAs)
      const browserHeaders: Record<string, string> = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Referer": cleanBase + "/",
      };
      if (process.env.UMAMI_TOKEN) browserHeaders.Authorization = `Bearer ${process.env.UMAMI_TOKEN}`;

      try {
        upstreamRes = await fetch(targetUrl, { method: "GET", headers: browserHeaders });
        raw = await upstreamRes.text();
      } catch (e) {
        // continue to error handling below
      }
    }

    // If still not JSON, return diagnostic payload
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      // success
      return new Response(
        JSON.stringify({
          ok: true,
          status: upstreamRes.status,
          url: targetUrl,
          data: parsed,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
          },
        }
      );
    } catch (err) {
      // Upstream didn't return JSON -> include body snippet and status
      const bodySnippet = snippet(raw, 1500);
      return new Response(
        JSON.stringify({
          ok: false,
          status: upstreamRes.status,
          url: targetUrl,
          error: "Upstream returned non-JSON (likely a bot/WAF challenge or HTML page).",
          bodySnippet,
          suggestion:
            "Umami endpoint returned HTML (Cloudflare/WAF). To fix: disable JS challenge or whitelist your host's IPs (Vercel), or use Umami API with a token.",
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
          },
        }
      );
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "Proxy internal error", detail: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
