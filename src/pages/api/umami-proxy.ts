import type { APIRoute } from "astro";
import { umamiConfig } from "../../config.ts";

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

    // 只讀一次 body
    const contentType = res.headers.get("content-type") || "";
    let data: any;

    if (contentType.includes("application/json")) {
      data = await res.json(); // 只有 JSON 才 parse
    } else {
      const text = await res.text(); // 非 JSON 就抓 text
      data = {
        ok: false,
        status: res.status,
        error: "Upstream returned non-JSON",
        bodySnippet: text.slice(0, 300), // 方便 debug
      };
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
