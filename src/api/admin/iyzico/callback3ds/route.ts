import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Iyzico callback parametreleri için tip tanımı
interface IyzicoCallbackData {
  status?: string
  paymentId?: string
  conversationData?: string
  conversationId?: string
  mdStatus?: string
  [key: string]: any // Diğer olası alanlar için
}


export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {


    console.log('=== IYZICO 3DS CALLBACK RECEIVED ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Body Type:', typeof req.body);
    console.log('Body Keys:', Object.keys(req.body || {}));
    
    const body = req.body as IyzicoCallbackData;
    
    // Debug: tüm body alanlarını kontrol et
    for (const [key, value] of Object.entries(body || {})) {
      console.log(`Body field: ${key} = ${value}`);
    }
    
    const {
      status,
      paymentId,
      conversationData,
      conversationId,
      mdStatus
    } = body;

    console.log("=== EXTRACTED PARAMETERS ===")
    console.log("Status:", status)
    console.log("Payment ID:", paymentId)
    console.log("Conversation Data:", conversationData)
    console.log("Conversation ID:", conversationId)
    console.log("MD Status:", mdStatus)

    // mdStatus kontrolü
    if (mdStatus === "1") {
      console.log("✅ 3DS SUCCESS - mdStatus = 1")
    } else {
      console.log("❌ 3DS FAILED - mdStatus =", mdStatus)
      console.log("MD Status meanings:")
      console.log("0: 3-D Secure imzası geçersiz")
      console.log("2: Kart sahibi veya bankası sisteme kayıtlı değil")
      console.log("3: Kartın bankası sisteme kayıtlı değil")
      console.log("4: Doğrulama denemesi, kart sahibi sisteme daha sonra kayıt olmayı seçmiş")
      console.log("5: Doğrulama yapılamıyor")
      console.log("6: 3-D Secure hatası")
      console.log("7: Sistem hatası")
      console.log("8: Bilinmeyen kart no")
    }

    // İşlem başarılı ise auth3DS çağrısı yapılabilir
    if (status === "success" && paymentId) {
      console.log("=== READY FOR AUTH3DS ===")
      console.log("Next step: Call auth3DS with paymentId:", paymentId)
      if (conversationData) {
        console.log("Include conversationData:", conversationData)
      }
    }

    console.log("=== END CALLBACK ===")

    // Frontend'e yönlendirme için HTML yanıtı döndür
    const params = new URLSearchParams();
    
    if (status) params.append('status', String(status));
    if (paymentId) params.append('paymentId', String(paymentId));
    if (conversationData) params.append('conversationData', String(conversationData));
    if (conversationId) params.append('conversationId', String(conversationId));
    if (mdStatus) params.append('mdStatus', String(mdStatus));
    
    // Tüm body alanlarını ekle
    for (const [key, value] of Object.entries(body || {})) {
      if (!params.has(key)) {
        params.append(key, String(value));
      }
    }
    
    // Frontend callback sayfasına yönlendirme URL'si
    const frontendCallbackUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendCallbackUrl}/payment/callback/result?${params.toString()}`;
    
    console.log('Redirecting to:', redirectUrl);
    console.log('Parameters:', params.toString());
    
    // HTML formu ile yönlendirme (POST callback'ler için daha güvenilir)
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Processing...</title>
        <meta charset="utf-8">
      </head>
      <body>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h3>Ödeme işleniyor...</h3>
          <p>Lütfen bekleyin...</p>
          <div style="margin: 20px 0;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        <script>
          console.log('Redirecting to callback result page...');
          console.log('URL:', '${redirectUrl}');
          setTimeout(() => {
            window.location.href = '${redirectUrl}';
          }, 1000);
        </script>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error: any) {
    console.error("❌ CALLBACK ERROR:", error)
    
    // Hata durumunda da frontend'e yönlendir
    const frontendCallbackUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const errorUrl = `${frontendCallbackUrl}/payment/callback/result?status=error&error=callback_processing_failed`;
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Error</title>
        <meta charset="utf-8">
      </head>
      <body>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h3>Bir hata oluştu</h3>
          <p>Yönlendiriliyorsunuz...</p>
        </div>
        <script>
          window.location.href = '${errorUrl}';
        </script>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(errorHtml);
  }
}

// GET endpoint'i de ekleyelim test için
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.query as Record<string, string>;
  console.log('=== CALLBACK GET RECEIVED ===');
  console.log('GET Query:', query);
  
  // Frontend callback sayfasına yönlendir
  const params = new URLSearchParams();
  
  for (const [key, value] of Object.entries(query || {})) {
    params.append(key, String(value));
  }
  
  const frontendCallbackUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const redirectUrl = `${frontendCallbackUrl}/payment/callback/result?${params.toString()}`;
  
  console.log('GET Redirecting to:', redirectUrl);
  
  // 302 redirect
  res.setHeader('Location', redirectUrl);
  return res.status(302).send('Redirecting...');
}

export const AUTHENTICATE = false; // Bu endpoint için kimlik doğrulamayı devre dışı bırak