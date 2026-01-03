---
title: Web 應用安全：XSS、CSRF 與注入攻擊防護
published: 2026-01-04
description: "系統性說明 Web 應用三大常見攻擊（XSS、CSRF、注入攻擊）的原理、判別、以及開發與運維層面的實務防護措施與檢測流程。"
image: ""
draft: false
---

## 概覽與目標

Web 應用最常見、也最致命的安全問題經常源於「外界輸入未被妥善處理」或「驗證與授權邏輯不完善」。本文聚焦三個高頻攻擊類型——**XSS（跨站指令碼）**、**CSRF（跨站請求偽造）**與廣義的**注入攻擊（SQL、命令、LDAP、XPath 等）**。我們會說明每種攻擊的本質、如何在程式碼或系統層面判別脆弱點、以及能立即採取的防護措施與測試方法，重點放在「實務可用、能落地」的防護策略。

---

## 一、通用原則（先說結論）

1. **永遠把外界資料當成不可信**：所有來自使用者、第三方、上游系統的資料，都必須驗證、淨化或轉義（視情境）。  
2. **最小權限與最小資訊暴露**：程式與帳戶僅賦予必要權限；錯誤訊息避免洩露內部細節。  
3. **輸入驗證 ≠ 輸出編碼**：前者是過濾或拒絕不合法輸入；後者是在輸出到 HTML/SQL/OS 等上下文時做安全轉義。兩者都需要。  
4. **使用現代框架 & 內建防護**：多數成熟框架提供安全 API（prepared statements、templating 的 auto-escape、CSRF token support），善用它們比自己重寫更安全。  
5. **持續測試**：整合 SAST、DAST、依賴掃描與例行滲透測試（或使用自動化工具）納入 CI/CD。

---

## 二、XSS（Cross-Site Scripting）

### 1) 本質與類型快速回顧
- **Stored XSS（儲存型）**：惡意腳本被儲存在伺服器（如資料庫、留言板）並在其他使用者載入頁面時執行。  
- **Reflected XSS（反射型）**：惡意輸入透過 URL 或表單即時反映在回應中，攻擊者誘導受害者點擊特製 URL。  
- **DOM-based XSS**：攻擊在客戶端 JavaScript 操作 DOM 時發生，原始伺服器回應本身看似安全，但前端處理不當導致執行惡意程式。  

### 2) 常見觸發場景
- 把使用者內容直接插入 innerHTML、document.write、eval 等 API。  
- 在未轉義的情況下把使用者輸入放到 HTML 屬性、事件處理器（onclick）、或 `<script>` 中。  
- 動態構成 HTML 字串並插入 DOM（client-side templating 未做 escape）。

### 3) 防護策略（實務可執行）
- **輸出編碼（Output Encoding）**：在把資料輸出到 HTML、HTML attribute、JavaScript、CSS 或 URL 不同上下文時，採用對應的編碼函式。  
  - HTML body → escape HTML（`&`、`<`、`>`、`"` 等）  
  - HTML attribute → attribute-encoding（避免破壞引號）  
  - JavaScript context → 使用安全接口或 JSON 序列化（不要直接拼字串）  
  - URL context → URL-encode
- **使用框架的自動 escaping**：例如大多數模板引擎（Mustache、Handlebars、Jinja2、React 的 JSX）會在輸出時自動 escape。不要關閉這些保護，除非非常必要並且清楚風險。  
- **避免危險 API**：盡量不要用 `innerHTML`, `dangerouslySetInnerHTML`, `eval`, `new Function` 等；若必要則在輸入經過嚴格白名單淨化。  
- **Content Security Policy (CSP)**：透過 CSP 限制可執行的來源（script-src），並啟用 `nonce` 或 `hash` 機制來允許可信內嵌程式碼。CSP 不是萬靈丹，但能大幅降低成功攻擊面。範例 header：
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-<RANDOM>';
  ```
- **HttpOnly 與 Secure Cookie**：把 session cookie 設為 `HttpOnly` 避免被 JavaScript 讀取（降低 XSS 竊取 session 的風險）；`Secure` 強制僅在 HTTPS 傳輸。  
- **輸入白名單（for rich text）**：若允許富文本（HTML），使用安全的 HTML sanitizer（例如 DOMPurify、Bleach 等），並僅允許特定標籤/屬性與 URL schemes。

### 4) 範例（安全 vs 不安全，前端示意）
不安全（示意）：
```js
// Don't do this:
const container = document.getElementById('msg');
container.innerHTML = userInput; // userInput 含腳本 -> XSS
```
安全（示意）：
```js
// Safer: use textContent or escape before inserting
const container = document.getElementById('msg');
container.textContent = userInput; // 不會當作 HTML 解析
```
或若必須插入 HTML，先用 sanitizer：
```js
import DOMPurify from 'dompurify';
container.innerHTML = DOMPurify.sanitize(userInput);
```

### 5) 偵測與測試
- 在開發階段加入自動化測試（SAST 與 unit tests for output encoding）。  
- 使用 DAST 工具（OWASP ZAP、Burp）對輸入點做掃描（注意：僅在測試/授權環境執行）。  
- 在瀏覽器 console 模擬 payload（安全情況下使用無害字串）確認應用如何處理特殊字符。

---

## 三、CSRF（Cross-Site Request Forgery）

### 1) 本質
CSRF 的攻擊者利用使用者已登入的瀏覽器權限（cookie、HTTP 認證等），誘導其瀏覽器向受信任網站發送未經授權的請求（例如轉帳、修改設定）。關鍵在於伺服器端無法分辨該請求是由真實使用者交互觸發還是外部網頁發起。

### 2) 被利用的常見場景
- 任何以 cookie 認證的 state-changing action（POST/PUT/DELETE）如果沒有 CSRF 防護就容易被利用。  
- 圖像/表單/GET 請求可能被當作觸發方式（例如 `<img src="https://bank/transfer?to=...">`）。現代 RESTful 設計通常要求 state change 使用非 GET 方法，但仍要防護。

### 3) 防護策略（實務明單）
- **CSRF Token（同源驗證 token）**：在 server-rendered 或 SPA 與 server 互動時，對所有 state-changing 請求附帶不可預測的 token（伺服器驗證）；token 存於伺服器端 session 或在 cookie 與 request header 中雙向比對。  
  - 例如：伺服器在表單頁面 embed 隱藏欄位 `<input type="hidden" name="_csrf" value="...">`。提交時伺服器檢查 token 是否正確。  
- **SameSite Cookie**：把 cookie 的 `SameSite` 設為 `Lax` 或 `Strict`。`Lax` 在大多數情境對跨站 GET 請求有保護，而 `Strict` 更嚴格。此為簡單且高成效的保護。  
- **Double Submit Cookie**：把隨機 token 同時放在 cookie 與 request body/header，伺服器端比較兩者是否一致（注意對 XSS 無效，因為 XSS 可讀 cookie）。  
- **驗證 Referer/Origin**：對於敏感請求，檢查 `Origin` 或 `Referer` header 是否屬於你的域（較可靠）。注意某些情況 referer 可能被瀏覽器隱藏或省略。  
- **避免把敏感操作綁在 GET**：務必把會改變狀態的操作用 POST/PUT/DELETE 並要求 CSRF token。

### 4) 範例（Express + csurf）
伺服器端（Node/Express）：
```js
import csurf from 'csurf';
const csrfProtection = csurf({ cookie: true });
app.use(cookieParser());
app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});
app.post('/process', csrfProtection, (req, res) => {
  // csurf 已驗證 token
});
```

---

## 四、注入攻擊（以 SQL Injection 為代表，但概念適用於命令注入、LDAP、XPath 等）

### 1) 本質
注入攻擊是指把惡意資料注入到原本應該是資料（而非指令）的位置，導致伺服器將資料錯誤當作程式或查詢的一部分執行。最常見的是 SQL 注入（攻擊者能操控查詢語句），但類似問題也發生在 shell command、LDAP、XML/XPath 操作等。

### 2) 常見場景
- 直接把使用者輸入拼接成 SQL 字串：`"SELECT * FROM users WHERE id = " + req.query.id`。  
- 用輸入建構系統命令、shell 執行字串。  
- 在動態構造 XPath、LDAP filter 時未過濾特殊字元。

### 3) 防護重點（實務面）
- **使用參數化查詢 / Prepared Statements**（最重要）：不要拼字串，使用 DB 驅動提供的 bind parameter 機制。資料會被視為參數而非 SQL code。  
  - SQL 範例（Node + pg）：
    ```js
    const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    ```
  - Java（JDBC）：
    ```java
    PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
    ps.setInt(1, id);
    ```
- **使用 ORM 並了解其生成的 SQL**：ORM 可以降低寫 raw SQL 的錯誤，但仍需留意動態 where clause 的拼接與 raw query 使用情況。  
- **避免直接把使用者輸入傳給系統命令**：若必須，使用安全 API（例如 spawn with args array 而非 shell string），並在可能時做白名單限制。  
- **限制資料庫權限**：應用使用的 DB 帳戶只給必要操作權限（SELECT/INSERT/UPDATE on specific tables），不要用 root 或 admin 帳戶執行日常查詢。  
- **參考最小化表達式**：避免把敏感查詢結果直接回傳至使用者，防止錯誤回傳洩露結構資訊。

### 4) 命令注入（Shell Injection）與防護
- 不要把使用者輸入透過字串拼接放進 `exec`、`system` 等 shell command。改用參數化的 process spawn 或 libraries 並將不可信輸入當作資料傳入。  
- 對於必須執行外部程序的情境，使用白名單與最小權限策略，並進行輸入長度及格式限制。

---

## 五、驗證、授權與會話管理（與上述攻擊交互）

- **強化認證流程**：使用多因素（MFA）對高權限操作。  
- **會話安全**：短期 session TTL、定期輪換 session id（重要操作後），以及 `HttpOnly/ Secure/ SameSite` cookie。  
- **細緻化授權檢查**：在 server 端對每一個重要 API 進行授權，而非僅依賴前端 UI 隱藏。使用基於角色（RBAC）或屬性的授權（ABAC）視複雜度而定。  
- **輸入最小化**：在校驗成功後只保留必要欄位到後端邏輯，避免把多餘欄位直接轉給下游系統。

---

## 六、測試與偵測（SAST / DAST / IAST / RASP）

1. **SAST（Static Application Security Testing）**：把靜態漏洞掃描（例如 SQL 注入敏感模式、不安全 API 使用）整合到 PR pipeline（例：Semgrep、SonarQube）。  
2. **DAST（Dynamic Application Security Testing）**：執行時模擬攻擊行為（OWASP ZAP、Burp Intruder 等）找出 runtime 的漏洞（注意需在授權環境執行）。  
3. **IAST / RASP**：在應用內嵌入式偵測（如在測試環境偵測即時的注入嘗試與不當資料處理）。  
4. **依賴掃描（SCA）**：使用 Dependabot、Snyk 等工具檢查第三方套件的已知弱點。  
5. **自動化安全測試用例**：把常見注入/XSS/CSRF 測試做成自動化測試（非惡意 payload，使用可控測試字串）並納入 CI。

---

## 七、例行運維與事件處理

- **日誌**：詳細記錄關鍵事件（驗證失敗、授權拒絕、異常操作），並把敏感資訊遮掩或匿名化。  
- **警示**：為大量失敗登入、異常流量或非預期的資料變更設置告警。  
- **備援與回復**：定期備份資料庫，並演練回滾流程。  
- **滲透測試與紅隊演練**：每季或每半年進行一次滲透測試，並把發現納入優先修復清單。  
- **披露與補丁流程**：建立第三方或用戶漏洞通報管道，並設定緊急修補（hotfix）作業。

---

## 八、實務檢查清單（部署前後可用）

- [ ] 所有輸出到 HTML / JS / URL / Attribute 的動態資料都有適當的 output-encoding 或使用框架 auto-escape。  
- [ ] 所有 state-changing 的請求都受 CSRF token 或同等防護（或 cookie 設為 SameSite=strict/lax 並做 double submit 驗證）。  
- [ ] 所有資料庫查詢使用 parameterized queries / prepared statements 或 ORM 安全 API。  
- [ ] Cookie 設置：`Secure`, `HttpOnly`, `SameSite`（視需求選 Lax/Strict）。  
- [ ] CSP header 已評估並逐步導入（先報告模式，再強制模式）。  
- [ ] 第三方 action/套件做 SCA 掃描並定期升級重大修補。  
- [ ] CI pipeline 包含 SAST/DAST（或 nightly DAST）、依賴掃描與基本自動化攻擊測試。  
- [ ] 重要日誌上傳到集中化系統並設定告警門檻。

---

## 九、結語（工程取向的實用建議）

- 「安全」不是一次性任務，而是開發、測試與運維的持續工作。把安全檢查整合到日常開發流程（PR、CI）中，能夠「早發現、早修復」。  
- 優先把**簡單、高回報**的措施做起：output encoding、prepared statements、CSRF token、SameSite cookies、CSP 的逐步引入。這些能立即降低大多數常見攻擊的風險。  
- 當你使用第三方框架或庫時，先確認它們有良好的安全實踐與更新頻率；必要時選較受信任的替代方案。  
- 最後，建立應變流程：出事時快速識別受影響範圍、回滾部署、通知使用者與法遵部門，這些都比事後手忙腳亂更重要。
