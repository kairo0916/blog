// src/pages/api/umami-proxy.ts
import type { APIRoute } from "astro";
import { umamiConfig } from "../../config";

/**
 * Umami proxy for Astro (Vercel).
 * - Reads baseUrl & shareId from src/config.ts (umamiConfig).
 * - Server-side fetch to avoid CORS.
 * - Returns JSON: { ok, status, url, data } or error object.
 * - Optional: set UMAMI_TOKEN env var -> Authorization: Bearer <token>
 */

export const GET: APIRoute = async () => {
  try {
    // Basic guard: config present & enabled
    if (!umamiConfig || !umamiConfig.enable) {
      return new Response(JSON.stringify({ error: "Umami disabled or missing config" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const baseUrl = String(umamiConfig.baseUrl || "").trim();
    const shareId = String(umamiConfig.shareId || umamiConfig.websiteId || umamiConfig.siteId || "").trim();

    if (!baseUrl || !shareId) {
      return new Response(JSON.stringify({ error: "Missing umamiConfig.baseUrl or shareId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cleanBase = baseUrl.replace(/\/+$/, "");
    const targetUrl =
      cleanBase +
      "/share/" +
      encodeURIComponent(shareId) +
      (umamiConfig.timezone ? `?timezone=${encodeURIComponent(String(umamiConfig.timezone))}` : "");

    // Prepare headers for upstream request
    const upstreamHeaders: Record<string, string> = { Accept: "application/json" };
    if (process.env.UMAMI_TOKEN) {
      upstreamHeaders.Authorization = `Bearer ${process.env.UMAMI_TOKEN}`;
    }

    // Server-side fetch (no CORS issue)
    const upstreamRes = await fetch(targetUrl, { method: "GET", headers: upstreamHeaders });

    const rawText = await upstreamRes.text();

    // Try parse JSON; if not JSON, return a helpful error payload (don't throw)
    let parsed: unknown = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch (e) {
      // Upstream returned non-JSON (likely an HTML error page). Return a structured error.
      const snippet = rawText ? String(rawText).slice(0, 1500) : "";
      return new Response(
        JSON.stringify({
          ok: false,
          status: upstreamRes.status,
          url: targetUrl,
          error: "Upstream returned non-JSON (see bodySnippet).",
          bodySnippet: snippet,
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            // Allow same-origin and simple CORS usage from front-end; remove or tighten if you want.
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
          },
        }
      );
    }

    // Successful: return original parsed data under `data`
    return new Response(
      JSON.stringify({
        ok: upstreamRes.ok,
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
    return new Response(
      JSON.stringify({
        error: "Proxy failed",
        detail: String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
