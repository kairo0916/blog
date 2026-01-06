import type { APIRoute } from "astro";
import Cohere from "cohere-ai";

const cohere = new Cohere({
  token: import.meta.env.COHERE_API_TOKEN,
});

// ✅ 簡單記憶體快取（Vercel / Node 可用）
const cache = new Map<string, string>();

export const POST: APIRoute = async ({ request }) => {
  try {
    const { content, slug } = await request.json();

    if (!content || !slug) {
      return new Response("Bad Request", { status: 400 });
    }

    // ✅ 命中快取：直接回傳
    if (cache.has(slug)) {
      return new Response(
        JSON.stringify({ summary: cache.get(slug), cached: true }),
        { status: 200 }
      );
    }

    const prompt = `
請閱讀以下文章內容，提取重點並生成精簡摘要。
僅提供摘要內容，不提供建議、評論或延伸說明，字數控制在 80 字以內。

文章內容：
${content}
`;

    const result = await cohere.generate({
      model: "command-a-03-2025",
      prompt,
      max_tokens: 120,
      temperature: 0.3,
    });

    const summary = result.generations[0]?.text?.trim();

    if (!summary) {
      throw new Error("Empty summary");
    }

    // ✅ 寫入快取
    cache.set(slug, summary);

    return new Response(
      JSON.stringify({ summary, cached: false }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "AI summary failed" }),
      { status: 500 }
    );
  }
};
