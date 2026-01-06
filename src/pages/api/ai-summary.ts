import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { content } = await request.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content provided" }),
        { status: 400 }
      );
    }

    const prompt = `
請閱讀以下文章內容，提取其核心重點並生成一段精簡摘要。

規則：
- 僅輸出摘要內容
- 不提供建議、評論或延伸說明
- 不使用第二人稱
- 不加入任何開頭或結語
- 字數控制在 60～120 字之間
- 語氣保持中立、客觀、資訊導向

文章內容如下：
${content}
    `.trim();

    const res = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.COHERE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus",
        prompt,
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    const data = await res.json();
    const summary = data.generations?.[0]?.text?.trim();

    return new Response(
      JSON.stringify({ summary }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "AI summary failed" }),
      { status: 500 }
    );
  }
};
