# Deploy frontend lên VPS (chạy chung với pos-saas)

Hướng dẫn đầy đủ (network, Caddy, SSL, GitHub Actions) nằm trong `DEPLOY_VPS.md` của repo **english-learning-be**.
Hãy deploy backend trước.

| File | Vai trò |
|---|---|
| `Dockerfile` | Build Vite (Node 22) rồi phục vụ bằng Nginx, nhãn `project=english-learning` |
| `nginx.conf` | Nginx trong container: mở được route con của React Router, gzip, cache `/assets` |
| `docker-compose.yml` | Container `english-learning-fe`, mở `127.0.0.1:${WEB_HOST_PORT:-8080}` để kiểm tra |
| `docker-compose.proxy.yml` | Nối container vào network của Caddy (`pos-saas_default`) |
| `.github/workflows/deploy.yml` | Push `main` → lint, test → SSH vào VPS → `docker compose up -d --build` |

## Chạy

```bash
cd /var/www/english-learning
git clone https://github.com/TruongHidu/english-learning-fe.git
cd english-learning-fe
cat > .env <<'EOF'
COMPOSE_FILE=docker-compose.yml:docker-compose.proxy.yml
PROXY_NETWORK=pos-saas_default
VITE_API_BASE_URL=/api/v1
EOF
docker compose up -d --build
docker exec pos-saas-web-1 wget -qO- http://english-learning-fe:80 | head -c 200
```

Caddy của pos-saas proxy `/*` → `english-learning-fe:80` và `/api/*` → `english-learning-be:5000`
(xem bước 5 trong hướng dẫn backend).

> `VITE_API_BASE_URL` được ghi vào code lúc build: đổi giá trị này thì phải `docker compose up -d --build` lại.

## Cập nhật thủ công

```bash
cd /var/www/english-learning/english-learning-fe
git pull --ff-only origin main
docker compose up -d --build
docker image prune -f --filter label=project=english-learning
```
