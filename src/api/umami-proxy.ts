import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const baseUrl = url.searchParams.get("baseUrl");
  const websiteId = url.searchParams.get("websiteId");

  if (!baseUrl || !websiteId) {
    return new Response(
      JSON.stringify({ error: "Missing parameters" }),
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${baseUrl}/share/${websiteId}/stats`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Upstream error" }),
        { status: res.status }
      );
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // ⭐ 重点：这里已经是「同源」了，不会有 CORS
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Fetch failed" }),
      { status: 500 }
    );
  }
};
