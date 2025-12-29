// src/pages/api/umami-proxy.ts
import type { APIRoute } from "astro";
import { umamiConfig } from "../../config"; // 如果路徑不同請調整

type Attempt = {
  url: string;
  status: number | null;
  contentType: string | null;
  bodySnippet: string;
  parsedJson: boolean;
  error?: string | null;
};

function snippet(s: string | null | undefined, n = 1000) {
  if (!s) return "";
  return String(s).slice(0, n);
}

async function fetchOnce(url: string, headers: Record<string, string>) {
  const attempt: Attempt = {
    url,
    status: null,
    contentType: null,
    bodySnippet: "",
    parsedJson: false,
    error: null,
  };

  try {
    const r = await fetch(url, { method: "GET", headers });
    attempt.status = r.status;
    const ct = r.headers.get("content-type") || "";
    attempt.contentType = ct;

    // 只讀一次 body
    const text = await r.text();
    attempt.bodySnippet = snippet(text, 1500);

    // 嘗試 parse JSON
    try {
      const parsed = text ? JSON.parse(text) : null;
      attempt.parsedJson = true;
      return { ok: true, attempt, parsed };
    } catch (e) {
      attempt.parsedJson = false;
      attempt.error = "failed to parse JSON: " + String(e);
      return { ok: false, attempt, parsed: null };
    }
  } catch (err) {
    attempt.error = String(err);
    return { ok: false, attempt, parsed: null };
  }
}

export const GET: APIRoute = async () => {
  const attempts: Attempt[] = [];
  try {
    // config & token
    const token = process.env.UMAMI_TOKEN || "";
    const baseUrl = (umamiConfig?.baseUrl || "").replace(/\/+$/, "");
    const siteId = umamiConfig?.shareId || umamiConfig?.websiteId || umamiConfig?.siteId || "";

    if (!baseUrl || !siteId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing umamiConfig.baseUrl or shareId", attempts }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1) If token exists, try token-protected API first
    if (token) {
      const tokenUrl = `${baseUrl}/api/websites/${encodeURIComponent(siteId)}/stats`;
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };
      const r = await fetchOnce(tokenUrl, headers);
      attempts.push(r.attempt);
      if (r.ok && r.attempt.parsedJson) {
        // success
        return new Response(JSON.stringify({ ok: true, data: r.parsed }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
          },
        });
      }
      // else fallthrough to try share endpoint
    }

    // 2) Try public share endpoint (no auth)
    const shareUrl = `${baseUrl}/share/${encodeURIComponent(siteId)}/stats`;
    const r2 = await fetchOnce(shareUrl, { Accept: "application/json" });
    attempts.push(r2.attempt);
    if (r2.ok && r2.attempt.parsedJson) {
      return new Response(JSON.stringify({ ok: true, data: r2.parsed }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      });
    }

    // None worked — return diagnostic info so you can see why
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Upstream returned non-JSON or failed",
        attempts,
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "Proxy internal error", detail: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
};
