import type { APIRoute } from "astro";
import { umamiConfig } from "../../config";

export const GET: APIRoute = async () => {
  try {
    if (!umamiConfig?.enable) {
      return new Response(
        JSON.stringify({ error: "Umami disabled" }),
        { status: 400 }
      );
    }

    const baseUrl = umamiConfig.baseUrl;
    const shareId = umamiConfig.shareId;

    if (!baseUrl || !shareId) {
      return new Response(
        JSON.stringify({ error: "Missing umami config" }),
        { status: 400 }
      );
    }

    const cleanBase = baseUrl.replace(/\/+$/, "");
    const targetUrl = `\( {cleanBase}/share/ \){shareId}/stats`;

    const res = await fetch(targetUrl);

    // 檢查 Umami 是否回傳錯誤（例如 shareId 無效時可能回傳 HTML 登入頁）
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch from Umami", status: res.status }),
        { status: 502 }
      );
    }

    // 強制將回傳內容視為 JSON（Umami share/stats 正常應為 JSON）
    const json = await res.json();

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Proxy failed", detail: String(e) }),
      { status: 500 }
    );
  }
};
