# 專注學習

個人讀書追蹤工具。資料存在 `data/study_data.xlsx`，可直接用 Excel 開啟。

## 啟動方式

1. 安裝 Node.js（https://nodejs.org）
2. 在專案資料夾執行：

```
npm install
```

3. 複製環境變數檔：

```
cp .env.example .env.local
```

4. 用文字編輯器打開 `.env.local`，填入 OpenAI API Key：

```
OPENAI_API_KEY=sk-你的金鑰
```

5. 啟動：

```
npm run dev
```

6. 開瀏覽器前往 http://localhost:3000

## 資料備份

資料存在 `data/study_data.xlsx`，直接複製這個檔案即可備份。
