# Attentia — Development Plan & Status

Attention-rewards marketing platform: advertisers fund campaigns, verified participants watch sponsored content, rate it, and earn micro-rewards.

_Last reviewed: 2026-11-07, against commit `22fd4bd` (PR #3 merged)._

## Legend

| Marker | Meaning |
|---|---|
| 🟢 | **Done**: works as described in the proposal |
| 🟧 | **Partial**: built on one side only (usually the backend API exists but the dashboard still uses mock data), or a development stand-in for the real thing |
| 🟣 | **To do**: not started |

## Where the codebase stands

There are now two halves:

- **Backend (done at the API level).** FastAPI + PostgreSQL + Redis + Celery + S3-compatible storage, all in Docker Compose. Modules: users/auth, packages, campaigns, assets (uploads, FFmpeg, YouTube), verification, rewards (ledger), payments (deposits and withdrawals) and analytics. 18 integration tests pass against real Postgres, Redis and S3.
- **Frontend (mostly still mock).** Login and registration call the API (JWT). Everything else on the participant dashboard still comes from hardcoded state in `src/context/DashboardContext.tsx`, including tasks, balances, deposits and withdrawals. The rewards and verification rules therefore run on the client, not the server.

**The biggest gap is wiring the dashboard to the API.** Most items below are 🟧 for that reason. There is still no admin or advertiser dashboard UI, although the admin and advertiser API endpoints exist.

## Progress since the last review (2026-11-06)

| Commit / PR | Change |
|---|---|
| `641200f` | FastAPI backend, Docker deployment, API-backed auth (replaced the hardcoded login) |
| `edf0218` | Video ads served as embedded YouTube videos (`YouTubeAdPlayer`) |
| `97ed54f` | Security fix: removed the hardcoded seed admin password flagged by GitGuardian. Dev admin password is now generated or set via `SEED_ADMIN_PASSWORD`. |
| `cbbc404` | Seed reuses existing users matched by email or username (fixes the failing `migrate` step) |
| `7c8f5f0` | Ads autoplay (muted fallback), can't be paused, unlock the review at 29s and are cut at 30s. All 8 task cards have a matching YouTube video. |
| `b9a7894` (PR #3) | A 1–5 star rating is required before submitting a task |

---

## 1. Foundations

- 🟢 Project scaffold (React 19, Vite, Tailwind v4, TypeScript)
- 🟢 Marketing landing page: hero, how it works, packages, ad-interaction demo, dashboard preview, security, FAQ, CTA, footer, legal modal
- 🟢 Light/dark theme toggle
- 🟢 Shared domain types (`src/types.ts`) and typed API client (`src/lib/api.ts`)
- 🟧 Frontend framework. The proposal says React / Next.js; the project is React + Vite + React Router, with no SSR.
- 🟢 Backend API (Python / FastAPI, `/api/v1`)
- 🟢 PostgreSQL schema with Alembic migrations (users, packages, subscriptions, campaigns, assets, interactions, ledger, deposits, withdrawals)
- 🟢 Redis caching and Celery workers, with beat jobs for deposit scanning, deposit expiry and campaign status sync
- 🟢 S3-compatible object storage (SeaweedFS locally) with presigned uploads and downloads
- 🟢 FFmpeg pipeline: probe, thumbnails, image conversion to WebP
- 🟢 Docker Compose deployment: postgres, redis, objectstore, migrate, api, worker, beat, web (nginx)
- 🟢 Modular separation: users, campaigns, assets, verification, rewards, payments, analytics
- 🟧 **Secrets and configuration.** Production refuses to start with weak JWT, address-derivation or S3 secrets. Local dev still uses default passwords in `docker-compose.yml` and `deploy/seaweedfs-s3.json`.

## 2. Participant Dashboard (§4.1)

- 🟢 **Registration and authentication.** Register and log in through the API, JWT stored client-side and validated against `/users/me` on load. No OAuth yet.
- 🟧 **Identity verification (KYC).** Users have a `kyc_status` that admins can change through the API, and withdrawals require `verified`. There is no document upload or verification provider.
- 🟧 **Participation package selection.** Packages live in the database and admins can create and edit them through the API. The dashboard still shows hardcoded tiers.
- 🟧 **Daily task quota.** Enforced by the server per package. The dashboard counts on the client and never resets.
- 🟧 **Sponsored content discovery.** The API serves a live campaign feed (`/campaigns/feed`) with thumbnails. The dashboard shows 8 hardcoded video tasks instead.
- 🟢 **Video ad player.** Embedded YouTube player: autoplays (muted when the browser blocks sound), can't be paused or scrubbed, pauses while the tab is hidden, unlocks the review after 29s of real viewing and is cut at 30s.
- 🟢 **Rating and feedback UI.** A 1–5 star rating is mandatory. Non-video tasks also ask a comprehension question.
- 🟧 **Free-text qualitative feedback.** The server enforces it when a campaign sets `requires_feedback`. There is no input for it in the dashboard.
- 🟧 **Reward balance tracking.** Balances come from the ledger via the API. The dashboard shows mock numbers.
- 🟧 **Deposit and withdrawal management.** API complete (see §9 and §10). The dashboard flow is still simulated.
- 🟧 **Task completion and transaction history.** The API exposes interactions and ledger entries. The Activities tab uses mock data.
- 🟧 **Account and security settings.** Profile editing exists in the API (`PATCH /users/me`) and the UI. 2FA is a boolean flag only, with no TOTP.
- 🟢 Notification toasts for completed actions

## 3. Advertising Campaign Engine (§4.2)

- 🟢 Campaign model: name, brand, category, objective, schedule, daily limit, reward rate, budget, watch rules, rating prompt, question, options, demo flag
- 🟢 Campaign create, update and status API (advertisers and admins)
- 🟢 Creative uploads: direct upload, presigned upload, reprocessing, and YouTube registration with optional Data API metadata
- 🟧 **Audience targeting.** A `targeting` field is stored; the feed does not filter on it yet.
- 🟢 Campaign activation and expiry (scheduled status sync job)
- 🟢 Campaign performance tracking (advertiser analytics endpoint)
- 🟣 Advertiser dashboard UI: upload creatives, configure campaigns, allocate budget, monitor engagement

## 4. Attention Verification Engine (§4.3)

- 🟧 **Minimum watch duration.** The server rejects submissions without enough elapsed and watched time. The dashboard enforces 29s on the client, but doesn't send playback events or submit through the API.
- 🟢 Playback-event tracking on the server: play, pause, progress, seek, hidden and visible, with watched time accrued only from real forward playback
- 🟧 **Mandatory rating and question.** Enforced by the server (rating 1–5, valid option, correct answer when set) and by the dashboard, but the dashboard doesn't use the server path yet.
- 🟢 Duplicate prevention and per-campaign daily limits (server)
- 🟢 Suspicious-playback detection: seeks ahead and impossible progress are counted, and more than 3 rejects the interaction
- 🟢 User and session verification (JWT on every interaction call; interactions belong to their user)
- 🟧 **Server-side verification before rewards are credited.** Implemented in the API. The dashboard still credits rewards on the client in `completeTask`.

## 5. Administrative Dashboard (§4.4)

The backend has admin endpoints. There is **no admin UI** yet.

- 🟧 User management (list and update users via API)
- 🟧 KYC review and approval (set `kyc_status` via API)
- 🟧 Package management (create and edit packages via API)
- 🟧 Campaign management and moderation (create, edit, change status via API; only admins can mark campaigns as demo)
- 🟧 Reward rate configuration (per-campaign `reward_rate` via API; platform fee set in config)
- 🟧 Withdrawal monitoring and approval (approve and reject via API)
- 🟣 Fraud and suspicious-activity monitoring view
- 🟧 Platform analytics (admin analytics endpoint)
- 🟣 User support management
- 🟣 System configuration and audit log UI
- 🟢 Role-based permissions (participant, advertiser, admin) on the API

## 6. Demo Advertising Content (§5)

- 🟧 **Dashboard ad library.** 8 cards, each with an embeddable YouTube video (Blender open movies: Big Buck Bunny, Sintel, Tears of Steel, Elephants Dream, Spring, Agent 327, Caminandes 2 and 3). Card text matches each film. These are short films rather than real commercials, and the proposal's target is 10–20 ads across 8 industries.
- 🟧 **Backend demo campaigns.** The seed creates 6 fictional-brand demo campaigns across industries, without video creatives.
- 🟢 Demo vs. production flag on campaigns (`is_demo`)
- 🟣 A visible "Demonstration content" marking in the dashboard
- 🟣 Dummy MP4 creatives (H.264/AAC, 360p–720p, 16:9, 15–60 s) with thumbnails
- 🟢 Creatives can be swapped through the API without schema changes

## 7. Participant Engagement Workflow (§6)

| Step | Status |
|---|---|
| 1. Registration | 🟢 Through the API |
| 2. Identity verification | 🟧 Status field and admin API; no provider |
| 3. Package selection | 🟧 API with simulated deposits; dashboard is mock |
| 4. Content discovery | 🟧 API feed exists; dashboard uses hardcoded cards |
| 5. Ad engagement | 🟢 Autoplaying, unpausable 30s YouTube ads |
| 6. Rating and evaluation | 🟢 Mandatory star rating (free-text feedback 🟧) |
| 7. Task verification | 🟧 Implemented on the server; dashboard not wired |
| 8. Reward allocation and notification | 🟧 Ledger credit on the server; dashboard credits on the client |

## 8. Reward and Participation Model (§7)

- 🟢 Per-campaign reward rate (the dashboard still shows a flat $0.50)
- 🟢 Reward calculation checks budget, quota, verification and platform fee before crediting
- 🟢 Append-only ledger with sub-accounts (deposits, rewards, pending withdrawal, withdrawn, fees, packages); balances are sums of entries
- 🟧 **Non-guaranteed reward messaging.** Neutral wording is in place; legal and compliance review still needed.

## 9. Deposits and Blockchain Integration (§8)

- 🟢 Networks: TRC-20, ERC-20 and Polygon. (Confirm the exact assets in the UI: USDT TRC-20, USDT ERC-20, USDC Polygon.)
- 🟢 Unique deposit address per deposit (deterministic derivation; no private keys stored)
- 🟢 Confirmation counting (12 by default, configurable) with pending, confirmed, underpaid and expired states
- 🟢 Package activation when a deposit confirms
- 🟢 Scheduled scanning of pending deposits and expiry of stale ones
- 🟧 **Blockchain monitoring.** The `ChainMonitor` seam exists, but the only implementation is the development simulator (`/deposits/{id}/simulate`). No RPC provider yet.
- 🟧 **Address validation.** Payout addresses are validated per network. Token-contract validation needs the real monitor.
- 🟣 Automated reconciliation against the chain
- 🟣 Production custody: HD-wallet xpub derivation or a custody provider
- 🟣 Blockchain explorer links in deposit history

## 10. Wallet and Withdrawals (§9)

- 🟢 Ledger separates deposits, rewards, pending amounts and withdrawn funds
- 🟢 Withdrawal requests check KYC, active package, minimum amount, balance and network address, and charge the per-package fee
- 🟢 Admin approval or rejection, with the reserved amount reversed on rejection
- 🟧 **Dashboard.** Balances and the withdrawal flow are still simulated in the UI.
- 🟧 **Payout wallet whitelist.** UI only; the server doesn't enforce it.
- 🟣 Real on-chain payout dispatch (approval currently records a transaction hash supplied by the admin)

## 11. Analytics and Reporting (§10)

- 🟧 **Participant analytics.** API endpoint exists; the Overview tab shows mock data.
- 🟧 **Advertiser analytics.** API covers verified views, completion, average rating, feedback and budget use. No UI.
- 🟧 **Admin analytics.** API endpoint exists. No UI.

## 12. Security and Platform Integrity (§12)

- 🟢 Authentication and sessions (bcrypt passwords, JWT); hardcoded client credentials removed
- 🟢 Hardcoded seed admin password removed from the code. It remains in git history (commits `f672624`, `641200f`), so any environment that used it must have it changed.
- 🟧 KYC integration (status field and withdrawal gate; no provider)
- 🟢 Server-side task validation, duplicate prevention and suspicious-playback detection
- 🟣 Rate limiting
- 🟧 Secure payment verification (confirmation counting done; real chain monitoring to do)
- 🟢 Financial audit trail through the append-only ledger
- 🟣 Admin action audit logs
- 🟢 Role-based permissions on the API
- 🟣 Encryption of sensitive data at rest
- 🟣 Real two-factor authentication (TOTP)

## Out-of-proposal items in the codebase

- 🟢 **Referral and network system** (Network tab, 3 levels, commissions). Frontend mock only. Decide whether it stays: multi-level commissions on top of paid entry packages can raise regulatory concerns alongside the "no guaranteed returns" positioning.
- 🟧 **`@google/genai` dependency and AI Studio metadata.** Still present and unused. Remove them or define what they're for.

## Known inconsistencies to resolve

- The dashboard's ad rule (unlock at 29s, cut at 30s) is client-side only. The backend's `display_seconds` defaults to 15 and the seeded demo campaigns use 15s. Align the server's required viewing time with the 29–30s rule before wiring the dashboard to the API.
- The dashboard's 8 video cards and the backend's 6 seeded demo campaigns are different content. Pick one source (the API) and seed the YouTube creatives there.

---

## Suggested next milestones

1. **Wire the participant dashboard to the API.** Serve tasks from `/campaigns/feed`, start interactions, send playback events from `YouTubeAdPlayer`, submit through `/interactions/{id}/submit`, and read balances, history, deposits and withdrawals from the API. Remove the mock state in `DashboardContext`.
2. **Align ad rules and demo content on the server.** 29–30s viewing in verification and campaign defaults; seed the YouTube demo creatives (aim for 10–20 across the proposal's industries) with a visible demo label.
3. **Admin dashboard v1.** Users and KYC, packages, campaigns, reward rates and withdrawal approvals, on top of the existing endpoints.
4. **Advertiser dashboard.** Upload creatives or register YouTube videos, configure campaigns and budgets, and view analytics.
5. **Real blockchain deposits.** RPC-backed `ChainMonitor` and production address derivation, starting on testnets; reconciliation and explorer links.
6. **Security hardening.** Rate limiting, TOTP 2FA, admin audit logs, server-enforced payout whitelist, dev secrets moved to `.env`.
7. **KYC provider integration** and withdrawal policy enforcement.
8. **Housekeeping.** Decide on the referral system and remove the unused `@google/genai` dependency.
