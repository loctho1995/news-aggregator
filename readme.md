# News Aggregator (Refactored)

## Run
```bash
npm i
npm run dev
# open http://localhost:3000
```

## Structure
- `server/` – Express app
  - `index.js` – bootstrap
  - `routes/` – `/api/news`, `/api/summary`, `/api/sources`
  - `services/` – aggregator + summary/translation/extraction
  - `utils/` – caches
  - `constants/` – sources list
- `public/`
  - `index.html`
  - `app.js`

## Notes
- Static served at `/public/*`; homepage `"/"` serves `public/index.html`.
- Keep your env vars in `.env` (optional).
- All previous query params and streaming NDJSON still work.
