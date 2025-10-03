// Test script to check Iyzico auth3DS response format
const { IyzicoDirect } = require('./src/lib/iyzico-direct');

async function testIyzicoAuth3DS() {
  const svc = new IyzicoDirect();
  
  try {
    const response = await svc.auth3DS({
      locale: "tr",
      paymentId: "27150116", // Gerçek payment ID'den
      conversationId: "conv_1759520593870_2mnntocfi"
    });
    
    console.log("🔍 Full İyzico Auth3DS Response:");
    console.log(JSON.stringify(response, null, 2));
    
    console.log("\n📊 Response Keys:");
    console.log(Object.keys(response || {}));
    
    console.log("\n✅ Success Check Logic:");
    console.log("Status:", response?.status);
    console.log("PaymentStatus:", response?.paymentStatus);
    console.log("Payment_status:", response?.payment_status);
    console.log("ErrorCode:", response?.errorCode);
    console.log("Error_code:", response?.error_code);
    console.log("ErrorMessage:", response?.errorMessage);
    console.log("Error_message:", response?.error_message);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Test etmek için:
// node test-iyzico-response.js
if (require.main === module) {
  testIyzicoAuth3DS();
}

module.exports = { testIyzicoAuth3DS };