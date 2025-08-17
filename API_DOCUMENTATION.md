# E-Commerce Platform API Documentation

## 🌐 API Overview

The E-Commerce Platform provides RESTful APIs across four microservices, each handling specific business domains. All APIs use JSON for request/response payloads and JWT for authentication.

**Base URLs:**
- Local Development: `http://localhost:8080/api`
- Production: `https://api.your-domain.com/api`

**Authentication:**
```
Authorization: Bearer <jwt-token>
```

## 🔐 Authentication Service (Port 3001)

### User Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "customer"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### User Profile
```http
GET /api/users/profile
Authorization: Bearer <jwt-token>
```

### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

### Change Password
```http
PUT /api/users/change-password
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

## 📦 Product Service (Port 3002)

### List Products
```http
GET /api/products?page=1&limit=10&category=electronics&search=laptop&minPrice=100&maxPrice=2000&sortBy=price&sortOrder=asc
```

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "MacBook Pro 16-inch",
      "description": "Apple MacBook Pro with M2 chip",
      "price": 2499.99,
      "category": "Electronics",
      "sku": "MBP-16-M2-512",
      "stock": 25,
      "images": ["https://example.com/image1.jpg"],
      "rating": 4.8,
      "reviewCount": 156
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Product Details
```http
GET /api/products/1
```

### Create Product (Admin)
```http
POST /api/products
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone with titanium design",
  "price": 999.99,
  "categoryId": 1,
  "sku": "IPH-15-PRO-128",
  "stock": 100,
  "images": ["https://example.com/iphone15.jpg"],
  "specifications": {
    "storage": "128GB",
    "color": "Natural Titanium",
    "display": "6.1-inch Super Retina XDR"
  }
}
```

### Update Product (Admin)
```http
PUT /api/products/1
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "price": 899.99,
  "stock": 75
}
```

### List Categories
```http
GET /api/categories
```

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic devices and accessories",
      "parentId": null,
      "children": [
        {
          "id": 2,
          "name": "Smartphones",
          "parentId": 1
        }
      ]
    }
  ]
}
```

## 🛒 Order Service (Port 3003)

### Create Order
```http
POST /api/orders
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 999.99
    },
    {
      "productId": 2,
      "quantity": 1,
      "unitPrice": 299.99
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US",
    "phone": "+1234567890"
  },
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "paymentMethod": "card",
  "notes": "Please deliver after 5 PM"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "orderNumber": "ORD-12345678-ABC123",
    "userId": 1,
    "status": "pending",
    "paymentStatus": "pending",
    "totalAmount": 2299.97,
    "subtotal": 2299.97,
    "taxAmount": 183.99,
    "shippingAmount": 0,
    "discountAmount": 0,
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "iPhone 15 Pro",
        "quantity": 2,
        "unitPrice": 999.99,
        "totalPrice": 1999.98
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get User Orders
```http
GET /api/orders?page=1&limit=10&status=delivered
Authorization: Bearer <jwt-token>
```

### Get Order Details
```http
GET /api/orders/1
Authorization: Bearer <jwt-token>
```

### Cancel Order
```http
POST /api/orders/1/cancel
Authorization: Bearer <jwt-token>
```

### Update Order Status (Admin)
```http
PUT /api/orders/1
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "status": "shipped",
  "notes": "Shipped via FedEx, tracking: 1234567890"
}
```

## 💳 Payment Service (Port 3004)

### Create Payment Intent
```http
POST /api/payments/create-intent
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "orderId": 1,
  "amount": 2299.97,
  "currency": "USD",
  "paymentMethod": "card"
}
```

**Response:**
```json
{
  "message": "Payment intent created successfully",
  "payment": {
    "id": 1,
    "clientSecret": "pi_1234567890_secret_abcdef",
    "amount": 2299.97,
    "currency": "USD",
    "status": "pending"
  }
}
```

### Confirm Payment
```http
POST /api/payments/confirm
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890",
  "orderId": 1
}
```

### Get User Payments
```http
GET /api/payments?page=1&limit=10&status=succeeded
Authorization: Bearer <jwt-token>
```

### Get Payment Details
```http
GET /api/payments/1
Authorization: Bearer <jwt-token>
```

### Process Refund
```http
POST /api/payments/1/refund
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "amount": 999.99,
  "reason": "Customer requested refund"
}
```

**Response:**
```json
{
  "message": "Refund processed successfully",
  "refund": {
    "id": "re_1234567890",
    "amount": 999.99,
    "status": "succeeded",
    "reason": "Customer requested refund"
  },
  "payment": {
    "id": 1,
    "status": "partially_refunded",
    "refundedAmount": 999.99
  }
}
```

## 🔗 Webhook Endpoints

### Stripe Webhooks
```http
POST /api/webhooks/stripe
Content-Type: application/json
Stripe-Signature: t=1234567890,v1=signature

{
  "id": "evt_1234567890",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "amount": 229997,
      "currency": "usd",
      "status": "succeeded"
    }
  }
}
```

## 📊 Admin APIs

### Get All Orders (Admin)
```http
GET /api/orders/admin/all?page=1&limit=20&status=pending&userId=123
Authorization: Bearer <admin-jwt-token>
```

### Get All Payments (Admin)
```http
GET /api/payments/admin/all?page=1&limit=20&status=succeeded
Authorization: Bearer <admin-jwt-token>
```

### Get All Users (Admin)
```http
GET /api/users/admin/all?page=1&limit=20&role=customer
Authorization: Bearer <admin-jwt-token>
```

### Update User Status (Admin)
```http
PUT /api/users/admin/1/status
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "status": "suspended",
  "reason": "Policy violation"
}
```

## 🚨 Error Responses

### Standard Error Format
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🔄 Rate Limiting

### Rate Limits by Endpoint Type
- **Authentication**: 5 requests per minute
- **General API**: 100 requests per minute
- **Admin API**: 200 requests per minute
- **Webhooks**: No limit (verified signatures)

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 📝 Request/Response Examples

### Pagination
All list endpoints support pagination:
```http
GET /api/products?page=2&limit=20
```

### Filtering
```http
GET /api/orders?status=delivered&startDate=2024-01-01&endDate=2024-01-31
```

### Sorting
```http
GET /api/products?sortBy=price&sortOrder=desc
```

### Search
```http
GET /api/products?search=macbook&category=electronics
```

## 🔧 SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

// Create order
const order = await api.post('/orders', {
  items: [{ productId: 1, quantity: 2, unitPrice: 999.99 }],
  shippingAddress: { /* address details */ },
  billingAddress: { /* address details */ },
  paymentMethod: 'card'
});
```

### Python
```python
import requests

headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

# Get products
response = requests.get(
    'http://localhost:8080/api/products',
    headers=headers,
    params={'page': 1, 'limit': 10}
)
products = response.json()
```

### cURL
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get orders
curl -X GET http://localhost:8080/api/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🧪 Testing

### Swagger UI
Access interactive API documentation:
- User Service: http://localhost:3001/api-docs
- Product Service: http://localhost:3002/api-docs
- Order Service: http://localhost:3003/api-docs
- Payment Service: http://localhost:3004/api-docs

### Postman Collection
Import the Postman collection from `/docs/postman/` for comprehensive API testing.

### Test Data
Use the provided test data in `/docs/test-data/` for development and testing.

---

## 📞 API Support

For API support and questions:
- Check Swagger documentation for detailed schemas
- Review error responses for troubleshooting
- Use health check endpoints for service status
- Monitor API metrics in Grafana dashboards

**API Version: v1.0.0**
**Last Updated: 2024-01-15**
