// src/pages/api/umami.ts
import type { APIRoute } from 'astro';

const UMAMI_SHARE_URL =
  'https://umami.kairo.qzz.io/share/QEfgg7EJvn4DXMXk/stats';

export const GET: APIRoute = async () => {
  try {
    const res = await fetch(UMAMI_SHARE_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Umami' }),
        { status: 500 }
      );
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // ⭐ 同源 API，不需要特別設 CORS
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    );
  }
};
