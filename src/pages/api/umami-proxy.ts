import type { APIRoute } from "astro";
import { umamiConfig } from "../../config";

export const GET: APIRoute = async () => {
  try {
    // 1️⃣ 基本保護
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
        JSON.stringify({
          error: "Missing umamiConfig.baseUrl or shareId",
        }),
        { status: 400 }
      );
    }

    // 2️⃣ 組 Umami Share API URL
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const targetUrl = `${cleanBase}/share/${shareId}/stats`;

    // 3️⃣ Server-side fetch（不受 CORS 影響）
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const body = await res.text();

    // 4️⃣ 原樣回傳給前端
    return new Response(body, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        // ✨ 關鍵：前端只會看到「同源」
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Umami proxy failed",
        detail: String(err),
      }),
      { status: 500 }
    );
  }
};
