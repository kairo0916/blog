---
title: Lavalink 介紹與架設教學：完整技術指南
published: 2025-11-23
description: "讓大家了解 Lavalink 是什麼以及教大家如何簡單部署"
image: "./images/lavalink.jpeg"
draft: false
---

# **Lavalink 介紹與架設教學：完整技術指南**
 
Lavalink 是一套高效能的音訊轉送與解碼系統，專門設計來處理 Discord Bot 的語音串流。它以獨立伺服器的形式運作，將音訊搜尋、解碼、回傳、狀態管理等高負載工作全部集中處理，避免 Bot 本體因大量運算而受到限制。對任何需要穩定音樂播放、低延遲音訊傳輸與高使用量負載的 Discord Bot 專案而言，Lavalink 幾乎是標準且必要的核心組件。
  
## **一、Lavalink 的核心功能與架構概念**
 
Lavalink 建構於 WebSocket 與 REST API 之上，提供兩種主要的通信方式：
 
 
1. **REST API：** 用於搜尋音樂、取得資訊、加載音源。
 
2. **WebSocket：** 用於傳送播放狀態、事件、音訊控制命令等。
 

 
它在整個音訊系統中扮演「集中式音訊工作站」的角色，Bot 只需送出指令，而整個音訊的技術流程都由 Lavalink 負責。
 
### **主要處理內容包括：**
 
 
- 音訊解碼（尤其是 YouTube、SoundCloud 等壓縮格式）
 
- 音訊流式傳輸（Streaming）
 
- 播放隊列管理
 
- 音訊事件回傳
 
- 多音源平台支援
 
- 連線重試、語音重連、失敗恢復
 

 
這項架構在多 Bot、多伺服器、多語音頻道環境下具備極高穩定性。如果 Bot 在大量語音頻道播放音樂，Lavalink 可以輕鬆分攤高運算量，並同時處理數千條音訊流。
  
## **二、Lavalink 的優勢與適用場景**
 
### **1. 高效穩定的音訊處理能力**
 
Discord Bot 若自身處理 YouTube 或 SoundCloud 的音訊轉碼，會承受巨量 CPU 負載，而 Lavalink 以 Java 與 Lavaplayer 為基礎提供高效率解碼，顯著提升穩定性。
 
### **2. 可水平擴充的架構**
 
可部署多個 Lavalink 節點，並透過 Bot 的負載平衡策略進行調度，適合大型機器人與多地區音訊節點。
 
### **3. 避免 Discord 的語音限制或延遲問題**
 
Lavalink 處理語音傳輸的重連與同步，降低 Bot 在流量高峰時遭遇語音 Channel 凍結或延遲的機率。
 
### **4. 清晰的 API 與極高相容性**
 
支援幾乎所有主流 Discord 音訊框架，例如：
 
 
- Erela.js
 
- Poru
 
- Discord Player（部分版本）
 
- Wavelink（Python）
 
- Moonlink（JS）
 

  
## **三、架設 Lavalink 的系統需求**
 
### **最低需求：**
 
 
- **Java 17 或以上**
 
- **1GB RAM（建議 2GB）**
 
- **能對外開放指定 Port 的伺服器（例如 2333）**
 

 
### **建議系統：**
 
 
- Ubuntu 20.04 / 22.04
 
- Debian 11 / 12
 
- 使用 systemd 運行守護程序
 
- 搭配 Nginx 進行反向代理與安全保護（可選）
 

  
## **四、下載並準備 Lavalink**
 
從官方 GitHub Releases 下載最新版本的 Lavalink：
 
[https://github.com/lavalink-devs/Lavalink/releases](https://github.com/lavalink-devs/Lavalink/releases)
 
將 `Lavalink.jar` 放在你的資料夾內，例如：
 `/home/lavalink/ `  
## **五、撰寫 application.yml（完整設定示範與解說）**
 
Lavalink 的運作完全依賴 `application.yml`，以下是可直接使用的完整配置：
 `server:   port: 2333 lavalink:   server:     password: "yourStrongPassword"     sources:       youtube: true       bandcamp: true       soundcloud: true       twitch: true       vimeo: true       http: true       local: false     bufferDurationMs: 400     frameBufferDurationMs: 5000     trackStuckThresholdMs: 10000     soundcloudClientId: null     youtubeConfig:       playlistLoadLimit: 6     ratelimit:       ipBlocks: []        strategy: RotateOnBan logging:   file:     path: ./logs/   level:     root: INFO     lavalink: INFO     lavaplayer: WARN ` 
### **關鍵設定解說**
 
#### **1. server.port**
 
Lavalink 對外提供服務的端口，預設為 2333。
 
#### **2. password**
 
Bot 連線 WebSocket 時必須使用的密碼。 務必設定成複雜字串以避免被第三方占用。
 
#### **3. sources**
 
決定是否啟用各平台音源。 若不需要某些來源，可關閉以減少不必要的 API 操作。
 
#### **4. bufferDurationMs / frameBufferDurationMs**
 
影響音訊延遲與流暢度。 一般建議保持預設，除非遇到延遲問題再做調整。
 
#### **5. logging**
 
用來控制輸出日誌細節，多數情況下 INFO 足夠。
  
## **六、啟動 Lavalink**
 
在存放 jar 的目錄執行：
 `java -jar Lavalink.jar ` 
若看到：
 `Started Launcher in X.XXX seconds ` 
表示 Lavalink 已成功運行，並在指定 port 等待 Bot 的連線。
  
## **七、Linux 伺服器必要設定：開放防火牆**
 
如果使用 UFW（Ubuntu 常見）：
 `sudo ufw allow 2333/tcp ` 
確認：
 `sudo ufw status `  
## **八、建立 systemd 服務（正式部署必備）**
 
創建：
 `/etc/systemd/system/lavalink.service ` 
內容：
 `[Unit] Description=Lavalink Audio Node After=network.target  [Service] User=ubuntu WorkingDirectory=/home/lavalink ExecStart=/usr/bin/java -jar Lavalink.jar Restart=always RestartSec=10  [Install] WantedBy=multi-user.target ` 
啟動：
 `sudo systemctl enable lavalink sudo systemctl start lavalink ` 
查看狀態：
 `systemctl status lavalink `  
## **九、在 Discord Bot 中串接 Lavalink（以 Erela.js 為例）**
 
以下為 Node.js 的標準連線方式：
 `const { Manager } = require("erela.js");  const manager = new Manager({   nodes: [     {       host: "你的伺服器IP",       port: 2333,       password: "yourStrongPassword",       secure: false     }   ],   send(id, payload) {     const guild = client.guilds.cache.get(id);     if (guild) guild.shard.send(payload);   } }); ` 
只需改：
 
 
- host
 
- port
 
- password
 

 
即可成功連線 Lavalink。
  
## **十、常見錯誤與技術排查**
 
### **1. Unable to connect**
 
檢查：
 
 
- 密碼是否正確
 
- Port 是否開放
 
- 防火牆是否阻擋
 
- SSL 是否被強制啟用
 

 
### **2. YouTube 加載失敗**
 
可能原因：
 
 
- IP 遭 YouTube 限制
 
- 使用公共 VPS 被風控
 
- 未啟用 youtube: true
 
- 未更新到最新版 Lavalink
 

 
### **3. 聲音延遲或卡頓**
 
可調整：
 `bufferDurationMs: 400 frameBufferDurationMs: 5000 ` 
或提升 VPS 性能。
  
## **十一、部署與架構建議**
 
為確保長期穩定：
 
 
- **每個 Bot 至少配置一個專用 Lavalink 節點**
 
- **大型架構使用多節點分散流量**
 
- **搭配 Nginx 與 IP 白名單保護通訊安全**
 
- **使用 systemd 讓 Lavalink 自動重啟與守護**
 
- **定期更新 JDK 與 Lavalink 版本**
 

 
對於高使用量 Bot，建議採用歐洲或北美較穩定 VPS，並避免使用廉價共享主機。
  
# **結語**
 
Lavalink 為 Discord 音樂系統提供高效、穩定、可擴充的音訊服務架構，透過集中式音訊解碼與 WebSocket 事件管理，大幅減輕 Bot 主程式的負擔。無論是單機個人 Bot 還是大型跨伺服器音樂平台，Lavalink 都能提供成熟可靠的音訊支援。透過正確配置 application.yml、建立 systemd 守護程序以及保持版本更新，即可建立穩定高效的音訊節點並投入正式運作。
