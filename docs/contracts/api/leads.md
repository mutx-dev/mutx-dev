---
description: Public lead capture and authenticated internal follow-up access.
icon: inbox
---

# Leads API

The leads routes capture contact and onboarding interest from the public surface, then expose authenticated read access for internal follow-up.

## Current Implementation Notes

* Routes are mounted at `/leads`.
* `POST /leads` is public so marketing or onboarding surfaces can capture interest without prior auth.
* `GET /leads` and `GET /leads/{lead_id}` require authenticated control-plane access.
* Leads are stored in the `leads` table with optional `name`, `company`, `message`, and `source` metadata.

## Routes

| Route                  | Purpose                    |
| ---------------------- | -------------------------- |
| `POST /leads`          | Capture a new contact lead |
| `GET /leads`           | List captured leads        |
| `GET /leads/{lead_id}` | Fetch one captured lead    |

## Capture A Lead

```bash
BASE_URL=http://localhost:8000

curl -X POST "$BASE_URL/leads" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "founder@example.com",
    "name": "Founder",
    "company": "Example Co",
    "message": "Interested in early access and migration help.",
    "source": "homepage"
  }'
```

Example response:

```json
{
  "id": "uuid",
  "email": "founder@example.com",
  "name": "Founder",
  "company": "Example Co",
  "message": "Interested in early access and migration help.",
  "source": "homepage",
  "created_at": "2026-03-12T00:00:00Z"
}
```

## List Leads

```bash
curl "$BASE_URL/leads?skip=0&limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Get One Lead

```bash
curl "$BASE_URL/leads/YOUR_LEAD_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
