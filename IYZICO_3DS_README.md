# Iyzico 3DS Entegrasyonu - Medusa Backend

Bu dokümantasyon, Iyzico 3DS ödeme entegrasyonunu Medusa backend üzerinde nasıl kullanacağınızı açıklamaktadır.

## 🔒 Güvenlik ve Authentication

Iyzico callback ve webhook endpoint'leri **authentication gerektirmez** çünkü harici servislerden gelmektedir. Güvenlik için:

- ✅ **IP Whitelist**: Sadece Iyzico IP'lerinden gelen isteklere izin verilir
- ✅ **Development Mode**: Geliştirme ortamında IP kontrolü devre dışıdır
- ✅ **Middleware Bypass**: Özel middleware konfigürasyonu ile authentication bypass edilir

### Güvenlik Konfigürasyonu

`src/api/middlewares.ts` dosyasında şu endpoint'ler authentication'dan muaf tutulmuştur:

```typescript
{
  matcher: "/store/iyzico/callback3ds",
  method: ["GET", "POST"],
  middlewares: [], // Authentication yok
},
{
  matcher: "/store/iyzico/webhook", 
  method: "POST",
  middlewares: [], // Authentication yok
}
```

## Endpoint'ler

### 1. BIN Sorgulama
**Endpoint:** `POST /store/iyzico/binCheck`
**Amaç:** Kart bilgilerini ve taksit seçeneklerini sorgulama

```json
{
  "price": "100.0",
  "binNumber": "535805"
}
```

### 2. 3DS Başlatma
**Endpoint:** `POST /store/iyzico/init3ds`
**Amaç:** 3DS ödeme sürecini başlatma

```json
{
  "locale": "tr",
  "conversationId": "unique-conversation-id",
  "price": 100.0,
  "paidPrice": 100.0,
  "currency": "TRY",
  "installment": 1,
  "paymentChannel": "WEB",
  "basketId": "basket-123",
  "paymentGroup": "PRODUCT",
  "callbackUrl": "http://your-backend-url/store/iyzico/callback3ds",
  "paymentCard": {
    "cardHolderName": "John Doe",
    "cardNumber": "5526080000000006",
    "expireYear": "2023",
    "expireMonth": "11",
    "cvc": "200"
  },
  "buyer": { /* buyer bilgileri */ },
  "shippingAddress": { /* adres bilgileri */ },
  "billingAddress": { /* fatura adresi */ },
  "basketItems": [
    {
      "id": "item-1",
      "price": "100.0",
      "name": "Product Name",
      "category1": "Category",
      "itemType": "PHYSICAL"
    }
  ]
}
```

**Yanıt:** `threeDSHtmlContent` içeren yanıt döner.

### 3. 3DS Callback (Yönlendirme)
**Endpoint:** `POST /store/iyzico/callback3ds`
**Amaç:** Iyzico'dan gelen 3DS sonuç verilerini alma ve frontend'e yönlendirme

Bu endpoint otomatik olarak çalışır. Iyzico, 3DS işlemi tamamlandığında bu endpoint'e POST isteği gönderir.

**Çalışma Mantığı:**
1. Iyzico'dan gelen parametreleri alır (status, paymentId, conversationData, conversationId, mdStatus)
2. Parametreleri console'a yazdırır
3. Frontend callback sayfasına HTML ile yönlendirme yapar

### 4. 3DS Tamamlama
**Endpoint:** `POST /store/iyzico/complete3ds`
**Amaç:** Callback'ten alınan verilerle ödemeyi tamamlama

```json
{
  "paymentId": "callback-ten-gelen-payment-id",
  "conversationId": "conversation-id",
  "conversationData": "callback-ten-gelen-data", // opsiyonel
  "locale": "tr"
}
```

### 5. 3DS Auth (Direkt)
**Endpoint:** `POST /store/iyzico/auth3ds`
**Amaç:** Doğrudan auth3DS çağrısı yapma

```json
{
  "locale": "tr",
  "paymentId": "payment-id",
  "conversationId": "conversation-id",
  "conversationData": "conversation-data" // opsiyonel
}
```

### 6. Webhook
**Endpoint:** `POST /store/iyzico/webhook`
**Amaç:** Iyzico'dan gelen webhook bildirimlerini alma

Bu endpoint Iyzico tarafından otomatik olarak çağrılır:
- Her 15 saniyede bir
- Sunucu 200 yanıtını alana kadar
- Her 10 dakikada bir
- Maksimum 3 kere

## Kullanım Senaryosu

### 1. Standart 3DS Akışı

```bash
# 1. BIN Sorgulama (opsiyonel)
POST /store/iyzico/binCheck

# 2. 3DS Başlatma
POST /store/iyzico/init3ds

# 3. threeDSHtmlContent'i decode edip kullanıcıya göster
# Kullanıcı 3DS doğrulamasını tamamlar

# 4. Iyzico otomatik olarak callback endpoint'ini çağırır
# POST /store/iyzico/callback3ds (otomatik)

# 5. Frontend callback sayfasında sonucu kontrol et
# mdStatus=1 ise başarılı, diğer durumlar başarısız

# 6. Başarılı ise 3DS'i tamamla
POST /store/iyzico/complete3ds

# 7. Webhook bildirimi gelir (otomatik)
# POST /store/iyzico/webhook (otomatik)
```

### 2. Frontend Entegrasyonu

Frontend'te callback sonuçlarını işlemek için:

```javascript
// /payment/callback/result sayfasında
const urlParams = new URLSearchParams(window.location.search);
const status = urlParams.get('status');
const paymentId = urlParams.get('paymentId');
const conversationData = urlParams.get('conversationData');
const conversationId = urlParams.get('conversationId');
const mdStatus = urlParams.get('mdStatus');

if (status === 'success' && mdStatus === '1') {
  // Başarılı - 3DS'i tamamla
  const response = await fetch('/store/iyzico/complete3ds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId,
      conversationId,
      conversationData
    })
  });
  
  const result = await response.json();
  if (result.status === 'completed') {
    // Ödeme başarılı
    window.location.href = '/payment/success';
  } else {
    // Ödeme başarısız
    window.location.href = '/payment/failed';
  }
} else {
  // 3DS başarısız
  window.location.href = '/payment/failed';
}
```

## Environment Variables

`.env` dosyasına aşağıdaki değişkenleri ekleyin:

```bash
# Iyzico Configuration
IYZI_API_KEY=sandbox-your-api-key
IYZI_SECRET_KEY=sandbox-your-secret-key
IYZI_BASE_URL=https://sandbox-api.iyzipay.com

# Frontend URL for callback redirects
FRONTEND_URL=http://localhost:3000
```

## Önemli Notlar

1. **callbackUrl**: `init3ds` çağrısında mutlaka backend'inizin callback endpoint'ini verin:
   ```
   http://your-backend-url/store/iyzico/callback3ds
   ```

2. **Frontend Callback Sayfası**: Frontend'te `/payment/callback/result` sayfası olmalı.

3. **mdStatus Kontrolleri**:
   - `mdStatus = 1`: Başarılı 3DS
   - `mdStatus = 0,2,3,4,5,6,7,8`: Çeşitli hata durumları

4. **Webhook Doğrulama**: Webhook'lar gerçek zamanlı ödeme doğrulaması sağlar.

5. **Error Handling**: Tüm endpoint'ler detaylı hata mesajları ve console logları sağlar.

## Test

### Authentication Bypass Testi
```bash
# Test endpoint'i - authentication gerektirmemeli
GET /store/iyzico/test
POST /store/iyzico/test
```

### Endpoint Aktivite Kontrolleri
Endpoint'lerin aktif olduğunu kontrol etmek için GET istekleri gönderebilirsiniz:

```bash
GET /store/iyzico/callback3ds
GET /store/iyzico/complete3ds  
GET /store/iyzico/webhook
GET /store/iyzico/test
```

### IP Kontrolü Testi
Geliştirme ortamında IP kontrolü devre dışıdır. Production'da sadece Iyzico IP'leri kabul edilir:
- 213.74.191.17-20
- Localhost (development için)

## Troubleshooting

### Authentication Hataları
Eğer hala authentication hatası alıyorsanız:

1. **Medusa'yı yeniden başlatın** - Middleware değişiklikleri restart gerektirir
2. **Endpoint'leri test edin**: `GET /store/iyzico/test` 
3. **Log'ları kontrol edin**: IP kontrolü ve bypass mesajları
4. **Environment kontrol**: `NODE_ENV=development` olduğundan emin olun

### Diğer Sorunlar

- Console loglarını kontrol edin - tüm adımlar detaylı şekilde loglanır
- Environment variables'ların doğru tanımlandığından emin olun
- Frontend URL'sinin callback endpoint'i ile uyumlu olduğunu kontrol edin
- Iyzico sandbox/production URL'lerinin doğru olduğunu kontrol edin