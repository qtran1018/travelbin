# TravelBin — Frontend

TravelBin is a collaborative travel planning web app. Users can create travel destinations (e.g. "Japan 2025"), log entries for things to do, eat, or see, and share their plans with other users.

This repository contains the React frontend. The Django backend lives in [`travelbin-backend`](../Teyvat/).

---

## Features

- **Account system** — register/login with email & password, or sign in with Google (OAuth 2.0)
- **Travel destinations** — create named trip groups and manage them from a dashboard
- **Travel entries** — add items to a destination with a name, category (Food & Drink, Activity, Sightseeing, Shopping, Other), location, date, and notes
- **Drag and drop** — reorder entries within a destination using Atlassian's Pragmatic DnD library
- **Shared destinations** — view destinations that other users have shared with you via the permission system
- **Persistent auth** — JWT access + refresh tokens, automatically refreshed via Axios interceptors

## Tech Stack

| Category | Library |
|---|---|
| UI Framework | React 19 |
| Build Tool | Vite |
| Routing | React Router v7 |
| Server State | TanStack Query (React Query v5) |
| HTTP Client | Axios |
| Auth | `@react-oauth/google`, `jwt-decode` |
| Drag & Drop | Atlassian Pragmatic DnD |

## Getting Started

**Prerequisites:** Node.js 18+, the backend running at `http://localhost:8000`

```bash
cd travelbin-frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
travelbin-frontend/
├── src/
│   ├── components/   ← reusable UI components
│   ├── pages/        ← route-level page components
│   ├── hooks/        ← custom React hooks (auth, queries, mutations)
│   └── main.jsx      ← app entry point
├── index.html
├── vite.config.js
└── package.json
```

## Related

- [travelbin-backend](../travelbin-backend/) — Django REST API
