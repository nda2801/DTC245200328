# ==========================================
# DOCKERFILE CHO ỨNG DỤNG QUẢN LÝ SINH VIÊN
# Đề tài 2 - Triển khai & Quản trị HTPM
# Best practice: Multi-stage, Alpine, Non-root user
# ==========================================

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY src/package*.json ./

RUN npm ci --only=production

# Stage 2: Production Runtime
FROM node:20-alpine

LABEL maintainer="Student <student@university.edu.vn>"
LABEL description="Student Management System - DevSecOps Hardened"

WORKDIR /usr/src/app

# Thiết lập biến môi trường production
ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules và source code từ builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY src ./src

# HARDENING: Phân quyền và chuyển sang user không đặc quyền 'node' (non-root)
RUN chown -R node:node /usr/src/app
USER node

# Mở cổng 3000 cho internal network
EXPOSE 3000

# Healthcheck định kỳ kiểm tra trạng thái app
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
