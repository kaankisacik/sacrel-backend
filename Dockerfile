# Node.js 20 alpine base image kullan (daha küçük boyut için)
FROM node:20-alpine

# pnpm'i global olarak yükle
RUN npm install -g pnpm

# Çalışma dizinini oluştur
WORKDIR /app

# Package files'ları kopyala (cache optimization için)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Dependencies'leri yükle
RUN pnpm install --frozen-lockfile

# Tüm source code'u kopyala
COPY . .

# TypeScript'i build et
RUN pnpm build

# Static dosyalar için dizin oluştur
RUN mkdir -p /app/static

# Port'u expose et
EXPOSE 9000

# Production environment variable'ını set et
ENV NODE_ENV=production

# Uygulamayı başlat
CMD ["pnpm", "start"]
