---
title: GitHub Actions 自動化 CI/CD
published: 2025-12-31
description: "完整、實務導向的 GitHub Actions CI/CD 教學：工作流程架構、範例 YAML、最佳實務、安全性與進階技巧，帶你從單機測試到自動部署、監控與擴展。"
image: "./image/githubactions.jepg"
draft: false
---

## 前言

GitHub Actions 已經從一個方便的自動化工具，演變成完整的 CI/CD 平台。它把工作流程（workflows）直接綁在 Git 倉庫上，讓代碼的測試、建置、驗證與部署可以在同一個地方自動化完成。本文以實務角度出發，從概念說明到範例、再到最佳實務與安全性考量，逐步帶你把 GitHub Actions 用到位：不只是跑測試，而是把整個交付流程做得穩健、可觀測、可擴展。

---

## 一、核心概念快速說明（不要笨重定義）

- **Workflow（工作流程）**：以 YAML 檔放在 `.github/workflows/`。它定義了觸發時機（on）、要做的工作（jobs）與邏輯。  
- **Job（工作）**：工作由多個步驟（steps）組成，在 runner 上執行。每個 job 預設在獨立的 runner（container 或 VM）上執行，job 之間可以並行或依賴。  
- **Step（步驟）**：單一執行單位，可以是 shell 指令，也可以是 action（重複使用的封裝）。  
- **Action**：可重複使用的模組（JavaScript、Docker 或 composite action），用來封裝常見任務。  
- **Runner**：執行 job 的主機，分為 GitHub 提供的 hosted runners（Linux/Windows/macOS）或你自建的 self-hosted runners。  
- **Artifact / Cache**：用來在 job 間傳遞檔案（artifacts）或加快依賴安裝（cache）。  
- **Secrets / Environments**：安全儲存機密資訊與環境級別保護（例如需人工審核才可部署到 production）。

理解這些關鍵字就能閱讀任一 workflow，下面開始用實例把它拼起來。

---

## 二、從最簡單的 CI 開始：Node.js 範例（一步到位）

一個實際的 Node.js 專案，典型的 CI 流程包含：安裝依賴、執行 lint、跑測試、產生報告並上傳 artifact。這是一個標準範例：

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ "main", "staging" ]
  pull_request:
    branches: [ "main" ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - name: Install dependencies (cache)
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ matrix.node-version }}-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-${{ matrix.node-version }}-
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --ci --reporter=mocha-junit-reporter
      - name: Upload test results
        uses: actions/upload-artifact@v4
        with:
          name: junit-results
          path: test-results.xml
```

說明要點：  
- 使用 `strategy.matrix` 並行在多個 Node 版本上跑測試，驗證相容性。  
- 使用 `actions/cache` 快取 npm，顯著減少安裝時間。  
- `upload-artifact` 可讓後續 job 或 GitHub UI 下載測試報告。

---

## 三、把 CI 接上 CD：部署範例（Docker → Registry → K8s / VPS / Serverless）

CI 做完後通常會把產物（artifact / container image）推到 registry，接著觸發部署。以下範例示範建置 Docker 映像並推到 Docker Hub，然後示範如何用另外的 job 或 workflow 做部署。

**Build & Push Image**

```yaml
# .github/workflows/docker-build.yml
name: Build and Publish Docker Image

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v2
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: myorg/myapp:${{ github.sha }}
          platforms: linux/amd64,linux/arm64
      - name: Upload image tag artifact
        uses: actions/upload-artifact@v4
        with:
          name: image-tag
          path: image-tag.txt
```

**部署（例：在另一個 workflow 觸發，或使用 environment 與保護）**

部署可在同一 workflow 以 `needs:` 依賴順序執行，或用 `workflow_run` 觸發。示例：把映像部署到 Kubernetes（kubectl + k8s manifest）：

```yaml
# .github/workflows/deploy.yml
name: Deploy to K8s

on:
  workflow_run:
    workflows: ["Build and Publish Docker Image"]
    types:
      - completed

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://your-app.example.com
    steps:
      - uses: actions/checkout@v4
      - name: Download image tag
        uses: actions/download-artifact@v4
        with:
          name: image-tag
      - name: Set kubectl
        uses: azure/setup-kubectl@v4
        with:
          version: '1.26.0'
      - name: Deploy to k8s
        env:
          IMAGE_TAG: ${{ steps.download-artifact.outputs.path }}/image-tag.txt
          KUBECONFIG: ${{ secrets.KUBE_CONFIG }}
        run: |
          kubectl set image deployment/my-app my-app=myorg/myapp:${{ github.sha }}
          kubectl rollout status deployment/my-app -n default
```

注意事項：  
- **secrets**（例如 DockerHub token、Kubeconfig）不要放在 repo 中，要用 GitHub Secrets。  
- **environment** 可以搭配保護規則（required reviewers）來做準入控制。  
- **workflow_run** 用於把 build 完成後的自動部署分離成不同 workflow，使 CI 與 CD 更清晰。

---

## 四、常見 CI/CD 模式與工作流設計建議

1. **分層 workflow**：把「測試/建置」和「部署」拆成不同 workflow，用 `workflow_run` 串接，降低耦合。  
2. **短、快、可回覆的 job**：把大任務拆成多個小 job（lint、unit tests、integration tests、build），方便並行與重試。  
3. **只在必要時部署**：使用 `paths`、branch policy 或專門的 release tag 來控制何時部署。  
4. **使用 artifacts 傳遞建置產物**：binary 或 build output 儘量透過 artifacts 保留，部署時直接下載使用。  
5. **Matrix 建構但有限度**：Matrix 很方便驗證多環境，但同時啟動過多會增加 runner/費用與配額風險。  
6. **使用 concurrency 與 cancel-in-progress**：避免多次 push 觸發排隊部署，`concurrency` 能保證同一分支只有一個在跑的 workflow。例：

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

---

## 五、加速 CI 的實務技巧（節省時間就是節省錢）

- **善用 cache**（actions/cache）：node_modules、pip cache、maven repo、go modules、composer 等都該 cache，但 key 設計要保守（key 包括 lockfile hash）。  
- **依賴分層**：把依賴安裝放到獨立 job 或預先產出 artifact，以便後續 job 使用。  
- **使用 self-hosted runners（有強需求）**：若需要特定硬體（GPU）或更高效能，self-hosted runner 可降低啟動時間，但需維護安全與穩定。  
- **利用 composite actions / reusable workflows**：把共通步驟抽成 action 或 reusable workflow，減少重複、提高一致性。  
- **按需執行較重測試**：把 Unit tests、Integration tests、E2E 分層，PR 時先跑 Unit tests，merge 或 nightly 再跑 E2E。

---

## 六、安全性實務（不能偷懶）

- **Secrets 管理**：所有憑證、token、kubeconfig 一律放入 GitHub Secrets；不要在 workflows 直接 echo secrets（會在 log 洩漏）。  
- **環境保護**：把 production environment 設為需要人工審核或多重審核（required reviewers）。  
- **避免在 PR 中使用寫入權限的 token**：`GITHUB_TOKEN` 有 repo 權限，若有 fork PR，預設會保護性限制；對外部 PR 請小心。  
- **最小權限原則**：只授予 action 或 runner 需要的權限（用 `permissions:` 限制 scope）。  
- **第三方 action 風險**：使用 community action 時檢查 source code（不要盲用），prefer 指定具備維護紀錄與信任度高的 action並鎖定版本（不可用 `@master`）。  
- **依賴掃描與秘密掃描**：把 Dependabot、secret scanning、或 SCA 工具整合到 workflow 中，提早攔截安全問題。

---

## 七、Debug、可觀測性與報告

- **在 workflow 中輸出詳細日誌（但不輸出 secrets）**：對失敗的 step 使用 `run: |` 方式抓取更多上下文。  
- **利用 artifacts 保存 log 與報表**：測試報告、coverages、bundle stats 都上傳 artifacts 以便分析與回溯。  
- **使用 annotations**：GitHub Actions 支援註解（warning/error）直接貼到 Pull Request，改善開發者體驗。  
- **Metrics 與告警**：把關鍵指標（成功率、平均執行時間、失敗趨勢）匯到外部監控（Datadog、Prometheus）以偵測異常。  
- **使用 `if: failure()` 與重試策略**：針對網路不穩或外部服務的臨時錯誤加入重試（retry loops）或 `continue-on-error`（慎用）。

---

## 八、進階功能與常用 patterns

### 1. Reusable workflows（可重用 workflow）
把常用流水線抽成 reusable workflow，供不同 repo 呼叫，減少維護負擔。

```yaml
# .github/workflows/reusable-ci.yml
name: Reusable CI
on:
  workflow_call:
    inputs:
      node-version:
        required: true
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
      - run: npm ci
      - run: npm test
```

呼叫方：

```yaml
jobs:
  call-reusable:
    uses: your-org/your-repo/.github/workflows/reusable-ci.yml@main
    with:
      node-version: 18.x
```

### 2. Composite Actions（組合 action）
把多個步驟封裝成一個 action（版本控制、可在多個 workflow 重複使用）。

### 3. Concurrency 與 Workflow Dispatch
- `workflow_dispatch` 可手動觸發（常用於 release 或 hotfix）。  
- `concurrency` 能防止重複排隊與浪費 runner。  

### 4. Scheduled Workflows（Cron）
例：每天夜間跑 E2E 測試或定期掃描：

```yaml
on:
  schedule:
    - cron: "0 2 * * *" # 每日 02:00 UTC
```

---

## 九、Self-hosted runners：何時才適合？

優點：自訂環境、較低延遲（依網路）、可使用特殊硬體（GPU、專用網卡）、無需排隊受限於 GitHub hosted runner 配額。  
缺點：需要維護（OS patch、security)、曝光風險（若 runner 在公網）、必須小心 secrets 管理（避免在 runner 上被盜用）。  
實務建議：  
- 將 self-hosted runner 放在安全網段（VPC / private subnet）且使用自動化管理（Ansible/Terraform），定期 patch。  
- 使用 ephemeral runner（短期啟動、完成即關）降低攻擊面。  

---

## 十、成本與配額考量

- GitHub-hosted runners 的執行時間會計費（依帳戶類型與 runner OS 不同）。  
- 除了 runner 時間，artifact 存儲、package storage 也可能有額外費用。  
- 使用 matrix、大量並行 job 會快速增加成本；用 `concurrency`、job 並行度與 cache 設計來優化使用率。  
- 如果大流量 CI（每日數千次 workflow），考慮 self-hosted 或混合策略（部分工作放 public hosted，重度計算放 self-hosted）。

---

## 十一、常見問題與排查清單

1. **Workflow 沒有觸發？**  
   - 檢查 `on:` 設定（push、pull_request、workflow_dispatch、schedule）與 branch 名稱。  
2. **Secrets 不能在 fork PR 中使用？**  
   - 這是預設安全措施，外部貢獻者的 workflow 不會被授權取用 repository secrets。  
3. **Cache 不命中？**  
   - 核心問題是 key 設計；建議 key 包含 lockfile hash（如 `package-lock.json`）或依需求採分層 key 以提高穩定性。  
4. **artifact 太大 / retention 過短？**  
   - 調整 artifact 的 retentionDays 或清理政策，避免佔用儲存配額。  
5. **部署失敗且沒有明確錯誤？**  
   - 開啟詳細 log，確保敏感資訊以 masked 方式處理，並把部署步驟拆解成更小步驟便於定位。

---

## 十二、實務檢查清單（部署前後必做）

**部署前**  
- 所有敏感資訊已放入 Secrets 且經過審核。  
- workflows 使用最小必要權限（`permissions` 限制）。  
- key 的 cache 設計與 purge 流程可控。  
- 測試 coverage 與自動化測試門檻設置（PR 必通過測試才能 merge）。  

**部署中**  
- 使用 environment 與 required reviewers 控制 production 上線。  
- 監控 deploy duration 與 rollback 機制（health check）。  

**部署後**  
- Release notes / changelog 自動生成（例如使用 conventional commits + action 產生 release）。  
- 觀察 SLO / error rate 與自動化告警。  
- 定期清理 artifacts、冷資料與舊 runner。

---

## 十三、實戰案例速覽（簡要）

- **小型專案**：使用單一 workflow，PR 試跑測試，merge 到 `main` 才 build image 並部署到 Vercel / Netlify（serverless）— 成本低、維護簡單。  
- **中型企業**：拆分 CI / CD，使用 reusable workflows、environment 保護、並把 E2E 在 nightly 或 staging 執行。  
- **高頻交易/高依賴專案**：自建 runner、嚴格的權限管理、並把敏感部署步驟放在內部網路的 runner 執行。

---

## 十四、總結：把 GitHub Actions 當成團隊的自動化中樞

GitHub Actions 的價值不僅是把單一任務自動化，而是把開發、測試、建置、發佈、監控串成一條可靠的交付鏈。好的 CI/CD 流程能讓你：

- 更早發現錯誤（shift-left）  
- 減少人工步驟與人為失誤  
- 快速回應市場與使用者需求  
- 在必要時快速回滾與回復服務

最後給你一個最實用的 checklist（複製貼上）：  

- [. ] workflow 有清楚的觸發條件與分支策略  
- [. ] secrets 與 environment 已正確設定  
- [. ] job 被拆分為可並行與可重試的小步驟  
- [. ] cache 與 artifact 設計合理、key 有版本化或 lockfile hash  
- [. ] reusable workflows / composite actions 被用於共通流程  
- [. ] production environment 有保護與審核流程  
- [. ] 日誌、報表、與指標被上傳並納入監控  
- [. ] 成本預估與配額檢查已完成  

把這些元素落實在你的 GitHub Actions 中，CI/CD 就不再是麻煩的工程，而是你可依賴的交付引擎。
