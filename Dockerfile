# syntax=docker/dockerfile:1

# ---------- Stage 1: build Vite app ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Biến VITE_* được nhúng vào bundle lúc build, nên phải truyền qua build arg.
# Mặc định gọi API cùng domain (/api/v1) qua Nginx của VPS.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && test -f dist/index.html

# ---------- Stage 2: serve static files with Nginx ----------
FROM nginx:1.27-alpine AS runtime
LABEL project=english-learning

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
