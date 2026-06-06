# FieldForce Pro — Docker Deployment Guide (Ubuntu Linux)

Step-by-step reference for deploying the FieldForce Pro Field Service Management platform on an Ubuntu Linux server using Docker, with an external PostgreSQL database and Ubuntu Nginx as the public-facing reverse proxy with HTTPS via Certbot.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Project File Structure](#3-project-file-structure)
4. [Step 1 — Install Docker on Ubuntu](#4-step-1--install-docker-on-ubuntu)
5. [Step 2 — Clone the Repository](#5-step-2--clone-the-repository)
6. [Step 3 — Configure Environment Variables](#6-step-3--configure-environment-variables)
7. [Step 4 — Build Docker Images](#7-step-4--build-docker-images)
8. [Step 5 — Start the Application](#8-step-5--start-the-application)
9. [Step 6 — Run Database Migrations](#9-step-6--run-database-migrations)
10. [Step 7 — Configure Ubuntu Nginx (Reverse Proxy)](#10-step-7--configure-ubuntu-nginx-reverse-proxy)
11. [Step 8 — Point Your Domain (DNS / Hostinger)](#11-step-8--point-your-domain-dns--hostinger)
12. [Step 9 — Enable HTTPS with Certbot](#12-step-9--enable-https-with-certbot)
13. [Step 10 — Verify the Full Stack](#13-step-10--verify-the-full-stack)
14. [Updating the Application](#14-updating-the-application)
15. [Useful Docker Commands](#15-useful-docker-commands)
16. [Logs & Monitoring](#16-logs--monitoring)
17. [Troubleshooting](#17-troubleshooting)
18. [Port Reference](#18-port-reference)

---

## 1. Architecture Overview

```
  Internet
     │
     │  :80 (HTTP)  :443 (HTTPS)
     ▼
┌──────────────────────────────────────────────────────┐
│         Ubuntu Host — Nginx (host process)            │
│   /etc/nginx/sites-available/fsm.yourdomain.com       │
│                                                       │
│   Handles SSL termination via Certbot                 │
│   Proxies all traffic → http://127.0.0.1:3123         │
└──────────────────────────────────────────────────────┘
     │
     │  proxy_pass http://127.0.0.1:3123
     ▼
┌────────────────────────────────────────────────────────────────┐
│   Docker Network: fsm-network                                  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  fsm-web  (Nginx + React SPA)                            │  │
│  │  127.0.0.1:3123 → container :80                          │  │
│  │                                                           │  │
│  │  location /           → serve React SPA                   │  │
│  │  location /api/       → proxy → fsm-server:3213           │  │
│  │  location /socket.io/ → proxy → fsm-server:3213           │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                            │ Docker-internal only               │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  fsm-server  (NestJS API + WebSockets)                   │  │
│  │  No host port — internal network only                    │  │
│  │                                                           │  │
│  │  Connects to: fsm-redis, fsm-ai, External PostgreSQL     │  │
│  └────────────┬──────────────────────┬──────────────────────┘  │
│               │                      │                          │
│               ▼                      ▼                          │
│  ┌────────────────────┐  ┌──────────────────────────────────┐  │
│  │  fsm-redis          │  │  fsm-ai  (FastAPI ML Service)    │  │
│  │  No host port       │  │  No host port — internal only    │  │
│  │  Redis 7 Alpine     │  │                                   │  │
│  │  Caching + Celery   │  │  Connects to: fsm-redis, Ext DB  │  │
│  └─────────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                              │  postgres://YOUR_DB_HOST:5432
                              ▼
                 External PostgreSQL Server
```

**Key design points:**
- **Only one port is exposed on the host** (`127.0.0.1:3123`) — Ubuntu Nginx is the single public entry point on 80/443.
- **`fsm-server` and `fsm-ai` have zero host ports** — they are completely isolated inside Docker. No external tool can reach the API directly; all access goes through `fsm-web`'s internal Nginx proxy.
- **`fsm-redis` has zero host ports** — Redis is only accessible from within the Docker network.
- **Database is external** — Docker containers connect to your PostgreSQL server at `DATABASE_HOST` using the credentials in `.env`.
- **SSL is handled by Ubuntu's Nginx + Certbot** — Docker containers run plain HTTP internally.

| Container    | Image                   | Exposed to Host        | Role                                         |
|--------------|-------------------------|------------------------|----------------------------------------------|
| `fsm-web`    | nginx:1.27-alpine       | `127.0.0.1:3123` only  | Serves React SPA, proxies API & AI routes    |
| `fsm-server` | node:20-alpine (custom) | None (internal only)   | NestJS REST API + Socket.IO + WebSockets     |
| `fsm-ai`     | python:3.11-slim (custom)| None (internal only)  | FastAPI ML service (scheduling, predictions) |
| `fsm-redis`  | redis:7-alpine          | None (internal only)   | Caching + Celery broker/backend              |

---

## 2. Prerequisites

| Requirement         | Minimum Version | Check Command              |
|---------------------|-----------------|----------------------------|
| Ubuntu              | 22.04 LTS       | `lsb_release -a`           |
| Docker Engine       | 24.x            | `docker --version`         |
| Docker Compose      | 2.20 (plugin)   | `docker compose version`   |
| Nginx (host)        | 1.18+           | `nginx -v`                 |
| Certbot             | latest          | `certbot --version`        |
| Available RAM       | 8 GB            | `free -h`                  |
| Available Disk      | 20 GB           | `df -h`                    |

> **Note:** The AI service with ML dependencies requires more RAM than a typical web app. 8 GB is the minimum; 16 GB is recommended if you plan to run all ML models (YOLOv8, Prophet, PyTorch, etc.).

---

## 3. Project File Structure

```
fsm/
├── docker-compose.yml              ← Orchestration (all services, no external DB)
├── docker-compose.prod.yml         ← Production resource limits overlay
├── .env.docker.example             ← Environment template → copy to .env
├── .env                            ← Your secrets (gitignored, never commit)
│
├── server/
│   ├── Dockerfile                  ← Multi-stage NestJS build
│   └── .dockerignore
│
├── web/
│   ├── Dockerfile                  ← Multi-stage React + Nginx build
│   ├── nginx.conf                  ← SPA routing + internal API/AI proxy
│   └── .dockerignore
│
├── ai/
│   ├── Dockerfile                  ← Python 3.11 multi-stage build
│   └── .dockerignore
│
└── mobile/                         ← Not containerized (native iOS/Android app)
```

---

## 4. Step 1 — Install Docker on Ubuntu

```bash
# Update package index
sudo apt-get update

# Install Docker Engine
curl -fsSL https://get.docker.com | sh

# Add your user to the docker group (avoids needing sudo for every command)
sudo usermod -aG docker $USER

# Apply the group change (or log out and back in)
newgrp docker

# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

---

## 5. Step 2 — Clone the Repository

```bash
# Navigate to the directory where you want to deploy
cd /var/www

# Clone the project
git clone <your-repository-url> fsm
cd fsm
```

---

## 6. Step 3 — Configure Environment Variables

```bash
# Create your environment file from the template
cp .env.docker.example .env

# Edit the file — fill in all values
nano .env
```

### Critical values to set

```bash
# ── Domain & URLs ──────────────────────────────────────────
WEB_PORT=3123                              # Docker web container local port
WEB_URL=https://fsm.yourdomain.com         # Your public domain
CORS_ORIGINS=https://fsm.yourdomain.com

# ── External Database ───────────────────────────────────────
DB_HOST=your.database.server.ip
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=fieldforce_pro

# ── Redis (Docker-internal — no changes needed) ─────────────
REDIS_HOST=fsm-redis
REDIS_PORT=6379
REDIS_PASSWORD=

# ── JWT Secrets (generate with: openssl rand -hex 32) ───────
JWT_SECRET=replace_with_64_char_random_string
JWT_REFRESH_SECRET=replace_with_different_64_char_string
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Application Settings ────────────────────────────────────
APP_PORT=3213                              # NestJS server internal port
APP_ENV=production
APP_NAME=FieldForce Pro

# ── AWS S3 (file uploads) ───────────────────────────────────
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=your-region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# ── Mail (SMTP) ─────────────────────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=noreply@yourdomain.com

# ── AI Service ───────────────────────────────────────────────
AI_SERVICE_URL=http://fsm-ai:8000
OPENAI_API_KEY=sk-...                      # Required for chatbot, document AI
ANTHROPIC_API_KEY=sk-ant-...               # Optional, for Claude-powered features

# ── Celery (AI async tasks — uses Redis) ─────────────────────
CELERY_BROKER_URL=redis://fsm-redis:6379/1
CELERY_RESULT_BACKEND=redis://fsm-redis:6379/2

# ── Frontend build args (baked into React at build time) ─────
VITE_API_URL=/api                          # Keep as /api — Nginx proxies internally
VITE_APP_NAME=FieldForce Pro
```

> **Generate secure secrets:**
> ```bash
> openssl rand -hex 32
> ```

> **Important:** `VITE_API_URL` must stay as `/api`. The React build uses a relative path, and the internal Nginx in `fsm-web` proxies `/api/*` to `fsm-server:3213` over the Docker network. Ubuntu's host Nginx does not need to know about the API port at all.

---

## 7. Step 4 — Build Docker Images

```bash
# From the fsm/ directory
# First-time build takes 10–20 minutes (compiles TypeScript + Vite + Python ML deps)
docker compose build

# To rebuild a specific service
docker compose build fsm-server
docker compose build fsm-web
docker compose build fsm-ai
```

> **Rebuilding after env changes:** If you change any `VITE_*` variable in `.env`, you must rebuild `fsm-web` because Vite bakes these into the JS bundle at build time:
> ```bash
> docker compose build fsm-web
> ```

> **AI service build:** The AI service build is the slowest due to ML library installation (PyTorch, scikit-learn, etc.). This is normal and only happens on first build or when `requirements.txt` changes.

---

## 8. Step 5 — Start the Application

```bash
# Start all containers in the background
docker compose up -d

# Watch the startup logs
docker compose logs -f
```

**Expected startup sequence:**
1. `fsm-redis` container starts — Redis is ready almost instantly
2. `fsm-server` container starts — NestJS bootstraps on port 3213, connects to external DB and Redis
3. `fsm-ai` container starts — FastAPI loads ML models (may take 30–60s)
4. `fsm-server` healthcheck passes (after ~60s)
5. `fsm-web` container starts — Nginx serves the React app on `127.0.0.1:3123`

```bash
# Confirm containers are running and healthy
docker compose ps
```

Expected output:
```
NAME          STATUS                    PORTS
fsm-redis     Up X minutes              (none)
fsm-server    Up X minutes (healthy)    (none)
fsm-ai        Up X minutes (healthy)    (none)
fsm-web       Up X minutes (healthy)    127.0.0.1:3123->80/tcp
```

Notice `fsm-server`, `fsm-ai`, and `fsm-redis` have no listed ports — they are completely internal.

---

## 9. Step 6 — Run Database Migrations

Run this once after the first deployment (and again after any update that adds new migration files):

```bash
docker compose exec fsm-server \
  npx sequelize-cli db:migrate
```

**Optional — seed the database:**

```bash
# Production seeds (roles, permissions, default tenant, required config data)
docker compose exec fsm-server \
  npx sequelize-cli db:seed:all
```

**Check migration status at any time:**

```bash
docker compose exec fsm-server \
  npx sequelize-cli db:migrate:status
```

---

## 10. Step 7 — Configure Ubuntu Nginx (Reverse Proxy)

Ubuntu's Nginx acts as the single public entry point. It handles port 80/443 and proxies all traffic to the Docker `fsm-web` container on `127.0.0.1:3123`.

### 10.1 Install Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 10.2 Create the site configuration

```bash
# Navigate to the sites-available directory
cd /etc/nginx/sites-available

# Create a new config file for your domain
sudo nano fsm.yourdomain.com
```

Paste the following — replace `fsm.yourdomain.com` with your actual domain and `3123` with your `WEB_PORT` if you changed it:

```nginx
server {
    server_name fsm.yourdomain.com;

    # Support large file uploads (work photos, documents, signatures)
    client_max_body_size 200m;

    location / {
        proxy_pass          http://127.0.0.1:3123;
        proxy_http_version  1.1;
        proxy_set_header    Upgrade           $http_upgrade;
        proxy_set_header    Connection        'upgrade';
        proxy_set_header    Host              $host;
        proxy_set_header    X-Real-IP         $remote_addr;
        proxy_set_header    X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto $scheme;
        proxy_cache_bypass  $http_upgrade;
        proxy_read_timeout  300s;
        proxy_send_timeout  300s;
    }

    # Listen on port 80 — Certbot will update this block for HTTPS
    listen 80;
}
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter`).

### 10.3 Enable the site

```bash
# Create the symlink to enable the site
sudo ln -s /etc/nginx/sites-available/fsm.yourdomain.com \
           /etc/nginx/sites-enabled/fsm.yourdomain.com

# Test the configuration syntax
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## 11. Step 8 — Point Your Domain (DNS / Hostinger)

Before running Certbot, your domain must resolve to the server's public IP.

### In Hostinger (or your DNS provider):

1. Log in to your Hostinger account
2. Go to **Domains → DNS / Nameservers**
3. Add an **A record**:

   | Type | Name                    | Value (Points to)       | TTL  |
   |------|-------------------------|-------------------------|------|
   | A    | `fsm` (or `@` for root) | `your.server.public.ip` | 3600 |

   Example: if your domain is `bairuhatech.com` and you want `fsm.bairuhatech.com`:
   - **Type:** A
   - **Name:** `fsm`
   - **Value:** `your.server.public.ip` (your Ubuntu server's public IP)

4. Save the record — DNS propagation takes **5–30 minutes**

**Verify DNS has propagated:**
```bash
# From your local machine or the server
ping fsm.yourdomain.com
# or
nslookup fsm.yourdomain.com
```

---

## 12. Step 9 — Enable HTTPS with Certbot

Once DNS is pointing to your server and Nginx is running, issue a free SSL certificate with Let's Encrypt.

### 12.1 Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 12.2 Obtain and install the certificate

```bash
# Certbot will automatically update your Nginx config with SSL
sudo certbot --nginx -d fsm.yourdomain.com
```

Certbot will:
1. Verify that `fsm.yourdomain.com` resolves to this server
2. Issue a Let's Encrypt certificate
3. Automatically modify your Nginx config to add HTTPS (port 443) with the certificate
4. Set up an HTTP → HTTPS redirect on port 80

**For multiple subdomains on the same certificate:**
```bash
sudo certbot --nginx -d fsm.yourdomain.com -d api.yourdomain.com
```

### 12.3 Verify auto-renewal

Certbot installs a cron job / systemd timer to auto-renew certificates before they expire. Verify it works:

```bash
sudo certbot renew --dry-run
```

### 12.4 Final Nginx config (after Certbot)

After running Certbot, your config at `/etc/nginx/sites-available/fsm.yourdomain.com` will look similar to this:

```nginx
server {
    server_name fsm.yourdomain.com;
    client_max_body_size 200m;

    location / {
        proxy_pass          http://127.0.0.1:3123;
        proxy_http_version  1.1;
        proxy_set_header    Upgrade           $http_upgrade;
        proxy_set_header    Connection        'upgrade';
        proxy_set_header    Host              $host;
        proxy_set_header    X-Real-IP         $remote_addr;
        proxy_set_header    X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto $scheme;
        proxy_cache_bypass  $http_upgrade;
        proxy_read_timeout  300s;
        proxy_send_timeout  300s;
    }

    listen 443 ssl;
    ssl_certificate     /etc/letsencrypt/live/fsm.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fsm.yourdomain.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    # HTTP → HTTPS redirect (added by Certbot)
    if ($host = fsm.yourdomain.com) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name fsm.yourdomain.com;
    return 404;
}
```

---

## 13. Step 10 — Verify the Full Stack

```bash
# 1. Check Docker containers
docker compose ps

# 2. Check that the web container is reachable from the host
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3123
# Expected: 200

# 3. Check the NestJS API is reachable through Nginx (internal proxy)
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3123/api/health
# Expected: 200

# 4. Check the AI service is reachable through the server
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3123/api/ai/health
# Expected: 200

# 5. Check the public HTTPS URL
curl -s -o /dev/null -w "%{http_code}" https://fsm.yourdomain.com
# Expected: 200

# 6. Check Redis connectivity from inside the server container
docker compose exec fsm-server sh -c "nc -z fsm-redis 6379 && echo 'Redis OK' || echo 'Redis FAIL'"

# 7. Check Nginx status
sudo systemctl status nginx

# 8. Check Nginx error log for any proxy issues
sudo tail -f /var/log/nginx/error.log
```

---

## 14. Updating the Application

```bash
# From the fsm/ directory on the server

# 1. Pull the latest code
git pull origin master

# 2. Rebuild the changed services
docker compose build fsm-server fsm-web fsm-ai

# 3. Restart services one at a time (minimises downtime)
docker compose up -d --no-deps fsm-redis
docker compose up -d --no-deps fsm-server
# Wait for fsm-server to become healthy, then:
docker compose up -d --no-deps fsm-ai
docker compose up -d --no-deps fsm-web

# 4. Run any new migrations
docker compose exec fsm-server \
  npx sequelize-cli db:migrate

# 5. Verify
docker compose ps
docker compose logs --tail=50 fsm-server
docker compose logs --tail=50 fsm-ai
```

---

## 15. Useful Docker Commands

### Starting / stopping

```bash
# Start all services (detached)
docker compose up -d

# Stop all services (containers removed, volumes and data preserved)
docker compose down

# Stop a single service
docker compose stop fsm-server

# Restart a single service
docker compose restart fsm-server

# Rebuild and restart a single service
docker compose up -d --build fsm-server
```

### Logs

```bash
# Follow all logs
docker compose logs -f

# Follow a specific service
docker compose logs -f fsm-server
docker compose logs -f fsm-ai

# Last 100 lines
docker compose logs --tail=100 fsm-server
```

### Shell access

```bash
# Open a shell inside the backend container
docker compose exec fsm-server sh

# Open a shell inside the web container
docker compose exec fsm-web sh

# Open a shell inside the AI container
docker compose exec fsm-ai bash

# Open a Redis CLI inside the Redis container
docker compose exec fsm-redis redis-cli

# Run a migration manually
docker compose exec fsm-server \
  npx sequelize-cli db:migrate
```

### Resource inspection

```bash
# Live resource usage
docker stats

# Disk usage by Docker
docker system df

# Remove unused images and cache (free disk space)
docker system prune -f

# Remove ALL unused images (more aggressive)
docker system prune -af
```

### With production resource limits

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 16. Logs & Monitoring

### Docker container logs

```bash
# Backend application logs
docker compose logs -f fsm-server

# Frontend / Nginx container logs
docker compose logs -f fsm-web

# AI service logs
docker compose logs -f fsm-ai

# Redis logs
docker compose logs -f fsm-redis
```

### Ubuntu host Nginx logs

```bash
# Live access log
sudo tail -f /var/log/nginx/access.log

# Live error log (useful for 502/504 debugging)
sudo tail -f /var/log/nginx/error.log
```

### Container health status

```bash
# Quick overview
docker compose ps

# Detailed health output for the server
docker inspect --format='{{json .State.Health}}' fsm-server | python3 -m json.tool

# Detailed health output for the AI service
docker inspect --format='{{json .State.Health}}' fsm-ai | python3 -m json.tool
```

---

## 17. Troubleshooting

### Container won't start — always check logs first

```bash
docker compose logs fsm-server
docker compose logs fsm-web
docker compose logs fsm-ai
docker compose logs fsm-redis
```

---

### `fsm-server` exits or crashes on startup

**Likely cause:** Missing environment variable or DB connection failure.

```bash
# Check if DB is reachable from inside the container
docker compose exec fsm-server \
  wget -qO- "http://localhost:3213/api/health" || echo "Not ready"

# Verify the DB_HOST is the external IP, not 'localhost'
docker compose exec fsm-server env | grep DB_HOST
# Expected: DB_HOST=your.database.server.ip

# Check Redis connectivity
docker compose exec fsm-server sh -c "nc -z fsm-redis 6379 && echo OK || echo FAIL"
```

---

### `fsm-ai` exits or crashes on startup

**Likely cause:** Missing Python dependencies or insufficient memory for ML models.

```bash
# Check AI service logs for import errors
docker compose logs --tail=100 fsm-ai

# Check available memory
free -h

# Verify the AI service health endpoint
docker compose exec fsm-ai \
  curl -s http://localhost:8000/health || echo "Not ready"
```

> **Memory tip:** If the AI service runs out of memory loading ML models, increase the server RAM to 16 GB or disable unused ML features by setting environment flags in `.env`.

---

### Frontend shows a blank page or 404 on page refresh

**Likely cause:** SPA routing not configured in the container's Nginx.

```bash
# Verify the nginx.conf inside the container has try_files
docker compose exec fsm-web cat /etc/nginx/conf.d/default.conf | grep try_files
# Expected output: try_files $uri $uri/ /index.html;
```

If missing, rebuild the web image:
```bash
docker compose build --no-cache fsm-web
docker compose up -d --no-deps fsm-web
```

---

### `502 Bad Gateway` from Ubuntu Nginx

**Likely cause:** `fsm-web` container is not running or the `WEB_PORT` doesn't match.

```bash
# Check the container is up and the port is correct
docker compose ps
# Should show: 127.0.0.1:3123->80/tcp

# Test the container directly from the host
curl -v http://127.0.0.1:3123

# Check the Nginx proxy_pass port matches WEB_PORT in .env
grep proxy_pass /etc/nginx/sites-available/fsm.yourdomain.com
# Should match the port shown in docker compose ps
```

---

### API calls fail inside the app (`/api/*` returns 502)

**Likely cause:** `fsm-server` container is not healthy.

```bash
# Check server health from inside the web container
docker compose exec fsm-web \
  wget -qO- http://fsm-server:3213/api/health
# Expected: JSON health response

# Check server container logs
docker compose logs --tail=50 fsm-server
```

---

### AI service calls fail (`/api/ai/*` returns 502 or timeout)

**Likely cause:** `fsm-ai` container is not running or ML model loading is slow.

```bash
# Check AI service health
docker compose exec fsm-server \
  wget -qO- http://fsm-ai:8000/health
# Expected: {"status":"ok"}

# Check AI service logs for errors
docker compose logs --tail=100 fsm-ai
```

---

### WebSocket connections fail (real-time updates not working)

**Likely cause:** WebSocket upgrade headers not being forwarded.

```bash
# Verify the host Nginx config has WebSocket headers
grep -A2 "Upgrade" /etc/nginx/sites-available/fsm.yourdomain.com
# Expected:
#   proxy_set_header Upgrade $http_upgrade;
#   proxy_set_header Connection 'upgrade';

# Verify the internal Nginx (fsm-web) also forwards WebSocket
docker compose exec fsm-web cat /etc/nginx/conf.d/default.conf | grep -A2 "Upgrade"
```

---

### Redis connection errors

**Likely cause:** `fsm-redis` container is not running or REDIS_HOST is wrong.

```bash
# Check Redis is running
docker compose ps fsm-redis

# Test Redis from inside the server container
docker compose exec fsm-server sh -c "nc -z fsm-redis 6379 && echo OK || echo FAIL"

# Verify REDIS_HOST is set to 'fsm-redis' (Docker service name)
docker compose exec fsm-server env | grep REDIS_HOST
# Expected: REDIS_HOST=fsm-redis
```

---

### Certbot fails — "Domain not resolving to this server"

DNS has not propagated yet. Verify:
```bash
# From the server itself
curl -s http://fsm.yourdomain.com
# Should hit your Nginx, not time out
```

Wait 5–30 minutes after creating the DNS A record, then retry Certbot.

---

### Port 3123 already in use on the host

```bash
# Find what is using it
sudo lsof -i :3123

# Change WEB_PORT in .env to a free port, e.g. 3124
WEB_PORT=3124
# Also update proxy_pass in the Nginx site config to match
```

---

### Database migration errors

```bash
# See which migrations have run and which are pending
docker compose exec fsm-server \
  npx sequelize-cli db:migrate:status

# Undo the last migration (use with caution in production)
docker compose exec fsm-server \
  npx sequelize-cli db:migrate:undo
```

---

### HTTPS certificate not renewing

```bash
# Test renewal manually
sudo certbot renew --dry-run

# If it fails, check Nginx is running and port 80 is accessible
sudo systemctl status nginx
sudo ufw status
```

---

## 18. Port Reference

| Port | Where               | Binding              | Purpose                                              |
|------|---------------------|----------------------|------------------------------------------------------|
| 443  | Ubuntu (host)       | `0.0.0.0:443`       | HTTPS — public entry point (managed by Certbot)      |
| 80   | Ubuntu (host)       | `0.0.0.0:80`        | HTTP → HTTPS redirect (managed by Certbot)           |
| 3123 | Ubuntu (host)       | `127.0.0.1:3123`    | Docker web container — localhost only                |
| 80   | Docker `fsm-web`    | internal             | Nginx serving React + proxying /api and /socket.io   |
| 3213 | Docker `fsm-server` | internal only        | NestJS API + WebSockets — no host port, never public |
| 8000 | Docker `fsm-ai`     | internal only        | FastAPI AI/ML service — no host port, never public   |
| 6379 | Docker `fsm-redis`  | internal only        | Redis cache + Celery broker — never public           |
| 5432 | External server     | your DB server IP    | PostgreSQL — not on this Docker host                 |

**Firewall rules (UFW):**

```bash
# Allow only HTTP and HTTPS publicly
sudo ufw allow 22/tcp        # SSH — keep this!
sudo ufw allow 80/tcp        # HTTP (Certbot challenge + redirect)
sudo ufw allow 443/tcp       # HTTPS
sudo ufw enable

# Verify — ports 3123, 3213, 8000, and 6379 must NOT appear as public rules
sudo ufw status
```

---

*FieldForce Pro — AI-Powered Field Service Management. Last updated: 2026-03-04.*
