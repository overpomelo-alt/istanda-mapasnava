# Istanda Takiscipanan — 專案指引

## 語言
- 一律使用「繁體中文(台灣)」回覆。不要用日文、簡體或英文敘述(程式碼/識別字除外)。

## 部署
- 走 GitHub Pages(`https://overpomelo-alt.github.io/istanda-mapasnava/`),不是 Firebase Hosting。
- 上線 = `git push` 到 `main`;沒有獨立的 deploy 指令。
- Apps Script 後端(`apps-script/istanda-mapasnava-receiver.gs`)不在 git 部署鏈內,改了要手動貼到 Apps Script 編輯器重新部署。

## 改名注意
- 顯示名稱是「Istanda Takiscipanan」。
- 但小寫的 `istanda-mapasnava`(Firebase projectId / authDomain / storageBucket、GitHub repo、網址、路徑、Drive 母資料夾名)是 infra,**絕對不能改**。
