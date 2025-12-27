# 🍥Fuwari For Kairo

> [!CAUTION]
> 這是 **Kairo 的客製化分支（Fuwari For Kairo）**，基於原專案做出實用調整與說明。若以此作為模板二次開發，請具備基本的 Astro / 前端操作能力。

![preview](https://raw.githubusercontent.com/saicaca/resource/main/fuwari/home.png)

一個以 **Astro** 為核心的現代化靜態部落格主題，側重技術分享、長期維護與實際部署流程。  
本分支追求穩定與易維護，不刻意大幅改造 UI 架構，而是把文件與實務教學做得更清楚，方便你拿來當作日常寫作與部署的基底。

---

## ✨ 主要特色

- 基於 **Astro**，輸出靜態站點，速度與 SEO 表現良好  
- 響應式設計（桌機 / 平板 / 手機）  
- 深色 / 淺色主題切換  
- 支援 Markdown（含擴充語法）與 Pagefind 全文搜尋  
- 自動文章目錄（TOC）、閱讀時間估算  
- 標籤與分類系統、RSS 支援  
- 可調整主題色與簡單配置，方便個人化

---

## 🧰 技術棧（簡要）

- 框架：Astro  
- 樣式：Tailwind CSS  
- 套件管理：pnpm  

---

## 🚀 快速開始

### 系統需求
- Node.js ≥ 20  
- pnpm ≥ 9

### 安裝

```bash
pnpm install
```

### 開發（本地）

```bash
pnpm dev
# 打開 http://localhost:4321
```

### 建構（生產）

```bash
pnpm build
```

### 預覽建構結果

```bash
pnpm preview
```

---

## 📝 常用腳本

- `pnpm dev`：本地開發  
- `pnpm build`：建立靜態檔案  
- `pnpm preview`：本地預覽 build 結果  
- `pnpm new-post <slug>`：建立新文章（範例腳本）  
- `pnpm clean`：移除未使用資源（視專案內腳本而定）

---

## 📄 內容格式（文章範例）

請在 `src/content/posts/` 放置 Markdown 檔案，範例 frontmatter 如下：

```markdown
---
title: "第一篇文章"
published: 2025-01-01
description: "簡短描述（SEO）"
image: ./cover.jpg
tags: [教學, Astro]
category: 技術
draft: false
lang: zh-TW
---
```

文章內可以使用擴充語法（例如提示框、程式碼區塊等）。

---

## ⚙️ 站台配置（要改的地方）

主要設定集中在 `src/config.ts`，典型範例：

```ts
export const siteConfig = {
  title: "Fuwari For Kairo",
  subtitle: "技術筆記與實作",
  lang: "zh-TW",
  themeColor: { hue: 240, fixed: false },
  banner: { enable: false, src: "/assets/banner.png", position: "center" }
}
```

> 建議先把 `title`、`lang`、`site`（在 `astro.config.mjs`）改成你的設定，這會影響 SEO 與部署連結。

---

## 📁 專案結構（概要）

```
├── public/                 # 靜態資源（favicon、圖片）
├── src/
│   ├── components/         # UI 元件
│   ├── content/
│   │   ├── posts/          # 文章（Markdown）
│   │   └── assets/         # 文章資源
│   ├── layouts/            # 佈局
│   ├── pages/              # 路由頁面
│   ├── styles/             # 全域與 Markdown 樣式
│   └── config.ts           # 站台設定
├── scripts/                # 小工具腳本（new-post、clean）
└── package.json
```

---

## 🔧 客製化小技巧（實用）

- **主題色**：改 `config.ts` 的 `themeColor.hue`（0–360）。  
- **顯示語言**：若網站主要為繁中，請把 `lang` 設為 `zh-TW`。  
- **SEO**：在 `astro.config.mjs` 設定 `site` 為你的正式網址（很重要）。  
- **圖片最佳化**：部署時配合 CDN（如 Cloudflare）可加快載入速度。  

---

## 📦 部署建議

建構後的 `dist/` 可部署到任一靜態站台（Vercel / Netlify / GitHub Pages / CDN）。  
若使用 Vercel：把專案連到 GitHub，預設 build 指令 `pnpm build`、輸出資料夾由 astro 自動處理。

---

## 📜 授權

採用 **MIT License**，請保留原始授權聲明。

---

## 🙏 致謝與來源

此分支基於原始專案 **Fuwari**（saicaca）改良與文件補充：  
https://github.com/saicaca/fuwari

感謝原作者提供可擴充、好用的模板。
