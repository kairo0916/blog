// api/umami-proxy.js
// For Vercel (Node.js serverless). If you use another host, adapt accordingly.
export default async function handler(req, res) {
  try {
    const { baseUrl, websiteId, timezone } = req.query;
    if (!baseUrl || !websiteId) {
      res.status(400).json({ error: "baseUrl and websiteId are required" });
      return;
    }

    // sanitize baseUrl
    const base = String(baseUrl).replace(/\/+$/, "");
    const id = String(websiteId);
    const tz = timezone ? String(timezone) : "";

    const target = base + "/api/website/" + encodeURIComponent(id) + "/stats" +
                   "?metrics=pageviews,visitors&period=30d" +
                   (tz ? "&timezone=" + encodeURIComponent(tz) : "");

    const fetchRes = await fetch(target, { method: "GET" });
    const data = await fetchRes.json().catch(() => null);

    // forward useful info
    res.setHeader("Content-Type", "application/json");
    // cache short on CDN
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(fetchRes.ok ? 200 : 502).json({
      ok: fetchRes.ok,
      status: fetchRes.status,
      url: target,
      data
    });
  } catch (err) {
    console.error("[umami-proxy] error:", err);
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({ error: String(err) });
  }
}
