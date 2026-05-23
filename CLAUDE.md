# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Planejix - Carteira Inteligente** is a personal finance dashboard with JWT auth, Google OAuth, dark mode, and monthly/annual charts. It is a monorepo with a Node.js/Express backend and a React/TypeScript/Vite frontend.

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

## Architecture

### Backend (`backend/`)

- **Runtime**: Node.js 24 — uses the built-in `node:sqlite` (`DatabaseSync`) instead of `better-sqlite3`, which avoids native compilation. Do **not** replace with `better-sqlite3`.
- **Entry point**: `server.js` — loads `.env`, initialises the DB, mounts routes under `/api`.
- **Database**: `backend/database/db.js` — opens `expenses.db`, runs `CREATE TABLE IF NOT EXISTS` on startup, and applies additive `ALTER TABLE` migrations via try/catch (used to add `google_id`/`email` columns). Add new columns the same way.
- **Auth flow**: `bcrypt` password hashing + 7-day JWT signed with `JWT_SECRET`. Google OAuth uses `google-auth-library` to verify ID tokens server-side; Google users get a random bcrypt hash as their stored password.
- **Route/controller split**: thin routes in `routes/`, all logic in `controllers/`. Every protected route uses `middleware/auth.js`, which attaches `req.user = { userId, username }`.
- **Default categories**: defined as `DEFAULT_CATEGORIES` array in `controllers/authController.js`. Adding a category there automatically provisions it for every new user (both password and Google registration). To backfill existing users, run a one-off Node script against `expenses.db`.

### Frontend (`frontend/src/`)

- **API layer**: `api/api.ts` — single axios instance with base URL `/api`. A request interceptor attaches the JWT from `localStorage`; a response interceptor redirects to `/login` on 401. All API calls go through `authAPI`, `transactionsAPI`, and `categoriesAPI` exported from this file.
- **Auth state**: `context/AuthContext.tsx` (`useAuth` hook) — persists token + user object in `localStorage` under keys `expense_token` / `expense_user`. `PrivateRoute` wraps all authenticated routes.
- **Routing** (`App.tsx`): Public routes `/login` and `/register`. All other routes are nested inside `PrivateRoute > AppLayout`, which renders a persistent `Sidebar` + `Topbar` with `<Outlet>`.
- **Vite proxy**: `/api/*` requests are proxied to `http://localhost:3001` in dev, so the frontend never makes cross-origin calls. Configured in `vite.config.ts`.
- **Styling**: Tailwind CSS with `darkMode: 'class'`. The `<html>` tag always carries `class="dark"`. Custom colour tokens (`dark-900` through `dark-500`, `brand-*`) are defined in `tailwind.config.js`. Shared utility classes (`card`, `btn-primary`, `input-field`, `label`) are defined in `index.css` as `@layer components`.
- **Charts**: Recharts — `MonthlyBarChart` (BarChart, income vs expenses per month) and `AnnualLineChart` (LineChart, income/expenses/balance trend). Both use `<ResponsiveContainer>` inside a parent with explicit height (`h-[280px]`).
- **Types**: all shared TypeScript interfaces live in `src/types/index.ts`.

## Environment Variables

| File | Variable | Purpose |
|---|---|---|
| `backend/.env` | `JWT_SECRET` | Signs JWTs |
| `backend/.env` | `GOOGLE_CLIENT_ID` | Verifies Google ID tokens server-side |
| `backend/.env` | `PORT` | Backend port (default 3001) |
| `frontend/.env` | `VITE_GOOGLE_CLIENT_ID` | Renders the Google Sign-In button client-side |

`VITE_*` variables are bundled by Vite at build time; restart the dev server after changing them.

## Database Schema Notes

- `transactions.type` is `'income'` or `'expense'`; `transactions.kind` (`'fixed'`, `'variable'`, `'custom'`) applies to **both** types (not only expenses).
- `transactions.amount` is always positive — `type` determines the sign in the UI.
- `categories` are per-user; deleting a category sets `category_id = NULL` on related transactions (`ON DELETE SET NULL`).
- Dates are stored as `TEXT` in `YYYY-MM-DD` format. SQLite date filters use `strftime('%Y', date)` and `strftime('%m', date)` with zero-padded month strings.
