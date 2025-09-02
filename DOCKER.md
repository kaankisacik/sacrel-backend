# Docker Kullanım Kılavuzu

Bu dosya, Sacrel Backend projesi için Docker kullanım talimatlarını içerir.

## Dosyalar

- `Dockerfile`: Geliştirme için basit Docker image'ı
- `Dockerfile.production`: Production için optimize edilmiş multi-stage build
- `docker-compose.yml`: PostgreSQL ile birlikte tam stack
- `.dockerignore`: Docker build'e dahil edilmeyecek dosyalar

## Hızlı Başlangıç

### Docker Compose ile (Önerilen)

```bash
# Tüm servisleri başlat (PostgreSQL + Backend)
docker-compose up -d

# Logları takip et
docker-compose logs -f

# Servisleri durdur
docker-compose down

# Veritabanı verilerini de sil
docker-compose down -v
```

### Sadece Backend Container'ı

```bash
# Development Dockerfile ile build
docker build -t sacrel-backend .

# Production Dockerfile ile build
docker build -f Dockerfile.production -t sacrel-backend:prod .

# Container'ı çalıştır
docker run -p 9000:9000 \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-jwt-secret" \
  -e COOKIE_SECRET="your-cookie-secret" \
  sacrel-backend
```

## Environment Variables

Container çalıştırırken aşağıdaki environment variable'ları ayarlayın:

- `DATABASE_URL`: PostgreSQL bağlantı URL'i
- `JWT_SECRET`: JWT token için secret key
- `COOKIE_SECRET`: Cookie encryption için secret key
- `STORE_CORS`: Frontend store URL'i (default: http://localhost:3000)
- `ADMIN_CORS`: Admin panel URL'i (default: http://localhost:9000)
- `AUTH_CORS`: Authentication için izin verilen URL'ler

## Veritabanı Migrasyonları

Container ilk çalıştırıldığında migration'ları manuel olarak çalıştırmanız gerekebilir:

```bash
# Container'a bağlan
docker exec -it sacrel-backend sh

# Migration'ları çalıştır
pnpm medusa db:migrate

# Seed data ekle (opsiyonel)
pnpm seed
```

## Volume Mount'ları

- `./static:/app/static`: Upload edilen dosyalar için

## Health Check

Production Dockerfile'da health check dahildir. Container'ın sağlığını kontrol etmek için:

```bash
docker inspect --format='{{.State.Health.Status}}' sacrel-backend
```

## Troubleshooting

### Container başlamıyor
- Environment variable'ları kontrol edin
- Database bağlantısını kontrol edin
- Logları inceleyin: `docker logs sacrel-backend`

### Static dosyalar erişilemiyor
- Volume mount'ların doğru yapıldığından emin olun
- File permissions'ları kontrol edin

### Port conflicts
- 9000 portu başka bir servis tarafından kullanılıyor olabilir
- Docker run komutunda farklı port mapping kullanın: `-p 9001:9000`
