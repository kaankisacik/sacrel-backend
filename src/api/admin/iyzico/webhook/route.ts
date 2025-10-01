import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Iyzico Webhook tip tanımı
interface IyzicoWebhook {
  iyziEventTime: number;
  iyziEventType: string; // API_AUTH, THREE_DS_AUTH, BKM_AUTH
  iyziReferenceCode: string;
  paymentId: string;
  paymentConversationId: string;
  status: string; // SUCCESS, FAILURE
}

// Iyzico IP whitelist (güvenlik için)
// const IYZICO_IPS = [
//   '213.74.191.17',
//   '213.74.191.18', 
//   '213.74.191.19',
//   '213.74.191.20',
//   // Sandbox için localhost'a da izin ver
//   '127.0.0.1',
//   '::1'
// ];

// // IP kontrolü fonksiyonu
// function getClientIP(req: MedusaRequest): string {
//   const forwarded = req.headers['x-forwarded-for'];
//   const real = req.headers['x-real-ip'];
//   const connection = req.socket?.remoteAddress;
  
//   if (typeof forwarded === 'string') {
//     return forwarded.split(',')[0].trim();
//   }
//   if (typeof real === 'string') {
//     return real;
//   }
//   return connection || 'unknown';
// }

// function isValidIyzicoIP(ip: string): boolean {
//   // Development ortamında IP kontrolü yapma
//   if (process.env.NODE_ENV === 'development') {
//     return true;
//   }
  
//   return IYZICO_IPS.includes(ip);
// }

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // IP güvenlik kontrolü
    // const clientIP = getClientIP(req);
    // console.log('=== WEBHOOK IP CHECK ===');
    // console.log('Client IP:', clientIP);
    
    // if (!isValidIyzicoIP(clientIP)) {
    //   console.error('❌ UNAUTHORIZED WEBHOOK IP:', clientIP);
    //   return res.status(403).json({
    //     status: 'error',
    //     message: 'Unauthorized IP address'
    //   });
    // }
    
    // console.log('✅ WEBHOOK IP AUTHORIZED:', clientIP);
    
    console.log('=== IYZICO WEBHOOK RECEIVED ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    const body = req.body as IyzicoWebhook;
    
    console.log('Event Time:', new Date(body.iyziEventTime).toISOString());
    console.log('Event Type:', body.iyziEventType);
    console.log('Reference Code:', body.iyziReferenceCode);
    console.log('Payment ID:', body.paymentId);
    console.log('Conversation ID:', body.paymentConversationId);
    console.log('Status:', body.status);

    // Webhook doğrulama
    if (!body.paymentId || !body.status || !body.iyziEventType) {
      console.error('Invalid webhook data received');
      return res.status(400).json({
        status: 'error',
        message: 'Invalid webhook data'
      });
    }

    // Event type kontrolü
    const validEventTypes = ['API_AUTH', 'THREE_DS_AUTH', 'BKM_AUTH'];
    if (!validEventTypes.includes(body.iyziEventType)) {
      console.error('Invalid event type:', body.iyziEventType);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid event type'
      });
    }

    // Webhook verilerini işle
    if (body.status === 'SUCCESS') {
      console.log('✅ Payment successful webhook received');
      
      await processSuccessfulPayment({
        paymentId: body.paymentId,
        conversationId: body.paymentConversationId,
        eventTime: body.iyziEventTime,
        referenceCode: body.iyziReferenceCode,
        eventType: body.iyziEventType
      });
      
    } else if (body.status === 'FAILURE') {
      console.log('❌ Payment failed webhook received');
      
      await processFailedPayment({
        paymentId: body.paymentId,
        conversationId: body.paymentConversationId,
        eventTime: body.iyziEventTime,
        referenceCode: body.iyziReferenceCode,
        eventType: body.iyziEventType
      });
    }

    // iyzico'ya 200 yanıtı dön (önemli!)
    return res.status(200).json({
      status: 'success',
      message: 'Webhook processed successfully',
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('=== WEBHOOK PROCESSING ERROR ===');
    console.error(error);

    return res.status(500).json({
      status: 'error',
      message: 'Webhook processing failed',
      error: error?.message
    });
  }
}

// GET endpoint'i test için
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  return res.status(200).json({
    message: "Iyzico Webhook endpoint is active",
    endpoint: "/store/iyzico/webhook",
    method: "POST",
    description: "This endpoint receives Iyzico webhook notifications"
  });
}

// Başarılı ödeme işleme fonksiyonu
async function processSuccessfulPayment(data: {
  paymentId: string;
  conversationId: string;
  eventTime: number;
  referenceCode: string;
  eventType: string;
}) {
  try {
    console.log('Processing successful payment:', data.paymentId);
    console.log('Event Type:', data.eventType);
    
    // TODO: Burada aşağıdaki işlemler yapılmalı:
    
    // 1. Veritabanında ödeme durumunu güncelle
    // const paymentService = req.scope.resolve("paymentService");
    // await paymentService.updatePaymentStatus(data.paymentId, 'completed');
    
    // 2. Sipariş durumunu güncelle (Medusa Order Service kullanarak)
    // const orderService = req.scope.resolve("orderService");
    // const order = await orderService.retrieveByPaymentId(data.paymentId);
    // await orderService.update(order.id, { payment_status: 'captured' });
    
    // 3. Müşteriye e-posta gönder
    // const notificationService = req.scope.resolve("notificationService");
    // await notificationService.sendPaymentConfirmationEmail(data.conversationId);
    
    // 4. SMS bildirimi gönder (opsiyonel)
    // await notificationService.sendSMSNotification(data.conversationId);
    
    // 5. Stok güncelle (Medusa Inventory Service kullanarak)
    // const inventoryService = req.scope.resolve("inventoryService");
    // await inventoryService.updateInventoryForOrder(data.conversationId);
    
    // 6. Diğer sistemlere bildirim gönder
    // await notifyExternalSystems(data);
    
    // 7. Analytics ve raporlama
    // const analyticsService = req.scope.resolve("analyticsService");
    // await analyticsService.trackPaymentEvent('payment_completed', data);
    
    console.log('✅ Successful payment processed:', data.paymentId);
    
    // Şimdilik sadece console log
    console.log('=== PAYMENT SUCCESS ACTIONS ===');
    console.log('Payment ID:', data.paymentId);
    console.log('Conversation ID:', data.conversationId);
    console.log('Event Time:', new Date(data.eventTime).toISOString());
    console.log('Reference Code:', data.referenceCode);
    console.log('Event Type:', data.eventType);
    console.log('TODO: Implement actual business logic');
    
  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
}

// Başarısız ödeme işleme fonksiyonu
async function processFailedPayment(data: {
  paymentId: string;
  conversationId: string;
  eventTime: number;
  referenceCode: string;
  eventType: string;
}) {
  try {
    console.log('Processing failed payment:', data.paymentId);
    console.log('Event Type:', data.eventType);
    
    // TODO: Burada aşağıdaki işlemler yapılmalı:
    
    // 1. Veritabanında ödeme durumunu güncelle
    // const paymentService = req.scope.resolve("paymentService");
    // await paymentService.updatePaymentStatus(data.paymentId, 'failed');
    
    // 2. Sipariş durumunu güncelle
    // const orderService = req.scope.resolve("orderService");
    // const order = await orderService.retrieveByPaymentId(data.paymentId);
    // await orderService.update(order.id, { payment_status: 'requires_action' });
    
    // 3. Rezerve edilen stoku geri al
    // const inventoryService = req.scope.resolve("inventoryService");
    // await inventoryService.releaseReservedInventory(data.conversationId);
    
    // 4. Müşteriye bilgilendirme e-postası gönder
    // const notificationService = req.scope.resolve("notificationService");
    // await notificationService.sendPaymentFailedEmail(data.conversationId);
    
    // 5. Analytics ve raporlama
    // const analyticsService = req.scope.resolve("analyticsService");
    // await analyticsService.trackPaymentEvent('payment_failed', data);
    
    console.log('❌ Failed payment processed:', data.paymentId);
    
    // Şimdilik sadece console log
    console.log('=== PAYMENT FAILURE ACTIONS ===');
    console.log('Payment ID:', data.paymentId);
    console.log('Conversation ID:', data.conversationId);
    console.log('Event Time:', new Date(data.eventTime).toISOString());
    console.log('Reference Code:', data.referenceCode);
    console.log('Event Type:', data.eventType);
    console.log('TODO: Implement actual business logic');
    
  } catch (error) {
    console.error('Error processing failed payment:', error);
    throw error;
  }
}

export const AUTHENTICATE = false; // Bu endpoint için kimlik doğrulamayı devre dışı bırak