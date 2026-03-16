# Leads

Leads represent potential customers or contacts in the MUTX platform.

## Endpoints

### List Leads

Retrieve all leads.

```http
GET /leads
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter (new, contacted, qualified, converted, lost) |
| `source` | string | Lead source |
| `limit` | int | Maximum results |
| `offset` | int | Pagination offset |

**Response:**

```json
{
  "data": [
    {
      "lead_id": "lead_abc123",
      "email": "john@company.com",
      "name": "John Smith",
      "company": "Acme Corp",
      "status": "new",
      "source": "website",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 42
}
```

---

### Create Lead

Create a new lead.

```http
POST /leads
```

**Request Body:**

```json
{
  "email": "john@company.com",
  "name": "John Smith",
  "company": "Acme Corp",
  "phone": "+1-555-0123",
  "source": "website",
  "metadata": {
    "interest": "enterprise_plan",
    "budget": "$5k-10k/month"
  }
}
```

**Response:**

```json
{
  "lead_id": "lead_xyz789",
  "email": "john@company.com",
  "name": "John Smith",
  "company": "Acme Corp",
  "status": "new",
  "source": "website",
  "created_at": "2024-01-20T10:30:00Z"
}
```

---

### Get Lead Details

Retrieve detailed information about a lead.

```http
GET /leads/{lead_id}
```

**Response:**

```json
{
  "lead_id": "lead_abc123",
  "email": "john@company.com",
  "name": "John Smith",
  "company": "Acme Corp",
  "phone": "+1-555-0123",
  "status": "qualified",
  "source": "website",
  "metadata": {
    "interest": "enterprise_plan",
    "budget": "$5k-10k/month"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

---

### Update Lead

Update lead information.

```http
PUT /leads/{lead_id}
```

**Request Body:**

```json
{
  "status": "contacted",
  "metadata": {
    "notes": "Had a great call, interested in demo",
    "next_follow_up": "2024-01-25T10:00:00Z"
  }
}
```

**Response:**

```json
{
  "lead_id": "lead_abc123",
  "status": "contacted",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

---

### Delete Lead

Remove a lead.

```http
DELETE /leads/{lead_id}
```

**Response:**

```json
{
  "message": "Lead deleted successfully"
}
```

## Lead Statuses

| Status | Description |
|--------|-------------|
| `new` | Newly created lead |
| `contacted` | Initial contact made |
| `qualified` | Lead meets qualification criteria |
| `converted` | Lead became a customer |
| `lost` | Lead not pursuing |

## Lead Sources

| Source | Description |
|--------|-------------|
| `website` | Website form submission |
| `api` | API-created lead |
| `import` | Bulk import |
| `referral` | Referred by existing customer |
| `event` | Conference or event |
| `other` | Other source |

## Webhooks for Leads

Configure webhooks to receive lead notifications:

```json
{
  "event": "lead.created",
  "data": {
    "lead_id": "lead_abc123",
    "email": "john@company.com",
    "name": "John Smith"
  }
}
```

Available events:
- `lead.created`
- `lead.updated`
- `lead.converted`
- `lead.lost`
