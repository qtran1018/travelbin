FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . /app/

EXPOSE 8000
# Worker/thread counts are env-tunable (no rebuild needed to change them).
# Defaults: 3 sync-ish workers x 2 threads = ~6 concurrent requests.
# `exec` so gunicorn becomes PID 1 and receives stop/restart signals directly.
CMD ["sh", "-c", "exec gunicorn Teyvat.wsgi:application --bind 0.0.0.0:8000 --workers ${GUNICORN_WORKERS:-3} --threads ${GUNICORN_THREADS:-2} --timeout 60"]
