#!/bin/bash

# Test auth3ds endpoint with the parameters from the log
curl -X POST http://localhost:9000/store/iyzico/auth3ds \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "27150116",
    "conversationId": "conv_1759520593870_2mnntocfi", 
    "cartId": "cart_01K6NRH702DVM1QDS7P7GAA4JK"
  }' | jq .

echo ""
echo "✅ Test completed. Check the server logs for detailed cart-to-order conversion process."