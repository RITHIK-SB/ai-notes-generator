# AI Notes Generator

Turn long study material into smart, structured notes with AI. Paste text or upload a
PDF / DOCX / TXT document, choose how you want your notes (length, style, difficulty),
generate, review, edit, save, and download them.

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide icons
- **Backend:** Node.js + Express + TypeScript (secure server-side AI calls - the API key never touches the frontend)
- **Extraction:** pdfjs-dist (PDF), mammoth (DOCX), native decoding (TXT)
- **AI:** configurable provider - OpenAI-compatible APIs (OpenAI, Groq, OpenRouter, Ollama...) or Anthropic

## Quick start

Use Node.js 22.13 or newer within Node 22 (see `.node-version`). The PDF parser
does not support Node 20. Render must have `NODE_VERSION=22` in its environment;
an existing dashboard override takes precedence over the blueprint.

```bash
npm install               # root dev tooling
npm run install:all       # installs server/ and client/
npm run build             # builds both
npm start                 # serves API + built frontend on http://localhost:4000
```

Development mode (hot reload):

```bash
npm run dev               # API on :4000, Vite dev server on :5173 (proxies /api)
```

## Configuring the AI provider (required for generation)

The app builds, runs, extracts documents, and manages notes without any credentials.
Note generation returns a clear configuration message until you add an API key:

```bash
cp server/.env.example server/.env
# edit server/.env:
#   AI_PROVIDER=openai-compatible      # or "anthropic"
#   AI_API_KEY=sk-...                  # your key (server-side only)
#   AI_MODEL=gpt-4o-mini               # any model your provider offers
#   AI_BASE_URL=https://api.openai.com/v1   # Groq: https://api.groq.com/openai/v1, OpenRouter: https://openrouter.ai/api/v1
npm start
```

Works with any OpenAI-compatible endpoint. For Anthropic set `AI_PROVIDER=anthropic`
and `AI_MODEL=claude-3-5-haiku-latest` (or another Claude model).

## Tests

```bash
npm test
npm run test:production # compiled server + real multipart PDF/DOCX/TXT uploads
```

40 automated tests cover text extraction (real PDF/DOCX/TXT files, corrupted and
scanned documents), preprocessing, chunking, prompt construction, and the full API
surface (validation, missing-key handling, provider errors, rate limits, timeouts).

## Architecture

```
server/src
  routes/        /api/generate-notes, /api/extract, /api/config-status
  services/      extraction, pdf, preprocess, chunking, prompt, ai (provider abstraction)
  middleware/    rate limiting, error handling
client/src
  pages/         Home, Generate, SavedNotes, Settings
  components/    Navbar, ConfigPanel, UploadArea, ResultView, MarkdownView, Alert
  lib/           localStorage persistence, export (TXT/MD/PDF), formatting
```

## Security & privacy

- API keys live only in server environment variables; never in the frontend bundle.
- Uploaded files are validated by content (magic bytes), processed in memory, and never stored.
- Generation is rate-limited per IP; request bodies are schema-validated.
- AI output is rendered through a Markdown renderer with raw HTML disabled.
- Saved notes use browser localStorage: they stay on the current device/browser and
  are lost if browser data is cleared (stated in the UI).
- Study material is sent to the configured AI provider only when you press Generate.

## Notes on scope

- OCR for scanned documents is **not** implemented; image-only PDFs are detected and
  the user gets a clear explanation instead of a fake success.
- No authentication: persistence is browser-local by design (see section 11 of the spec).
