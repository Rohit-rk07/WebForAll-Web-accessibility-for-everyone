# Operations Runbook

Operational guidance for running the Accessibility Analyzer in production. Companion to `ARCHITECTURE.md` (design) and `API_DOCUMENTATION.md` (contracts).

## Deployment Checklist

Before shipping a release:

1. **Secrets** — rotate all values in `server/.env`: `SECRET_KEY`, `CSRF_SECRET`, `MONGODB_URI`, `GEMINI_API_KEY`. Never reuse the demo values from `.env.example`.
2. **Origins** — set `ALLOWED_ORIGINS` to the real client domain(s). Wildcard `*` is rejected at startup when credentials are in use.
3. **Demo login / seeding** — set `ALLOW_DEMO_LOGIN=false` and `SEED_DEFAULT_USERS=false` unless the demo is intentional.
4. **API base URL** — set `VITE_API_URL` at build time, or provide `window.__APP_CONFIG__.API_URL` at runtime. The client fails fast (throws) in production if the URL is missing.
5. **TLS** — terminate TLS at the proxy/load balancer; the app emits `Strict-Transport-Security` when `X-Forwarded-Proto: https` is present. Ensure the proxy forwards that header.
6. **Dependencies** — `pip install -r server/requirements.txt` (Python 3.11) and `npm ci` in `client/`. Verify Playwright browsers: `playwright install` (see `server/analyzer/playwright_helper.py`).
7. **Tests** — run the full suites before deploy (see below).

## Environment Variables (server)

All optional unless marked required:

| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URI` | — (required) | Atlas connection string with database |
| `MONGODB_DB_NAME` | `accessibility-analyzer` | Database name |
| `SECRET_KEY` | — (required) | JWT signing secret (32+ random chars) |
| `CSRF_SECRET` | — (required) | CSRF token signing secret |
| `GEMINI_API_KEY` | — | Enables AI chat/explain; endpoints 503 without it |
| `JWT_ISSUER` / `JWT_AUDIENCE` | `accessibility-analyzer` | Token claims validation |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token lifetime |
| `ALLOWED_ORIGINS` | — | Comma-separated CORS origins |
| `APP_ENV` | `production` | Environment flag |
| `ALLOW_DEMO_LOGIN` | `false` | Enable/disable demo login |
| `SEED_DEFAULT_USERS` | `false` | Seed demo/admin users on startup |
| `RESET_EMAIL_COOLDOWN_MINUTES` | `2` | Password-reset cooldown |
| `TRUSTED_PROXY_IPS` | — | Proxy IPs for correct client IP detection |
| `ANALYSIS_TIMEOUT_SECONDS` | `90` | Per-analysis deadline (504 on expiry) |
| `AI_TIMEOUT_SECONDS` | `30` | Per-AI-request deadline (504 on expiry) |
| `X_CONTENT_TYPE_OPTIONS` | `nosniff` | Header value |

## Tests

```bash
# Backend (from server/)
python -m pytest tests/ -q

# Frontend (from client/)
npm ci
npm run build
npm run lint
npx vitest run
```

Run backend + client suites in CI on every push before deploy.

## Backup & Restore

The database (`MongoDB Atlas`) holds users, analyses, and password-reset tokens. Only `analyses` and `users` matter operationally.

### Backup
- Schedule Atlas **Continuous Cloud Backups** or automated snapshots (recommended interval: daily, PITR enabled).
- For a quick manual dump:
  ```bash
  mongodump --uri "$MONGODB_URI" --db accessibility-analyzer --archive=backup-$(date +%F).archive
  ```
- Store archives off-site (object storage) with encryption at rest.

### Restore
```bash
mongorestore --uri "$MONGODB_URI" --db accessibility-analyzer --archive=backup-YYYY-MM-DD.archive
```
Verify after restore: `GET /health`, a demo login, and `GET /history` for a known user. Restore drops/overwrites targeted collections only; never restore a backup from an untrusted source.

## Incident Response

| Symptom | First checks | Likely cause / fix |
|---|---|---|
| `/health` returns unhealthy | App logs; `GET /health` | Deployment or config issue; check `SECRET_KEY`/env load |
| `503` on `/ai/*` | Log "AI service not available" | `GEMINI_API_KEY` missing/invalid; set it and restart |
| `504` on `/analyze/*` | Log "Analysis timed out" | Target page too slow; raise `ANALYSIS_TIMEOUT_SECONDS` or block the domain |
| `504` on `/ai/*` | Log "AI timed out" | Gemini slow/rate-limited; raise `AI_TIMEOUT_SECONDS` short-term |
| `413 Payload Too Large` | Client behavior | Request/upload exceeds 6 MB / 5 MB limits; legit users should split or resize inputs |
| `429 Too Many Requests` | Rate-limit headers | Normal under load; raise limits only after reviewing abuse |
| High error rate on `/analyze/*` | `X-Request-ID` in server logs | Playwright/browser issues; check `GET /health/playwright` |
| Stored XSS suspected | Review sanitized `nodes[].html` in history | Sanitizer ran at insert; verify client also escapes content before rendering |

**General procedure:**
1. Open the logs (they include `X-Request-ID` for correlation).
2. Confirm whether the issue is auth, CORS, DB, browser, or AI from the error category.
3. Apply the config/limit fix above; redeploy.
4. If a release introduced it, roll back to the previous deploy (see Rollback) and open a bug.

## Data Deletion & Privacy

- A user can delete their account and all associated data via `DELETE /users/me` (removes analyses + password-reset tokens + the user document) or in-app account settings.
- An operator can delete all of a user's data in Mongo directly if needed:
  ```js
  db.analyses.deleteMany({ owner_email: "user@example.com" });
  db.users.deleteOne({ email: "user@example.com" });
  db.password_reset_tokens.deleteMany({ email: "user@example.com" });
  ```
- Password-reset tokens are short-lived (TTL) and rate-limited.

## Dependency Updates

Pin major/minor in `requirements.txt` and `client/package.json`. Update cadence:

- **Security patches/point releases**: apply within 1-2 weeks.
- **Minor upgrades**: quarterly, with full `pytest` + `npm run build/lint` + `vitest` before merge.
- **Major upgrades** (FastAPI, React, Playwright, Passlib/bcrypt): plan a dedicated change with a release branch; watch for breaking changes (FastAPI middleware/`lifespan`, Playwright browser installs, bcrypt cost).
- After any dependency bump, re-run the Playwright browser install (`playwright install`) and smoke-test a URL analysis.

## Rollback

- Keep the previous deploy artifact (Docker image tag / build) available.
- On failure: redeploy the previous tag, restore DB from the pre-release backup if the migration touched data, and verify `/health` + smoke tests.
- Do not amend/redeploy the failed commit; create a fix commit from the released tag.

## Monitoring & Alerts

- Use `GET /health` (app + DB) and `GET /health/playwright` (browser) for liveness probes.
- Alert on: `429` spikes, `5xx` rate, `504` rate, and AI request failure rate.
- Every response carries `X-Request-ID`; correlate with server logs for debugging.