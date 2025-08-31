# Contact Messages API

This document describes the Contact Messages API endpoints for both store and admin usage.

## Store API

### POST /store/contact

Creates a new contact message from customers.

**Request Body:**
```json
{
  "name": "John Doe",                    // Optional
  "email": "john@example.com",           // Required
  "phone": "+90 555 123 4567",          // Optional
  "subject": "Product Inquiry",          // Optional
  "message": "I have a question...",     // Required
  "order_id": "order_123"               // Optional
}
```

**Response (201):**
```json
{
  "message": "Contact message created successfully",
  "item": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+90 555 123 4567",
    "subject": "Product Inquiry",
    "message": "I have a question...",
    "order_id": "order_123",
    "status": "new",
    "created_at": "2025-08-31T12:00:00Z",
    "updated_at": "2025-08-31T12:00:00Z"
  }
}
```

**Validation:**
- `email`: Required, must be valid email format
- `message`: Required
- All other fields are optional

### GET /store/contact

Returns information about the contact form configuration.

**Response (200):**
```json
{
  "message": "Contact endpoint is available",
  "fields": {
    "required": ["email", "message"],
    "optional": ["name", "phone", "subject", "order_id"]
  }
}
```

## Admin API

### GET /admin/contact

Lists all contact messages with optional filtering.

**Query Parameters:**
- `status`: Filter by status (`new`, `read`, `archived`)
- `limit`: Number of items to return (default: 50)
- `offset`: Number of items to skip (default: 0)

**Response (200):**
```json
{
  "count": 2,
  "items": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+90 555 123 4567",
      "subject": "Product Inquiry",
      "message": "I have a question...",
      "order_id": "order_123",
      "status": "new",
      "created_at": "2025-08-31T12:00:00Z",
      "updated_at": "2025-08-31T12:00:00Z"
    }
  ]
}
```

### GET /admin/contact/:id

Gets a specific contact message by ID.

**Response (200):**
```json
{
  "item": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+90 555 123 4567",
    "subject": "Product Inquiry",
    "message": "I have a question...",
    "order_id": "order_123",
    "status": "new",
    "created_at": "2025-08-31T12:00:00Z",
    "updated_at": "2025-08-31T12:00:00Z"
  }
}
```

### PUT /admin/contact/:id

Updates a contact message (typically used to change status).

**Request Body:**
```json
{
  "status": "read"
}
```

**Response (200):**
```json
{
  "item": {
    "id": "uuid",
    "status": "read",
    "updated_at": "2025-08-31T12:30:00Z",
    // ... other fields
  }
}
```

### DELETE /admin/contact/:id

Deletes a contact message.

**Response (200):**
```json
{
  "message": "Contact message deleted successfully"
}
```

## Admin UI

The admin interface for contact messages is available at `/admin/contact` and provides:

1. **List View**: Shows all contact messages with filtering by status
2. **Status Management**: Update message status (new, read, archived)
3. **Message Details**: Expand/collapse message content
4. **Delete Functionality**: Remove messages with confirmation
5. **Responsive Design**: Works on various screen sizes

### Features:

- **Status Badges**: Visual indicators for message status
- **Filtering**: Filter messages by status (all, new, read, archived)
- **Expandable Messages**: Click to show/hide full message content
- **Quick Actions**: Change status and delete messages inline
- **Turkish Localization**: Interface in Turkish language

## Database Schema

The contact messages are stored in the `contact_message` table with the following structure:

```sql
CREATE TABLE contact_message (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR NULL,
  subject VARCHAR NULL,
  message TEXT NOT NULL,
  order_id VARCHAR NULL,
  status VARCHAR DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "details": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error
