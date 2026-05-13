# TravelBin — Backend

> **Note:** The inner Django project package is still named `Teyvat` (referenced in settings, urls, wsgi/asgi). A future rename will update those internal references to align with the `travelbin-backend` directory name.

TravelBin is a collaborative travel planning web app. Users can create travel destinations (e.g. "Japan 2025"), log entries for things to do, eat, or see, and share their plans with other users.

This repository contains the Django REST API backend. The React frontend lives in [`travelbin-frontend`](../travelbin-frontend/).

---

## Features

- **Custom user model** — extends Django's `AbstractBaseUser` with email as the login field and a separate `username` for display
- **JWT authentication** — access tokens (1 day) and rotating refresh tokens (7 days) via `djangorestframework-simplejwt`
- **Google OAuth** — users can sign in with their Google account; the backend verifies the Google ID token and issues its own JWT
- **Travel destinations** — users create named trip groups (UUID primary key), each owned by one user
- **Travel entries** — items within a destination: name, category, location, date, notes, and the contributing user
- **Permission system** — a `Permissions` model tracks which users have access to which destinations, enabling shared trip planning
- **Rate limiting** — anonymous users: 10 req/min; authenticated users: 200 req/hour
- **Docker support** — includes a `Dockerfile` for containerized deployment

## Tech Stack

| Category | Library / Tool |
|---|---|
| Framework | Django 5.1 + Django REST Framework |
| Auth | `djangorestframework-simplejwt`, `google-auth` |
| Database | PostgreSQL via `psycopg` (v3) |
| CORS | `django-cors-headers` |
| Filtering | `django-filter` |
| Server | Gunicorn |
| Containerization | Docker |

## Data Model

```
User
 ├── email (unique login field)
 └── username (unique display name)

TravelDestination
 ├── id (UUID)
 ├── name
 └── created_by → User

TravelEntry
 ├── name
 ├── type  (Food & Drink | Shopping | Activity | Sightseeing | Other)
 ├── location
 ├── date
 ├── notes
 ├── contributor → User
 └── destination → TravelDestination

Permissions
 ├── user (username)
 └── destination_id
```

## API Overview

Base URL: `http://localhost:8000`

| Prefix | Description |
|---|---|
| `GET /` | List available travel destinations |
| `/travel/` | Destination, Entry, User, and Permission endpoints |
| `/admin/` | Django admin panel |

All protected endpoints require an `Authorization: Bearer <access_token>` header.

## Getting Started

### Option 1 — Local (SQLite, no Docker)

```bash
cd Teyvat
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Switch the database to SQLite in `Teyvat/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

Then run:

```bash
python manage.py migrate
python manage.py runserver
```

The API is now available at `http://localhost:8000`.

### Option 2 — Docker

```bash
docker build -t travelbin-backend .
docker run -p 8000:8000 travelbin-backend
```

The settings expect a PostgreSQL host named `travelbin-db`. Use Docker Compose at the monorepo level to wire up the database and backend together.

## Project Structure

```
travelbin-backend/
├── Teyvat/              ← Django project config (package still named Teyvat)
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── Traveler/            ← main Django app
│   ├── Destination/     ← TravelDestination model, serializer, views, urls
│   ├── Entry/           ← TravelEntry model, serializer, views, urls
│   ├── Permission/      ← Permissions model, serializer, views, urls
│   ├── User/            ← custom User model, Google OAuth, auth views, urls
│   └── migrations/
├── requirements.txt
└── Dockerfile
```

## Environment Variables

The following values should be provided via environment variables in production (not hardcoded):

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DB_NAME` | PostgreSQL database name |
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID for token verification |

## Related

- [travelbin-frontend](../travelbin-frontend/) — React/Vite frontend
