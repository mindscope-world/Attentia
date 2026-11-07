# Attentia — Development Plan & Status

Attention-rewards marketing platform: advertisers fund campaigns, verified participants watch sponsored content, rate it, and earn micro-rewards.

_Last reviewed: 2026-11-06, against commit `f672624`._

## Legend

| Marker | Meaning |
|---|---|
| 🟢 | **Done**: works as described in the proposal |
| 🟧 | **Partial**: UI or a client-side mock exists, but there is no real backend or logic behind it |
| 🟣 | **To do**: not started |

## Where the codebase stands

The repo is a **frontend-only React 19 + Vite + Tailwind prototype**. It has a marketing landing page and a participant dashboard with six tabs: Overview, Tasks, Deposits & Withdrawals, Activities, Network and Settings. All data is hardcoded mock state in `src/context/DashboardContext.tsx`, and nothing persists across a reload. Login is checked on the client against one hardcoded account (`src/context/AuthContext.tsx`).

There is no backend, database, blockchain integration, admin dashboard or advertiser dashboard yet. Because of that, almost every participant feature is 🟧. The screens exist, but the behaviour behind them is simulated.

---

## 1. Foundations

- 🟢 Project scaffold (React 19, Vite, Tailwind v4, TypeScript)
- 🟢 Marketing landing page: hero, how it works, packages, ad-interaction demo, dashboard preview, security, FAQ, CTA, footer, legal modal
- 🟢 Light/dark theme toggle
- 🟢 Shared domain types (`src/types.ts`)
- 🟧 Frontend framework. The proposal says React / Next.js; the project is React + Vite with no SSR or routing library.
- 🟣 Backend API (Python / FastAPI)
- 🟣 PostgreSQL database and schema (users, packages, campaigns, assets, interactions, ledger, deposits, withdrawals)
- 🟣 Redis caching and queues, plus Celery background workers
- 🟣 S3-compatible object storage for video and thumbnails
- 🟣 FFmpeg video processing pipeline
- 🟣 Docker / cloud deployment
- 🟣 Modular separation of the users, campaigns, assets, verification, rewards, payments and analytics modules

## 2. Participant Dashboard (§4.1)

- 🟧 **Registration and authentication.** The login/register modal exists, and the dashboard can only be opened after login. Login only works for one hardcoded account, the session is a flag in `localStorage`, registration doesn't create accounts, and there's no JWT or OAuth.
- 🟧 **Identity verification (KYC).** The UI shows a KYC tier label and has a "Security & KYC" area. There is no document upload, verification provider or approval flow.
- 🟧 **Participation package selection.** The Starter $25, Growth $100 and Pro $500 tiers are shown on the landing page and in the deposit flow. They are hardcoded rather than set by an admin.
- 🟧 **Daily task quota.** Quotas per tier (15, 30 and 60) and a progress bar exist. The counts are client-side only and never reset each day.
- 🟧 **Sponsored content discovery.** The task grid shows sponsor, reward, duration and a category filter. There are 6 hardcoded tasks with no thumbnails, and they don't come from a campaign engine.
- 🟧 **Video ad player.** The task modal shows a countdown timer in place of a real video player, and a "Skip wait (Demo Mode)" button bypasses it.
- 🟢 **Rating and feedback UI.** There is a 1–5 star rating and a comprehension multiple-choice question.
- 🟣 **Free-text qualitative feedback**, such as "What improvements would you suggest?"
- 🟧 **Reward balance tracking.** Available, today, pending and all-time balances are shown. They are in-memory mock numbers.
- 🟧 **Deposit and withdrawal management.** Full UI for networks, fees, minimum amounts and history. All of it is simulated (see §6).
- 🟧 **Task completion and transaction history.** The Activities tab has search and receipts, but it uses mock data and doesn't persist.
- 🟧 **Account and security settings.** Profile editing, a 2FA toggle and a payout wallet whitelist exist. 2FA is a boolean toggle only, with no TOTP.
- 🟢 Notification toasts for completed actions

## 3. Advertising Campaign Engine (§4.2)

- 🟣 Campaign data model: name, description, objectives, schedule, expiry, daily limits, reward rate and budget
- 🟣 Campaign creation and management API
- 🟣 Video and image creative uploads, with records that point to stored assets instead of hardcoded files
- 🟣 Audience targeting
- 🟣 Campaign activation and expiration
- 🟣 Campaign performance tracking
- 🟣 Advertiser dashboard: upload creatives, configure campaigns, allocate budget, monitor engagement

## 4. Attention Verification Engine (§4.3)

- 🟧 **Minimum watch duration.** It's enforced only by a client-side countdown, which can be skipped.
- 🟣 Percentage completed and playback-event tracking (play, pause, seek, visibility)
- 🟧 **Mandatory rating and question completion.** The client blocks submission until an option is selected. Nothing checks this on a server.
- 🟧 **Duplicate task prevention.** A completed task is marked `completed` in client state. That resets on reload, and nothing enforces it on a server.
- 🟣 Suspicious or repeated interaction detection
- 🟣 User and session verification
- 🟣 **Server-side verification before any reward is credited.** Today, submitting a task credits the reward right away on the client (`completeTask` in `DashboardContext.tsx`).

## 5. Administrative Dashboard (§4.4)

- 🟣 User management
- 🟣 KYC review and account approvals
- 🟣 Participation package management (quotas, prices, terms)
- 🟣 Advertisement and campaign management and moderation
- 🟣 Reward rate configuration
- 🟣 Deposit and withdrawal monitoring and reconciliation
- 🟣 Fraud and suspicious-activity monitoring
- 🟣 Platform analytics
- 🟣 User support management
- 🟣 System configuration and audit logs
- 🟣 Role-based admin permissions

## 6. Demo Advertising Content (§5)

- 🟧 **Dummy ad library.** There are 6 text-only demo tasks. The target is 10–20 ads across 8 industries: technology, finance, consumer goods, telecoms, e-commerce, healthcare, automotive and education.
- 🟧 **Fictional brands.** The sponsors (Apex Protocol, Nova Tech and others) are fictional. They're mostly crypto- and Web3-themed instead of spread across the proposed industries.
- 🟣 Dummy MP4 creatives (H.264/AAC, 360p–720p, 16:9, 15–60 s) with JPG/WebP thumbnails
- 🟣 A visible "Demonstration content" marking on every demo campaign
- 🟣 A demo vs. production flag on campaigns
- 🟣 Swapping demo creatives for real ones through the admin or advertiser UI without schema changes

## 7. Participant Engagement Workflow (§6)

| Step | Status |
|---|---|
| 1. Registration | 🟧 UI only, no account creation |
| 2. Identity verification | 🟧 KYC label only |
| 3. Package selection | 🟧 UI plus simulated deposit |
| 4. Content discovery | 🟧 Mock task grid |
| 5. Ad engagement | 🟧 Countdown in place of a video |
| 6. Rating and evaluation | 🟢 Star rating and question (free-text feedback is 🟣) |
| 7. Task verification | 🟣 Not implemented |
| 8. Reward allocation and notification | 🟧 Instant client-side credit and toast |

## 8. Reward and Participation Model (§7)

- 🟧 **Per-task reward rate.** A flat $0.50 is hardcoded; it isn't a per-campaign rate.
- 🟣 Reward calculation from campaign budget, eligibility, verification, remaining quota and platform fees
- 🟣 Auditable, append-only reward ledger
- 🟧 **Non-guaranteed reward messaging.** The landing page and FAQ use neutral wording. A legal and compliance review of the copy is still needed.

## 9. Deposits and Blockchain Integration (§8)

- 🟧 **Network and asset selection.** The UI offers TRC-20, ERC-20 and Polygon. The proposal names specific assets (USDT TRC-20, USDT ERC-20 and USDC Polygon), and those still need confirming in the UI.
- 🟧 **Deposit address.** A static, hardcoded address is shown for each network. A unique address per deposit isn't generated.
- 🟧 **Deposit history with transaction hashes.** It exists with mock hashes. There are no blockchain explorer links.
- 🟣 Blockchain monitoring through RPC providers
- 🟣 Validation of amount, address, token contract and network
- 🟣 Confirmation counting (12 by default, configurable per network)
- 🟧 **Pending and confirmed status.** The types support both, but deposits confirm instantly.
- 🟣 Handling for failed and underpaid deposits
- 🟣 Automated reconciliation
- 🟧 **Package activation after a deposit.** It works in the mock: the tier upgrades as soon as the deposit is submitted.
- 🟣 Custody and key management, with private keys never stored in the app database

## 10. Wallet and Withdrawals (§9)

- 🟧 **Balance display.** Available, pending and total balances are shown, all mock.
- 🟧 **Withdrawal request.** Minimum threshold and fee per tier, a payout wallet whitelist and status steps (submitted, then verifying) are all simulated client-side.
- 🟣 A ledger that separates deposited funds, earned rewards, pending amounts and withdrawn funds
- 🟣 KYC and fraud checks before a withdrawal is paid
- 🟣 Real on-chain payout dispatch

## 11. Analytics and Reporting (§10)

- 🟧 **Participant analytics.** The Overview tab shows completed tasks, daily progress, earnings and a chart, all from mock data. Average campaign ratings are missing.
- 🟣 Advertiser analytics: verified views, completion rate, average rating, feedback, cost per verified interaction and budget use
- 🟣 Admin analytics: participants, campaigns, interactions, reward liabilities, deposit and withdrawal volumes, and fraud statistics

## 12. Security and Platform Integrity (§12)

- 🟧 **Authentication and sessions.** The dashboard is gated, but against hardcoded credentials stored in client code. **This must be replaced before any real deployment.**
- 🟣 KYC integration
- 🟣 Server-side task validation
- 🟣 Server-side duplicate interaction prevention
- 🟣 Suspicious playback detection
- 🟣 Rate limiting and API access controls
- 🟣 Secure payment verification
- 🟣 Transaction audit logs
- 🟣 Role-based admin permissions
- 🟣 Encryption of sensitive data
- 🟧 **Payout wallet whitelist.** The UI exists, with no server enforcement.

## Out-of-proposal items in the codebase

- 🟢 **Referral and network system** (Network tab, 3 levels, commissions). It isn't in the proposal. Decide whether it stays: multi-level commissions on top of paid entry packages can raise regulatory concerns alongside the "no guaranteed returns" positioning.
- 🟧 **`@google/genai` dependency and AI Studio metadata.** These are present but unused. Remove them or define what they're for.

---

## Suggested next milestones

1. **Backend skeleton.** FastAPI, PostgreSQL, Docker and real auth (JWT) to replace the hardcoded login.
2. **Campaign and asset model.** Campaign and creative tables, S3 storage, and 10–20 demo MP4 ads with a demo flag. Serve tasks from the API.
3. **Real video player and verification.** Playback events go to the server, which verifies watch percentage, the rating and question, and duplicates before crediting the reward.
4. **Ledger.** An append-only ledger for rewards, deposits and withdrawals, with balances derived from it.
5. **Admin dashboard v1.** Users, packages, campaigns, reward rates and withdrawal approvals.
6. **Blockchain deposits.** Address generation, an RPC monitor, confirmation counting and reconciliation, starting on testnets.
7. **KYC provider integration** and withdrawal policy enforcement.
8. **Advertiser dashboard and analytics.**
