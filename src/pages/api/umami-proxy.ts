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
    const targetUrl = `${cleanBase}/share/${shareId}/stats`;

    const res = await fetch(targetUrl);
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
