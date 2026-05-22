# Visual Direction v2 — 布農族家族 App 視覺翻盤

> 給 Claude Code 的標準工作指令。
> 開頭請讀:specs/coding_principles.md、specs/current-status.md、specs/north-star.md
> 遵守規則 10:先 Recon、後動工、每個 Step 之間等使用者回「ok」。
>
> **狀態:聖瑱師已拍板大方向、可動工 Step 1**

---

## 🎯 任務目標

把 `index.html` + `member.html` + `style.css` 從**純 Instagram 深色風**,翻成**白底 + 布農族五色**的「**Bunun 家族 App**」風格,同時**保留 Instagram 的互動視覺語彙**(限動漸層圈、愛心、雙擊動畫)讓年輕家人覺得熟悉。

不重做架構、不加文化圖騰(菱形紋、月曆刻紋等留給 6/15 後)、不影響功能流。

---

## 🌟 設計核心原則(這條最重要、Claude Code 動工每一步都要對照)

**結構走布農族、互動符號保留 IG。**

| 元素類型 | 走什麼風格 | 範例 |
|---|---|---|
| **結構性元素** | 布農族色票 | 整頁背景、文字、卡片底、邊框、分隔線、icon 顏色、Hero 區深色塊 |
| **IG 互動符號** | 保留原樣 | 限動五色漸層 ring、雙擊愛心動畫、按讚紅心、強調動作漸層(錄音鈕) |

**判斷模糊時的測試:** 這個元素是「**頁面結構的一部分**」還是「**使用者點下去會有反應的東西**」?
- 結構 → 布農族色
- 互動 → IG 視覺保留

---

## ⚠️ 文化敏感性原則(寫死、不可破)

1. **紅色不輕用為大面積結構色** ——「紅=英勇,獵過人頭/山豬/山鹿才能穿」是有文化重量的傳統意義。可以用在「按讚紅心」這種小面積互動符號(已拍板保留),但**不要拿來當整頁背景、卡片底、Hero 區大面積**。

2. **月亮(Buan)不可變成主視覺或時間軸** —— 聖瑱師明確指示:Buan 在文化中很重要,但「**不要變成月亮時間軸**」。意思是:
   - ❌ 不要做「依月相切換 UI 主題」
   - ❌ 不要把 feed 排序改成依月相
   - ❌ 不要在底部 nav 或 header 加月相圖示當裝飾
   - ✅ 之後可以在文案、icon、loading 動畫等地方**靜靜地存在**、不影響核心功能流

3. **木刻板曆(Islulusan)、菱形紋、百步蛇圖騰** —— 這些是布農族**最有辨識度的視覺資產**,但**不在這次 v2 範圍內**。6/15 後再花時間設計、避免趕著做變成「消費文化」的廉價裝飾。

4. **Claude Code 永遠不擅自生成布農語文字、稱呼、片語或語法。** 所有布農語內容由聖瑱師或家族成員提供,只負責「放進對的位置」。如需 placeholder 用中文「(等家人填入)」或留空。

---

## 🎨 色票:布農族五色 + IG 互動色

### 結構性色票(全頁主要色彩)

```css
:root {
  /* ===== 主背景:溫暖白底(不是純白、不刺眼)===== */
  --bg:           #fafaf7;   /* 麻線本色(布農白) */
  --bg-soft:      #f4f1ea;   /* 米色卡片底 */
  --bg-elevated:  #ffffff;   /* 最高一階(modal、彈出層)用純白 */
  --bg-hero:      #1a1a1a;   /* Hero / 重要區塊用沉黑(布農黑、土地、祖靈) */

  /* ===== 文字 ===== */
  --text:         #1a1a1a;   /* 主文字:沉黑 */
  --text-soft:    #4a4a4a;   /* 次主文字 */
  --text-muted:   #8a8a8a;   /* 灰字 */
  --text-on-dark: #f4f1ea;   /* 深底上的字(Hero 區用) */

  /* ===== 布農族五色語意命名(給之後文化元素用、非主結構)===== */
  --bunun-black:  #1a1a1a;   /* 黑泥黑 */
  --bunun-white:  #fafaf7;   /* 麻線白 */
  --bunun-red:    #a83232;   /* 薯榔紅(暗一階莊重紅、非互動紅心)*/
  --bunun-yellow: #d4a017;   /* 薑黃 */
  --bunun-green:  #4a6b3a;   /* 山藍青綠 */

  /* ===== 強調色(取代原本的粉紅 --accent)===== */
  --accent:       #d4a017;   /* 用薑黃當主要強調(取代 v1 的 #e85a8a 粉紅) */

  /* ===== 邊框 ===== */
  --border:       #e4ddd0;   /* 米色淡邊框 */
  --border-strong:#1a1a1a;   /* 黑色強邊框 */
}
```

### IG 互動色(保留、不要動)

```css
:root {
  /* ===== 限動五色漸層(Hero ring、貼文 avatar ring、限動圈)===== */
  /* background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); */

  /* ===== 強調動作漸層(大麥克風按鈕、底部錄音 nav、上傳按鈕)===== */
  /* background: linear-gradient(135deg, #f09433, #dc2743); */

  /* ===== 按讚紅心 ===== */
  --like-red:     #ed4956;   /* 保留 IG 經典愛心紅 */
}
```

---

## 🔠 字級與對比(解決「黑底看不到」的真實問題)

長輩比例不低、深色字閱讀困難。新版要明確提升:

| 用途 | v1 (舊) | v2 (新) | 理由 |
|---|---|---|---|
| 主文字色 | `#f2f2f2` 米白(在黑底) | `#1a1a1a` 沉黑(在白底) | 對比拉滿 |
| 次要文字色 | `#8a8a8a` | `#8a8a8a`(保留、但配白底已夠) | 對比夠 |
| 內文字級 | 14px | **16px**(內文)/ **18px**(重要說明) | 長輩老花友善 |
| 標題字級 | 20px | **22-24px** | 提升層次 |
| 行高 | 1.5 | **1.6** | 段落呼吸感 |
| 連結 / 互動文字 | 預設 | 加 underline 或加粗、不要只靠顏色辨識 | 色盲友善 |

---

## 🧭 元件對照表(逐元件講清楚改什麼)

### `index.html`(首頁)

| 區域 | v1 (深色) | v2 (布農白底) | 備註 |
|---|---|---|---|
| `body` 背景 | `--bg` 深炭 | `--bg` 麻線白 `#fafaf7` | 翻盤 |
| `app-header` 背景 | `rgba(20,20,20,.8)` 黑霧 | `rgba(250,250,247,.85)` 白霧 | backdrop blur 保留 |
| `app-header` 文字 | 米白 | `--text` 沉黑 | |
| `app-title` 「Istanda Mapasnava」 | 米白 | `--text` 沉黑 | 字級 20→22px |
| Icon buttons(➕❤️💬) | 米白 | `--text` 沉黑 | hover 改 `--bg-soft` |
| **限動圈** `.story__ring` | IG 五色漸層 | **完全保留 IG 五色漸層** ✅ | 互動符號、不動 |
| **限動已看過** `.story__ring--viewed` | `--bg-elevated` | `--border` 米灰 | 配合白底 |
| 限動 avatar 內部 | 灰漸層 `#4a4a4a→#6b6b6b` | **保留**(深色 avatar 在白底反而有對比) | 不動 |
| 限動名字 | 米白 / 灰 | `--text` / `--text-muted` | |
| **貼文卡片** `.post` 背景 | `--bg` | `--bg-elevated` 純白 + `--border` 邊框 + 圓角 | 像 IG 卡片浮在白底上 |
| 貼文卡片邊框 | 上下 1px border | **全邊框 1px + border-radius 12px** | |
| 貼文卡片 shadow | 無 | 加 `box-shadow: 0 1px 3px rgba(0,0,0,0.04)` 淡陰影 | 浮起感 |
| 貼文用戶名 | 米白 | `--text` 沉黑 | |
| 貼文 location | `--text-muted` | `--text-muted` | 不動 |
| 貼文圖區 `.post__media` | `--bg-soft` | `--bg-soft` 米色 placeholder | 圖載入前的底色 |
| **雙擊愛心動畫** `.heart-burst` | 白色大愛心 | **改成 `--like-red` 紅心**(白底白愛心會看不到) | 配色適應 |
| **按讚紅心** `.action-btn--liked` | `--like-red` | **完全保留** ✅ | 互動符號 |
| 按讚數字、留言文字 | 米白 | `--text` 沉黑 | |
| caption 文字 | 米白 | `--text` 沉黑、字級 14→**16px** | 易讀性 |
| 「查看全部 N 則留言」 | `--text-muted` | `--text-muted` | 不動 |
| 時間戳 | `--text-muted` 10px | `--text-muted` 10-11px | 略放大 |
| **底部 nav** 背景 | 黑霧 | 白霧 `rgba(250,250,247,.85)` | |
| 底部 nav icons | 米白 | `--text` 沉黑 | |
| **底部錄音按鈕光暈** `.nav-btn--record::before` | 漸層 15% 透明 | **完全保留** ✅ | 互動符號 |
| 「我」avatar 圈 ring | `--text` 米白 | `--text` 沉黑邊 | 配色適應 |

### `member.html`(個人頁面)

| 區域 | v1 | v2 | 備註 |
|---|---|---|---|
| `body` 背景 | `--bg` 深炭 | `--bg` 麻線白 | |
| Sticky header | 黑霧 | 白霧 | 對齊 index |
| Sticky header 文字 | 米白 | `--text` 沉黑 | |
| 返回 `.back-btn` 顏色 | 米白 | `--text` 沉黑 | |
| **Hero 區** `.member-hero` 背景 | `--bg-soft` 深 | **`--bg-hero` 沉黑 `#1a1a1a`** | **保留深色 Hero 塊**、像服飾的深色領片 |
| Hero 文字 | `--text` | **`--text-on-dark` 米白**(深底上的字) | 配色適應 |
| Hero 「N 則錄音」 | `--text-muted` | `rgba(244,241,234,0.6)` 米白半透明 | 在深底上保持可讀 |
| **Hero ring** | IG 五色漸層 | **完全保留 IG 五色漸層** ✅ | 互動符號 |
| Hero avatar 內部灰漸層 | `#4a4a4a→#6b6b6b` | **保留** | 跟首頁限動一致 |
| 錄音區 background | `--bg` | `--bg` 白 | |
| 「🎙 錄一段話」標題 | `--text` 米白 | `--text` 沉黑、字級 14→**16px** | |
| **錄音 placeholder 圓鈕** | 強調動作漸層 + 0.4 透明 | **完全保留** ✅ | 互動符號 |
| 「錄音功能開發中」字 | `--text-muted` | `--text-muted` | 不動 |
| 過去錄音 section 邊線 | `--border` 黑 | `--border` 米灰 | 配色適應 |
| 「過去錄音」標題 | `--text` 米白 | `--text` 沉黑、字級 14→16px | |
| 「清單載入中…」 | `--text-muted` | `--text-muted` | 不動 |
| 底部 nav | 同 index | 同 index | 一起改 |
| **友善錯誤畫面** `.error-screen` 背景 | `--bg` 深 | `--bg` 白 | |
| 錯誤標題 | `--text` 米白 | `--text` 沉黑 | |
| 錯誤說明文字 | `--text-muted` | `--text-muted` | 不動 |
| 錯誤「回首頁」按鈕 | `--bg-elevated` | `--bg-soft` 米色 + `--border` 邊框 | 配色適應 |
| **全域 toast** `.global-toast` 背景 | `--bg-elevated` 深 | `--bg-hero` 沉黑 + `--text-on-dark` 字 | toast 在白底上用深色更有重量感 |

### 「我是誰」Modal(style.css 結尾的 .identity-modal__*)

| 元素 | v1 | v2 |
|---|---|---|
| `.identity-modal__backdrop` | rgba(0,0,0,0.65) | **保留**(白底上的 backdrop 仍用半透明黑) |
| `.identity-modal__panel` | `--bg-soft` 深 | `--bg-elevated` 純白 + 上方圓角 + 加 `box-shadow` |
| `.identity-modal__title` | `--text` 米白 | `--text` 沉黑 |
| `.identity-row` background | `--bg-soft` | `--bg` |
| `.identity-row:hover` | `--bg-elevated` | `--bg-soft` |
| `.identity-row__avatar` | 灰漸層 | **保留**(跟其他 avatar 一致) |
| `.identity-modal__cancel` | `--bg-elevated` | `--bg-soft` + `--border` 邊框 |

---

## 🪜 Step 順序

### Step 1:翻盤 `style.css` `:root` 色票 + 字級

1. 把 `:root` 整段替換成本文「色票」區段的新變數
2. **保留** `--like-red`、限動五色漸層(寫在註解、不要刪)、強調動作漸層
3. body 字級從 14px 改成 16px、行高從 1.5 改成 1.6
4. **不要刪舊變數名**(`--bg`、`--text`、`--accent` 等),只改它們的「值」、確保 index/member 的所有 `var(--xxx)` 引用仍然有效

**A 階段自測**:
- 開 `index.html` 線上版 → 整頁應該變成白底 + 黑字、限動圈仍漸層、按讚仍紅心、底部錄音按鈕仍漸層
- 開 `member.html?id=2l95ZhadEN8Xv8hijWty` → Hero 區仍是深色塊(因為 Hero 用 `--bg-hero` 沉黑、不是 `--bg`)

**B+C+D**:push → 線上 Ctrl+Shift+R → 線上實測

### Step 2:細部對齊(改一些「色適應」問題)

1. `.heart-burst`(雙擊大愛心動畫):從白色改成 `--like-red` 紅色(白底上白愛心看不到)
2. `.app-header` 的 `rgba` 從 `rgba(20,20,20,.8)` 改成 `rgba(250,250,247,.85)`
3. `.bottom-nav` 的 `rgba` 同上
4. `.global-toast` 背景改成 `--bg-hero` + 字色 `--text-on-dark`(白底上的 toast 用深色更有重量感)
5. 貼文卡片從「上下 border 無圓角」改成「全 border + border-radius:12px + 淡 shadow」(在白底上需要明顯的卡片邊界)

**A 階段自測**:
- 雙擊貼文 → 紅心應該看得到、不會白白消失
- Header / 底部 nav blur 效果在白底下仍清晰
- toast 在白底上跳出時是深色、有對比

**B+C+D**:push → 線上實測

### Step 3:`member.html` Hero 區深色塊適配

1. `.member-hero` 背景改 `--bg-hero` 沉黑
2. `.member-hero__name`、`.member-hero__nick`、`.member-hero__count` 文字色改成 `--text-on-dark` / 半透明米白
3. `.member-hero__ring-inner` 內部背景改 `--bg-hero`(讓 ring 中間是深色、不是白色——保持 Hero 整塊深色感)
4. Sticky header 在 Hero 之上,sticky header 是白底,Hero 是深底:**這個對比是刻意的**、不要試圖統一

**A 階段自測**:
- 4 種 URL 全部跑一遍、跟 v1 的 Step 2 驗證項目對照
- Hero 區應該像「深色織片」鑲在白色頁面上
- 文字在深底上仍清晰可讀

**B+C+D**:push → 線上實測

### Step 4:`error-screen` 適配 + Modal 適配 + 各種小調

1. `.error-screen` 背景改白、文字改深
2. 「我是誰」modal 各 class 配色翻盤(對照本文「Modal」表格)
3. 各處 inline style / 寫死色碼最後一次掃除

**A 階段自測**:
- `member.html?id=不存在ID` 看錯誤畫面是白底
- 首頁如果有 modal、開起來是白底
- 整個 App grep 不到任何 `#141414` / `#f2f2f2` / `#8a8a8a` 以外的舊深色寫死值(`--text-muted` 仍可以是 `#8a8a8a`)

**B+C+D**:push → 線上實測

### Step 5:DoD(完成定義)+ 截圖回報

完成定義:
- [ ] 首頁整頁白底、限動漸層保留、貼文卡片有米色邊框 + 圓角 + 淡 shadow
- [ ] 雙擊愛心是紅色、清楚可見
- [ ] 個人頁面 Hero 是深色塊、ring 漸層保留、文字在深底上可讀
- [ ] 友善錯誤畫面白底
- [ ] 底部 nav 白霧效果、錄音按鈕漸層保留
- [ ] 4 種 member URL 全部 PASS
- [ ] 線上版 GitHub Pages 用無痕視窗看一切正常
- [ ] 在手機上看一遍(longterm 北極星是行動裝置體驗)

完成後告知聖瑱師、附上 5-6 張截圖(首頁 / 個人頁 Hero / 錯誤頁 / 雙擊愛心一閃 / modal)。

---

## ⚠️ 不要做的事

- ❌ **不要動 HTML 結構**(僅微調 class、不增刪節點)
- ❌ **不要加任何文化圖騰**(菱形紋、月曆刻紋、山脈剪影、百步蛇 SVG)——這是 6/15 後的事
- ❌ **不要做月亮相關 feature**(月相切換、月曆視圖、月相 icon 等)
- ❌ **不要動 script.js 的邏輯**(只是改 CSS、HTML 微調)
- ❌ **不要動任何 specs/ 檔案**(這份 spec 是給你照做的、不是要你改它)
- ❌ **不要自己生成布農語文字、稱呼、片語**——所有布農語由聖瑱師提供
- ❌ **不要把限動漸層 ring 改色**(已拍板保留 IG 五色)
- ❌ **不要把按讚紅心改色**(已拍板保留 IG 紅 `--like-red`)
- ❌ **不要把錄音按鈕漸層改色**(已拍板保留 IG 強調動作漸層)

---

## 📞 規則 6:不確定就問

特別容易遇到的:
- 某個元素該歸「結構」(改色)還是「互動符號」(保留)——**問聖瑱師**
- 字級拉大後桌機版超出 `--max-w` 寬度怎麼處理——**問聖瑱師**
- 在白底上發現某個 IG 漸層 ring 看起來很奇怪——**先截圖、再問**

---

## 📚 參考資料

- v0 原 style.css(已上線)、不要刪除舊變數名,只改值
- 教師手帳工程準則:`specs/coding_principles.md`(規則 1、2、9 特別相關)
- 規格 task-recording-core.md 視覺章節(2026-05-22 patch、本次 v2 完成後可同步更新)

---

*Created: 2026-05-22*
*由聖瑱師拍板:大方向白底布農族五色、按讚保留 IG 紅心、Hero ring 保留 IG 五色漸層、文化元素留 6/15 後*
