import type { APIRoute } from "astro";
import { umamiConfig } from "../../config";

export const GET: APIRoute = async () => {
  try {
    const { baseUrl, shareId } = umamiConfig;

    if (!baseUrl || !shareId) {
      return new Response(
        JSON.stringify({ error: "Umami config missing" }),
        { status: 500 }
      );
    }

    const targetUrl = `${baseUrl.replace(/\/+$/, "")}/share/${shareId}/stats`;

    const res = await fetch(targetUrl, {
      headers: { Accept: "application/json" },
    });

    const text = await res.text();

    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Proxy failed",
        detail: String(err),
      }),
      { status: 500 }
    );
  }
};