// Test script for auth3ds endpoint
// Bu dosyayı frontend integration için referans olarak kullanabilirsiniz

const testAuth3DS = async () => {
  try {
    // 1. Önce bir cart oluşturun ve payment collection'ı başlatın
    // 2. İyzico ile 3DS initialization yapın
    // 3. 3DS tamamlandıktan sonra bu endpoint'i çağırın
    
    const response = await fetch('http://localhost:9000/store/iyzico/auth3ds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentId: 'iyzico-payment-id-from-callback',
        conversationId: 'cart-id-or-conversation-id',
        cartId: 'explicit-cart-id', // Bu parametreyi mutlaka gönderin!
        conversationData: 'optional-conversation-data'
      })
    });

    const result = await response.json();
    
    console.log('Auth3DS Response:', result);
    
    // Başarılı ise result şu şekilde olacak:
    if (result.medusa?.cart_completed) {
      console.log('✅ Sipariş başarıyla oluşturuldu!');
      console.log('Order ID:', result.medusa.order_id);
      console.log('Payment Captured:', result.medusa.payment_captured);
      
      // Kullanıcıyı başarı sayfasına yönlendirin
      window.location.href = `/order-success/${result.medusa.order_id}`;
    } else {
      console.log('❌ Sipariş oluşturulamadı:', result.medusa?.error);
      // Hata sayfasına yönlendirin
      window.location.href = '/payment-failed';
    }
    
  } catch (error) {
    console.error('Auth3DS Error:', error);
  }
};

// Frontend Integration Example:
const frontendIntegration = `
// 1. Cart oluşturduktan sonra cartId'yi saklayın
const cartId = 'cart_123456';

// 2. İyzico 3DS process'ini başlatın
const init3DSResponse = await fetch('/store/iyzico/init3ds', {
  method: 'POST',
  body: JSON.stringify({
    // ... init3DS parametreleri
    conversationId: cartId, // Cart ID'yi conversation ID olarak kullanın
    basketId: cartId
  })
});

// 3. 3DS tamamlandıktan sonra callback'ten gelen parametrelerle auth3DS çağırın
const auth3DSResponse = await fetch('/store/iyzico/auth3ds', {
  method: 'POST',
  body: JSON.stringify({
    paymentId: callbackParams.paymentId,
    conversationId: callbackParams.conversationId,
    cartId: cartId, // Önemli: Cart ID'yi mutlaka gönderin!
    conversationData: callbackParams.conversationData
  })
});
`;

console.log('Frontend Integration Guide:');
console.log(frontendIntegration);

module.exports = { testAuth3DS };