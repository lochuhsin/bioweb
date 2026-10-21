# bioweb

個人網站。黑底、等寬字，整個畫面用 ASCII 字元畫出來：首頁是幾團會飄動的字元雲，點一團就會拉近鏡頭、打開那個區塊。

設計靈感來自 [riccardobusetti.me](https://riccardobusetti.me/)。程式碼、圖示和佔位圖都是從頭寫的，沒有使用他網站的原始碼或素材。

## 跑起來

```bash
npm install
npm run dev
```

打開 http://localhost:5173 。

## 要改的地方

| 想改什麼 | 檔案 |
|---|---|
| 名字、職稱、所有文字 | `src/content.ts` |
| 首頁有哪幾團雲、各自的位置 | `src/content.ts` 的 `nodes` |
| 顏色、字體、間距 | `src/styles.css` 最上面的變數 |
| 頭像 | 照片放進 `public/`（去背的 PNG 最好看），再改 `about.portrait.src` |
| 公司 logo | 放進 `public/logos/`，在經歷裡加 `logo: '/logos/xxx.svg'`。沒放的話，會把縮寫畫成 ASCII |
| 履歷 PDF | 放到 `public/cv.pdf`。不想顯示這一列，就把 `cv` 設成 `null` |
| 網頁標題、搜尋描述、分享預覽圖 | `index.html` 的 `<head>` |
| 圖示 | `src/icons.ts`，用 `#` 直接畫 16×16 的像素圖 |

文字支援 `**粗體**` 和 `[連結](https://...)`。`/contact` 這種站內連結會留在網站裡切換。

## 預約時間（Contact 頁的 Book a call）

Contact 頁下面可以放一個月曆，訪客自己選時間約 coffee chat 或 meeting。月曆本身是 [Cal.com](https://cal.com) 的服務，免費方案就夠用。

1. 到 cal.com 註冊帳號。
2. 在 Settings → Calendars 連結你的 Google Calendar。這樣已經有安排的時間會自動擋掉，訪客預約後也會直接出現在你的行事曆上。
3. 在 Settings → Availability 設定你可以被約的時段和時區。
4. 在 Event Types 建立兩個活動，例如 `coffee-chat`（30 分鐘）和 `meeting`（45 分鐘），並選好會議連結（Google Meet、Cal Video 或 Zoom）。想先審核再接受的話，可以打開 Requires confirmation。
5. 把連結填進 `src/content.ts` 的 `booking.events`，只要填網域後面的部分，例如 `your-username/coffee-chat`。

`calLink` 留空的活動不會顯示。兩個都留空時，正式網站上不會出現這個區塊，`npm run dev` 時則會顯示這段設定說明。網站切換亮暗主題時，月曆也會跟著換。

## 分享縮圖（LinkedIn 等）

貼網址到 LinkedIn、Slack 時顯示的縮圖是 `public/social-card.png`（1200×630），版面在 `social-card.html`。改完版面後，先開著 `npm run dev`，再執行 `npm run social-card` 重新產生（需要電腦上有 Google Chrome）。

縮圖網址必須是完整網址。build 時會自動用 Vercel 的正式網域；如果縮圖沒出現，到 Vercel 專案的 Settings → Environment Variables 加一個 `SITE_URL`，值填你的網址（例如 `https://your-domain.com`），再重新部署。

## 檔案結構

```
src/
  main.ts      啟動、路由、主題切換
  content.ts   所有內容
  world.ts     首頁的字元雲（canvas）
  boot.ts      開機畫面的 ASCII 星球
  sections.ts  各區塊頁的 HTML
  ascii.ts     把圖片或文字轉成 ASCII
  scramble.ts  文字從亂碼組合出來的效果
  theme.ts     亮暗主題和像素換場
  icons.ts     像素圖示
  styles.css   所有樣式
```

## 部署

`npm run build` 會把純靜態網站輸出到 `dist/`。

- **Vercel（建議）**：匯入這個 GitHub repo 就好。`vercel.json` 已經設定好，`/about` 這類網址重新整理也開得起來。
- **GitHub Pages**：build 時會產生 `dist/404.html`，所以直接開 `/about` 也能用。但網站必須放在網域根目錄（自訂網域或 `帳號.github.io`）；放在 `帳號.github.io/bioweb/` 這種子路徑的話，路由要另外改。

## 動態效果與無障礙

- 系統開了「減少動態效果」時，背景會停住，轉場直接切換。
- 用鍵盤按 Tab，第一個出現的是「Pause ambient motion」按鈕，可以暫停背景動畫。
- 在區塊頁按 Esc 回首頁。
- 開機畫面每個分頁只出現一次（用 sessionStorage 記錄）。

## 授權

字體 JetBrains Mono、Work Sans、Instrument Sans 都是 SIL Open Font License。build 時會把它們的授權檔複製到 `dist/licenses/`。
