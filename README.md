# TravelBin

Collaborative travel planning app. Users create trip destinations, build itineraries, invite collaborators, and import AI-generated trips from [Itinerary-Agent](https://github.com/qtran1018/Itinerary-Agent).

Part of the [travel platform](https://github.com/qtran1018/travel-platform-infra) — a portfolio of five integrated travel apps sharing Keycloak SSO and PostgreSQL.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Django 5.1, Django REST Framework 3.15 |
| Frontend | React 19, Vite 6, React Router v7, TanStack Query v5 |
| Auth | Keycloak SSO (RS256 JWT + keycloak-js) |
| Database | PostgreSQL 16 |
| HTTP client | Axios |

---

## Features

- Create and manage travel destinations with collaborative entry tables
- Invite collaborators via shareable links
- Editable entry table with auto-save (name, location, type, date, notes)
- Import AI-generated itineraries from Itinerary-Agent
- SSO login shared across all platform apps via Keycloak

---

## Project Structure

```
TravelBin/
├── travelbin-backend/     # Django REST API (port 8000)
└── travelbin-frontend/    # React SPA (port 3001)
```

---

## Running Locally

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 16
- Keycloak (shared via [travel-platform-infra](https://github.com/qtran1018/travel-platform-infra))

### Backend

```bash
cd travelbin-backend
python -m venv ../venv
../venv/Scripts/activate       # Windows
pip install -r requirements.txt
cp .env.example .env           # fill in values
python manage.py migrate
python manage.py runserver 8000
```

### Frontend

```bash
cd travelbin-frontend
npm install
cp .env.example .env           # set VITE_API_URL=http://localhost:8000
npm run dev                    # port 3001
```

### Docker (combined platform mode)

```bash
# From travel-platform-infra: start Keycloak + shared Postgres first
POSTGRES_HOST=platform-postgres docker compose up -d
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default 5432) |
| `KEYCLOAK_ISSUER` | `http://localhost:8180/realms/travel-platform` |
| `KEYCLOAK_JWKS_URL` | JWKS endpoint (optional — defaults to issuer URL) |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (`http://localhost:8000`) |

---

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/travel/` | — | List destinations |
| POST | `/travel/d/add_travel/` | ✓ | Create destination |
| GET | `/travel/d/<pk>/detail/` | — | Get destination |
| PATCH | `/travel/d/<pk>/update/` | ✓ | Update destination |
| DELETE | `/travel/d/<pk>/delete/` | ✓ | Delete destination |
| GET | `/travel/d/<id>/` | — | List entries |
| POST | `/travel/d/<pk>/create_entry/` | ✓ | Add entry |
| PATCH | `/travel/<pk>/update/` | ✓ | Update entry |
| DELETE | `/travel/<pk>/delete/` | ✓ | Delete entry |
| GET | `/travel/me/` | ✓ | Current user |
| POST | `/travel/destinations/import/` | ✓ | Import from Itinerary-Agent |
| POST | `/travel/invite/create/` | ✓ | Generate invite link |
| GET | `/travel/invite/<token>/` | — | Invite info |
| POST | `/travel/invite/<token>/join/` | ✓ | Join via invite |
| GET | `/travel/permissions/get_by_destination/<id>` | ✓ | List members |
| POST | `/travel/permissions/add/` | ✓ | Add member |
| DELETE | `/travel/permissions/delete/<dest>/<email>/` | ✓ | Remove member |
