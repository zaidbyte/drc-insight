# Anonymous AI Assistant

A blank web page that quietly answers multiple-choice questions using Google Gemini 2.5 Flash. The page has no visible UI — answers appear only in the browser tab title and are copied to the clipboard when permissions allow.

## How it works

- On load the page requests screen-sharing permission (`navigator.mediaDevices.getDisplayMedia`).
- Every 10 seconds it captures a JPEG frame from the shared stream and sends it to `/api/analyze`, which forwards it to Gemini 2.5 Flash.
- Gemini returns a single character (`A`, `B`, `C`, `D`, or `?`) which is written to `document.title` and copied to the clipboard.
- Pasting text anywhere on the page (Ctrl/Cmd+V) sends it to `/api/ask` for a text-only answer.
- Pressing Ctrl/Cmd+C re-copies the latest answer.

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and set GEMINI_API_KEY
npm run dev
```

Open <http://localhost:3000> in Chrome and grant screen-share permission. Keep an eye on the browser tab title.

## Environment

| Variable         | Description                              |
| ---------------- | ---------------------------------------- |
| `GEMINI_API_KEY` | Google AI Studio key for Gemini 2.5 Flash |

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the project at <https://vercel.com/new>.
3. Add `GEMINI_API_KEY` under **Project Settings → Environment Variables**.
4. Deploy. No further configuration required.

Or via CLI:

```bash
npm i -g vercel
vercel
vercel env add GEMINI_API_KEY
vercel --prod
```

## Notes

- Desktop Chrome is the supported target. The Screen Capture API and clipboard write may not work on mobile or in some embedded contexts.
- Clipboard writes require the document to be focused; click the page once if writes fail silently.
