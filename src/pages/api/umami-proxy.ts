import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);

    const baseUrl = url.searchParams.get("baseUrl");
    const websiteId = url.searchParams.get("websiteId");

    if (!baseUrl || !websiteId) {
      return new Response(
        JSON.stringify({ error: "Missing baseUrl or websiteId" }),
        { status: 400 }
      );
    }

    const cleanBase = baseUrl.replace(/\/+$/, "");
    const targetUrl = `${cleanBase}/share/${websiteId}/stats`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    const text = await res.text();

    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        // ✨ 這行是重點：瀏覽器只看「同源」
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
