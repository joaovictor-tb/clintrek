# API Contracts: Client CRUD & Portal

**Feature**: 002-whitelabel-client-crud
**Date**: 2026-03-02

All mutations use Next.js Server Actions. Queries use Server Components with direct Prisma calls. Portal auth uses API routes.

## Server Actions (Admin — protected by session)

### Organization Branding

#### `updateOrganizationBranding(formData: FormData)`

Updates organization branding (logo, colors).

**Input** (FormData):
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| logo | File | No | PNG/JPG/SVG, max 2MB |
| primaryColor | string | No | 7-char hex: `/^#[0-9a-fA-F]{6}$/` |
| accentColor | string | No | 7-char hex: `/^#[0-9a-fA-F]{6}$/` |

**Returns**: `{ success: true }` or `{ error: string }`

**Authorization**: Authenticated admin with active organization (owner/admin role).

**Side effects**:
- Writes logo file to `data/uploads/organizations/{orgId}/`
- Deletes old logo file if replacing
- Updates Organization record in DB
- Revalidates `/dashboard` and `/settings/organization` paths

---

### Client CRUD

#### `createClient(formData: FormData)`

Creates a new client for the admin's active organization.

**Input**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | Yes | min 1 char, max 255 chars |
| email | string | Yes | valid email (Zod email) |
| phone | string | No | max 20 chars |
| notes | string | No | max 5000 chars |

**Returns**: `{ success: true, clientId: string }` or `{ error: string }`

**Authorization**: Authenticated admin with active organization.

**Error cases**:
- `EMAIL_DUPLICATE`: Email already exists in this organization (active clients only — soft-deleted don't count)
- `VALIDATION_ERROR`: Invalid input fields

---

#### `updateClient(clientId: string, formData: FormData)`

Updates an existing client's data.

**Input**: Same fields as createClient (all optional for update).

**Returns**: `{ success: true }` or `{ error: string }`

**Authorization**: Authenticated admin. Client must belong to admin's active organization.

**Error cases**:
- `NOT_FOUND`: Client not found or belongs to different org
- `EMAIL_DUPLICATE`: New email conflicts with existing client
- `VALIDATION_ERROR`: Invalid input fields

---

#### `deleteClient(clientId: string)`

Soft-deletes a client (sets `deletedAt`).

**Returns**: `{ success: true }` or `{ error: string }`

**Authorization**: Authenticated admin. Client must belong to admin's active organization.

**Side effects**:
- Sets `deletedAt = now()` on Client record
- Deletes all ClientSession records for this client (invalidates portal sessions)
- Revalidates client list page

---

#### `inviteClient(clientId: string)`

Sends magic link invitation email to a client.

**Returns**: `{ success: true }` or `{ error: string }`

**Authorization**: Authenticated admin. Client must belong to admin's active organization.

**Side effects**:
- Invalidates any existing pending invitations for this client
- Creates new ClientInvitation with 15-min expiry token
- Sends branded email via SendGrid with magic link URL: `{BASE_URL}/portal/{org-slug}/verify?token={token}`
- Updates client `invitationStatus` to "pending"

**Error cases**:
- `NOT_FOUND`: Client not found
- `CLIENT_DELETED`: Client has been soft-deleted
- `EMAIL_FAILED`: SendGrid delivery failed

---

## API Routes (Portal — public/client auth)

### `POST /api/portal/magic-link`

Client self-service: request a new magic link for portal access.

**Request body**:
```json
{
  "email": "client@example.com",
  "orgSlug": "minha-clinica"
}
```

**Response**: Always `{ success: true }` (generic message to prevent email enumeration)

**Behavior**:
- Looks up active (non-deleted) Client by email + org slug
- If found: creates ClientInvitation, sends magic link email
- If not found: returns success anyway (no information leak)
- Rate limited: max 3 requests per email per hour

---

### `GET /api/portal/verify?token={token}`

Verifies a magic link token and creates a client session.

**Query params**:
| Param | Type | Required |
|-------|------|----------|
| token | string | Yes |

**Success response**: Redirect to `/portal/{org-slug}` with `clintrek-client-session` cookie set.

**Error responses**:
- Token expired → Redirect to `/portal/{org-slug}/login?error=expired`
- Token invalid → Redirect to `/portal/{org-slug}/login?error=invalid`
- Client deleted → Redirect to `/portal/{org-slug}/login?error=unavailable`

**Side effects**:
- Marks ClientInvitation as "accepted" with `acceptedAt`
- Creates ClientSession with 7-day expiry
- Sets `clintrek-client-session` httpOnly cookie
- Updates client `invitationStatus` to "accepted" (if first time)

---

### `POST /api/portal/logout`

Logs out the client from the portal.

**Authorization**: Valid `clintrek-client-session` cookie.

**Response**: Redirect to `/portal/{org-slug}/login`

**Side effects**:
- Deletes ClientSession record
- Clears `clintrek-client-session` cookie

---

## API Route (File Serving)

### `GET /api/uploads/[...path]`

Serves uploaded files from the `data/uploads/` directory.

**Response**: File content with appropriate `Content-Type` header.

**Headers**:
- `Content-Type`: Based on file extension (image/png, image/jpeg, image/svg+xml)
- `Cache-Control`: `public, max-age=31536000, immutable` (files are content-addressed by unique name)

**Error**: 404 if file not found.

---

## Query Patterns (Server Components)

### Client List
```
GET /clients?page=1&search=term
```
- Prisma query: `findMany` with `where: { organizationId, deletedAt: null, OR: [name contains, email contains] }`, `skip`, `take: 20`, `orderBy: createdAt desc`
- Returns: clients[], totalCount (for pagination)

### Client Detail
```
GET /clients/[id]
```
- Prisma query: `findUnique` with `where: { id, organizationId }` (verify org ownership)
- Includes: latest invitation status

### Organization Branding (for portal)
```
GET /portal/[orgSlug]
```
- Prisma query: `findUnique` with `where: { slug }`, select: `{ name, slug, logo, primaryColor, accentColor }`
- Public data — no auth required for branding lookup (needed to show branding on login page)
