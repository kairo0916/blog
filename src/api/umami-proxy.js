// api/umami-proxy.js
// Vercel serverless handler (Node). 將 Umami 分享 stats 代理回來，避免瀏覽器 CORS。
export default async function handler(req, res) {
  try {
    const { baseUrl, websiteId, timezone } = req.query;

    if (!baseUrl || !websiteId) {
      res.status(400).json({ error: "baseUrl and websiteId are required" });
      return;
    }

    const base = String(baseUrl).replace(/\/+$/, "");
    const id = String(websiteId);
    const tz = timezone ? String(timezone) : "";

    const target = `${base}/share/${encodeURIComponent(id)}/stats${tz ? `?timezone=${encodeURIComponent(tz)}` : ""}`;

    // 如果需要 token，把 UMAMI_TOKEN 設到 Vercel 的環境變數（可選）
    const headers = { Accept: "application/json" };
    if (process.env.UMAMI_TOKEN) {
      headers.Authorization = `Bearer ${process.env.UMAMI_TOKEN}`;
    }

    const fetchRes = await fetch(target, { method: "GET", headers });

    let data = null;
    try {
      data = await fetchRes.json();
    } catch (e) {
      data = null;
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

    res.status(fetchRes.ok ? 200 : 502).json({
      ok: fetchRes.ok,
      status: fetchRes.status,
      url: target,
      data,
    });
  } catch (err) {
    console.error("[umami-proxy] error:", err);
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({ error: String(err) });
  }
}
