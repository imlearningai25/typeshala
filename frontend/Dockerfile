# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build


# ── Runtime stage — serve via NGINX ───────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom NGINX config for SPA routing (all 404s → index.html)
COPY nginx.spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
