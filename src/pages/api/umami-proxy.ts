import type { APIRoute } from "astro";
import { umamiConfig } from "../../config";

export const GET: APIRoute = async () => {
  try {
    const token = process.env.UMAMI_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing UMAMI_TOKEN environment variable" }),
        { status: 500 }
      );
    }

    const baseUrl = umamiConfig.baseUrl.replace(/\/+$/, "");
    const siteId = umamiConfig.shareId;
    const targetUrl = `${baseUrl}/api/websites/${siteId}/stats`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    let data;
    try {
      data = await res.json(); // 只讀一次
    } catch {
      const text = await res.text(); // 若不是 JSON 再讀 text
      return new Response(
        JSON.stringify({
          ok: false,
          status: res.status,
          error: "Upstream returned non-JSON",
          bodySnippet: text.slice(0, 300),
        }),
        { status: 502 }
      );
    }

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: "Proxy failed", detail: String(err) }),
      { status: 500 }
    );
  }
};
