# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Planejix - Carteira Inteligente** is a personal finance dashboard with JWT auth, Google OAuth, light/dark theme, donut/bar/line charts, budget goals, Excel export/import, and paginated transactions. Monorepo with a Node.js/Express backend and a React/TypeScript/Vite frontend.

## Commands

### Start (both servers at once)
```powershell
# From repo root
npm install          # first time only — installs concurrently
npm run install:all  # first time only — installs backend + frontend deps
npm run dev          # backend :3001 + frontend :3000
```

### Backend only
```powershell
cd backend
npm run dev   # nodemon (auto-reload)
npm start     # plain node
```

### Frontend only
```powershell
cd frontend
npm run dev     # Vite dev server
npm run build   # TypeScript check + production build
```

No test suite exists in this project.

### GitHub Repository
```
https://github.com/Diephyz/planejix
```
The remote is configured with an embedded PAT for silent pushes. A Claude Code Stop hook (in `~/.claude/settings.json`) auto-commits and pushes any changes after each session response. The `.env` files and SQLite database are excluded via `.gitignore` and are never committed.

## Architecture

### Backend (`backend/`)

- **Runtime**: Node.js 24 — uses the built-in `node:sqlite` (`DatabaseSync`) instead of `better-sqlite3`, which avoids native compilation. Do **not** replace with `better-sqlite3`.
- **Entry point**: `server.js` — loads `.env`, initialises the DB, mounts routes under `/api`.
- **Database**: `backend/database/db.js` — opens `expenses.db`, runs `CREATE TABLE IF NOT EXISTS` on startup, and applies additive `ALTER TABLE` migrations via try/catch. Pattern for new columns: `try { db.exec('ALTER TABLE t ADD COLUMN col TYPE') } catch {}`.
- **Auth flow**: `bcrypt` password hashing + 7-day JWT signed with `JWT_SECRET`. Google OAuth uses `google-auth-library` to verify ID tokens server-side. Registration accepts optional `name` field stored in `users.name`.
- **Route/controller split**: thin routes in `routes/`, all logic in `controllers/`. Every protected route uses `middleware/auth.js`, which attaches `req.user = { userId, username }`.
- **Default categories**: defined as `DEFAULT_CATEGORIES` array in `controllers/authController.js`. Adding a category there automatically provisions it for every new user.
- **Scheduled jobs** (`backend/jobs/`): use `node-cron`, exported as `startXxxJob()` and started in `server.js`'s `app.listen` callback. Each also runs once immediately on boot to "catch up" if the server was down. Existing jobs:
  - `recurringTransactions.js` — generates monthly copies of recurring transactions (runs at midnight)
  - `expenseReminders.js` — checks for expenses due today or in 3 days and sends reminder e-mails (runs daily at 8 AM)
- **Shared services** (`backend/services/`): business logic reused across jobs/controllers. `reminderService.js` (`getUpcomingReminders`) centralizes the "due today / due in 3 days" query so both the e-mail job and the `/notifications` endpoint stay in sync. `emailService.js` wraps Nodemailer — gracefully no-ops (logs a warning) when `SMTP_*` env vars aren't set.

### Frontend (`frontend/src/`)

- **API layer**: `api/api.ts` — single axios instance. Exports `authAPI`, `transactionsAPI`, `categoriesAPI`, `budgetsAPI`, `adminAPI`, `notificationsAPI`. Request interceptor attaches JWT; response interceptor redirects to `/login` on 401.
- **Auth state**: `context/AuthContext.tsx` (`useAuth` hook) — persists token + user (`{ id, username, name }`) in `localStorage` under `expense_token` / `expense_user`.
- **Routing** (`App.tsx`): Public: `/login`. Private (inside `PrivateRoute > AppLayout`): `/` (Dashboard), `/transactions`, `/budgets`, `/savings`, `/categories`, `/import`, `/profile`, `/upgrade`. Admin: `/admin`, `/approvals`.
- **Vite proxy**: `/api/*` → `http://localhost:3001`. Configured in `vite.config.ts`.
- **Theme**: Tailwind `darkMode: 'class'`. Premium dark palette (`#08080d` → `#3d3d54`). Glassmorphism cards with `backdrop-filter: blur(20px)` and rgba borders. Sidebar with gradient background. All component classes in `index.css` use rgba/glass pattern (no `dark:` variants needed for most components).
- **Design system**: Claude Design project "Planejix Design System" with 9 HTML previews (tokens: colors, typography, animations; components: buttons, cards, inputs, toasts, skeleton, navigation).
- **Charts**: Recharts — `MonthlyBarChart`, `AnnualLineChart`, `TopCategories` (ranked list with progress bars, replaces CategoryDonutChart). Glass tooltips (`glass-tooltip` class). Gradient fills on bar/area charts.
- **UX polish**: animated counters (`useAnimatedValue`), skeleton loading, toast notifications, focus-visible rings, active:scale on buttons, animated dark mode toggle, custom select chevron, floating orbs on login page.
- **Types**: all shared TypeScript interfaces in `src/types/index.ts`.

### Pages & Key Components

| Route | Component | Notes |
|---|---|---|
| `/login` | `LoginPage.tsx` | Tabbed login + register with animated floating orbs, input icons (user/lock), Google OAuth. WhatsApp contact button on register. |
| `/` | `DashboardPage.tsx` | 5 KPI cards (receitas, despesas, saldo, maior gasto, saúde financeira) + budget alerts chips + area chart + upcoming payments + top categories ranking + recent transactions with category icons + bar chart. Quick actions (nova transação, PDF). |
| `/transactions` | `TransactionsPage.tsx` | Paginated (10/page) table, summary strip, export to Excel, edit + delete with modal, date-range filter toggle, responsive grid filters. |
| `/budgets` | `BudgetsPage.tsx` | Budget goals per category with progress bars (green/yellow/red). CRUD via modal. Skeleton loading. |
| `/savings` | `SavingsPage.tsx` | Savings goals with circular SVG progress, deposit modal, CRUD. Free plan limit (3). |
| `/categories` | `CategoriesPage.tsx` | Grid cards with color swatches. CRUD with toast + delete confirmation modal. |
| `/import` | `ImportPage.tsx` | Drag-and-drop Excel/CSV import via SheetJS (`xlsx`). Preview table with row validation before bulk create. |
| `/profile` | `ProfilePage.tsx` | Avatar, name/email editing, plan display with feature limits. |
| `/upgrade` | `UpgradePage.tsx` | Free vs Pro comparison with glassmorphism cards, feature icons, benefits section. |

### Component Notes

- **`TransactionForm`**: accepts optional `transaction?: Transaction` prop — edit mode pre-fills. Recurring toggle + installment support. Uses `DiscardModal` (not `window.confirm`) for unsaved changes.
- **`TransactionTable`**: `onEdit` prop triggers edit flow. Delete uses `Modal` confirmation. Horizontal scroll on mobile with `min-w-[500px]`.
- **`TransactionFilters`**: `grid-cols-2` on mobile, `flex-wrap` on desktop. Calendar toggle for date-range. Custom select chevrons.
- **`Sidebar`**: 260px glass sidebar with gradient bg, animated sun/moon theme toggle, nav items with active glow, section labels (Menu/Admin), user info with plan badge.
- **`Topbar`**: blur(20px) glass header, notification bell, sticky.
- **`NotificationBell`**: bell icon + badge in `Topbar`. Glass dropdown (`animate-scale-in`). Fetches `notificationsAPI.getUpcoming()` on mount.
- **`Modal`**: glass design with gradient bg, scale-in animation, custom `modal-scroll` scrollbar.
- **Security**: `helmet` (security headers), `express.json({ limit: '1mb' })`, global rate limit (300/15min on `/api`), auth rate limit (20/15min). `trust proxy` enabled for Oracle Cloud.
- **`BudgetsPage`**: progress bar color: green < 80%, yellow 80–100%, red > 100%. Skeleton loading. Enhanced empty state with CTA.

## API Endpoints

```
AUTH
POST /api/auth/register   { username, password, name? }  → { token, user }
POST /api/auth/login      { username, password }          → { token, user }
POST /api/auth/google     { credential }                  → { token, user }

TRANSACTIONS (JWT required)
GET    /api/transactions         ?year&month&type&category_id&date_from&date_to
GET    /api/transactions/summary ?year&month  → AnnualSummary (monthly[], annual{}, byKind{}, byCategoryYear[], byCategoryMonth[], largestExpense)
GET    /api/transactions/by-category ?year&month → { name, color, value }[]
POST   /api/transactions         { type, kind, description, amount, date, category_id?, notes?, recurring? }
PUT    /api/transactions/:id     (same fields, partial)
DELETE /api/transactions/:id

CATEGORIES (JWT required)
GET    /api/categories
POST   /api/categories    { name, color }
PUT    /api/categories/:id
DELETE /api/categories/:id

BUDGETS (JWT required)
GET    /api/budgets              → Budget[]
GET    /api/budgets/progress     ?year&month → Budget[] with spent, percent
POST   /api/budgets              { category_id?, amount, period }
PUT    /api/budgets/:id          { amount, period }
DELETE /api/budgets/:id

NOTIFICATIONS (JWT required)
GET    /api/notifications/upcoming  → AppNotification[] — expenses due today or in 3 days
                                       { id, description, amount, date, type: 'due_today' | 'due_in_3_days' }
```

## Database Schema Notes

- `transactions.type`: `'income'` | `'expense'`; `transactions.kind`: `'fixed'` | `'variable'` | `'custom'`.
- `transactions.amount` is always positive — `type` determines the sign in the UI.
- `transactions.recurring`: `INTEGER` `0` or `1`. Always coerce with `!!t.recurring` in React.
- `budgets.period`: `'monthly'` | `'annual'`. `getProgress` computes `spent` by summing expenses matching period and category.
- `categories` are per-user; deleting a category sets `category_id = NULL` on related transactions (`ON DELETE SET NULL`).
- Dates stored as `TEXT` `YYYY-MM-DD`. SQLite filters use `strftime('%Y', date)` / `strftime('%m', date)` with zero-padded month strings.
- New columns added via `try { db.exec('ALTER TABLE ... ADD COLUMN ...') } catch {}` in `db.js`.
- `transactions.reminder_3d_sent_at` / `reminder_due_sent_at`: `TEXT` timestamps (or `NULL`) marking whether the "3 days before" / "due today" e-mail reminder has already been sent for that transaction — prevents duplicate sends. Set by `jobs/expenseReminders.js`. The in-app notification bell does **not** use these flags (it always shows live current state).

## Environment Variables

| File | Variable | Purpose |
|---|---|---|
| `backend/.env` | `JWT_SECRET` | Signs JWTs |
| `backend/.env` | `GOOGLE_CLIENT_ID` | Verifies Google ID tokens server-side |
| `backend/.env` | `PORT` | Backend port (default 3001) |
| `backend/.env` | `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM_EMAIL` | SMTP credentials for due-date reminder e-mails (`emailService.js`, Nodemailer). Production uses Gmail (`smtp.gmail.com:587`) with an app password — see Google Account → Security → App passwords. If unset, the e-mail job logs a warning and skips sending (no crash). |
| `frontend/.env` | `VITE_GOOGLE_CLIENT_ID` | Renders the Google Sign-In button client-side |

`VITE_*` variables are bundled at build time — restart Vite after changing them.
