# Bright Smile Frontend (React + TypeScript)

## Run

```bash
cd frontend
npm install
npm run dev
```

The dev server proxies `/api` to `http://localhost:8000`.

## Pages
- Dashboard: `/dashboard`
- Leads: `/leads`
- Agents: `/agents`

Set `X-API-Key` on Agents page to run outreach (POST /api/v1/agents/trigger-outreach).
