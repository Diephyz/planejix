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
- **Routing** (`App.tsx`): Public: `/login`. Private (inside `PrivateRoute > AppLayout`): `/` (Dashboard), `/transactions`, `/budgets`, `/categories`, `/import`.
- **Vite proxy**: `/api/*` → `http://localhost:3001`. Configured in `vite.config.ts`.
- **Theme**: Tailwind `darkMode: 'class'`. `index.html` has an inline script that reads `localStorage('theme')` and adds/removes `class="dark"` on `<html>` before React mounts (prevents flash). Toggle button lives in `Sidebar.tsx` — writes preference back to `localStorage`. All core component classes in `index.css` use `dark:` variants.
- **Charts**: Recharts — `MonthlyBarChart`, `AnnualLineChart`, `CategoryDonutChart` (active-shape donut with hover label). All use `<ResponsiveContainer>` inside an explicit-height parent. To avoid selection squares on click: no `<Tooltip>`, CSS `outline:none` on `.recharts-wrapper`, and `onMouseDown preventDefault`.
- **Types**: all shared TypeScript interfaces in `src/types/index.ts`.

### Pages & Key Components

| Route | Component | Notes |
|---|---|---|
| `/login` | `LoginPage.tsx` | Tabbed login + register. Register has optional Name field. Google OAuth button in both tabs. |
| `/` | `DashboardPage.tsx` | KPI cards, budget alerts (≥80%), expense-by-kind strip, donut charts, bar/line charts, recent transactions. |
| `/transactions` | `TransactionsPage.tsx` | Paginated (10/page) table, export to Excel, edit + delete with confirmation modal, date-range filter toggle. |
| `/budgets` | `BudgetsPage.tsx` | Budget goals per category with progress bars (green/yellow/red). CRUD via modal. Pulls `getProgress` which returns `spent` and `percent`. |
| `/categories` | `CategoriesPage.tsx` | Inline CRUD for user categories. |
| `/import` | `ImportPage.tsx` | Drag-and-drop Excel/CSV import via SheetJS (`xlsx`). Preview table with row validation before bulk create. |

### Component Notes

- **`TransactionForm`**: accepts optional `transaction?: Transaction` prop — when provided, switches to edit mode (pre-fills form, calls `PUT /transactions/:id`). Has a recurring toggle (stored as `INTEGER 0/1` in SQLite — always use `!!t.recurring` in JSX to avoid rendering `0`).
- **`TransactionTable`**: `onEdit` prop triggers edit flow in parent. Delete uses a `Modal` confirmation (not `window.confirm`).
- **`TransactionFilters`**: calendar button toggles between month/year selectors and free date-range (`date_from` / `date_to`) inputs.
- **`Sidebar`**: manages theme toggle state, shows `user.name` (primary) + `user.username` (secondary). Includes Metas nav item.
- **`NotificationBell`** (`components/layout/NotificationBell.tsx`): bell icon + badge in `Topbar`, present on every authenticated page. Fetches `notificationsAPI.getUpcoming()` on mount (i.e. every time the user opens/reloads Planejix) and shows a dropdown listing expenses due today (red "Vence hoje") or in 3 days (yellow "Vence em 3 dias"). Closes on outside click via `mousedown` listener + ref. Does not depend on/affect the e-mail reminder flags — it's a live "current state" view, not a one-time push.
- **`BudgetsPage`**: progress bar color: green < 80%, yellow 80–100%, red > 100%. Shows "Limite excedido" label when over budget.

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
