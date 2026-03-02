# Data Model: Whitelabel Organization & Client CRUD

**Feature**: 002-whitelabel-client-crud
**Date**: 2026-03-02

## Entity Changes

### Organization (existing — extend)

The Organization model already exists from Better Auth. Add branding fields.

**New fields**:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| primaryColor | String? | null | Hex color code (e.g., "#3B82F6"). Null = use ClinTrek default |
| accentColor | String? | null | Hex color code (e.g., "#F59E0B"). Null = use ClinTrek default |

**Note**: `logo` field already exists as `String?` in the Organization model. It will store the relative file path to the uploaded logo image.

**Constraints**:
- `primaryColor` and `accentColor` must be valid 7-character hex strings (e.g., `#RRGGBB`) when provided
- `logo` stores relative path (e.g., `/uploads/organizations/{orgId}/logo.png`)

---

### Client (new)

Patient/client of a clinic organization. Isolated per organization.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | PK | Unique identifier |
| organizationId | String (FK) | Yes | References Organization.id |
| name | String | Yes | Client full name |
| email | String | Yes | Client email address |
| phone | String? | No | Phone number |
| notes | String? | No | Free-text observations (max 5000 chars) |
| invitationStatus | String | Yes | "none", "pending", "accepted" |
| deletedAt | DateTime? | No | Soft delete timestamp. Null = active |
| createdAt | DateTime | Yes | Auto-set on creation |
| updatedAt | DateTime | Yes | Auto-updated on modification |

**Constraints**:
- `@@unique([organizationId, email])` — email unique per organization (but same email can exist in different orgs)
- `@@index([organizationId])` — fast org-scoped queries
- `@@index([organizationId, deletedAt])` — fast filtered queries excluding soft-deleted
- All list queries MUST filter `WHERE deletedAt IS NULL`
- `name` min 1 character
- `email` valid email format

**Relations**:
- `organization` → Organization (many-to-one, cascade delete)
- `invitations` → ClientInvitation[] (one-to-many)
- `sessions` → ClientSession[] (one-to-many)

---

### ClientInvitation (new)

Magic link invitation/authentication token for client portal access.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | PK | Unique identifier |
| clientId | String (FK) | Yes | References Client.id |
| organizationId | String (FK) | Yes | References Organization.id (denormalized for query efficiency) |
| token | String | Yes | Unique magic link token (crypto.randomUUID) |
| status | String | Yes | "pending", "accepted", "expired" |
| expiresAt | DateTime | Yes | Token expiration (createdAt + 15 minutes) |
| acceptedAt | DateTime? | No | When the token was used |
| createdAt | DateTime | Yes | Auto-set on creation |

**Constraints**:
- `@@unique([token])` — fast token lookup during verification
- `@@index([clientId])` — find invitations for a client
- `@@index([organizationId])` — org-scoped queries
- Token expires after 15 minutes
- Only one active (pending, non-expired) invitation per client per org at a time. Creating a new invitation invalidates previous pending ones.

**Relations**:
- `client` → Client (many-to-one, cascade delete)
- `organization` → Organization (many-to-one, cascade delete)

**State transitions**:
```
pending → accepted (client clicks valid magic link)
pending → expired (15 minutes pass without use)
```

---

### ClientSession (new)

Active session for a client in the portal. Cookie-based.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | PK | Unique identifier |
| clientId | String (FK) | Yes | References Client.id |
| organizationId | String (FK) | Yes | References Organization.id |
| token | String | Yes | Session token stored as httpOnly cookie |
| expiresAt | DateTime | Yes | Session expiration (createdAt + 7 days) |
| createdAt | DateTime | Yes | Auto-set on creation |

**Constraints**:
- `@@unique([token])` — fast session lookup from cookie
- `@@index([clientId])` — find sessions for a client (needed for invalidation on delete)
- Session expires after 7 days
- Cookie name: `clintrek-client-session`
- Cookie flags: `httpOnly`, `secure` (in production), `sameSite: lax`, `path: /portal`

**Relations**:
- `client` → Client (many-to-one, cascade delete)
- `organization` → Organization (many-to-one, cascade delete)

**Invalidation rules**:
- Client soft-deleted → all sessions for that client are deleted from DB
- Client logout → specific session deleted
- Session expired → cleaned up on next access attempt

---

## Prisma Schema Additions

```prisma
model Organization {
  // ... existing fields ...
  primaryColor String?
  accentColor  String?
  clients      Client[]
  clientInvitations ClientInvitation[]
  clientSessions   ClientSession[]
}

model Client {
  id               String    @id @default(cuid())
  organizationId   String
  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name             String
  email            String
  phone            String?
  notes            String?
  invitationStatus String    @default("none")
  deletedAt        DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  invitations      ClientInvitation[]
  sessions         ClientSession[]

  @@unique([organizationId, email])
  @@index([organizationId])
  @@index([organizationId, deletedAt])
  @@map("client")
}

model ClientInvitation {
  id             String       @id @default(cuid())
  clientId       String
  client         Client       @relation(fields: [clientId], references: [id], onDelete: Cascade)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  token          String
  status         String       @default("pending")
  expiresAt      DateTime
  acceptedAt     DateTime?
  createdAt      DateTime     @default(now())

  @@unique([token])
  @@index([clientId])
  @@index([organizationId])
  @@map("client_invitation")
}

model ClientSession {
  id             String       @id @default(cuid())
  clientId       String
  client         Client       @relation(fields: [clientId], references: [id], onDelete: Cascade)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  token          String
  expiresAt      DateTime
  createdAt      DateTime     @default(now())

  @@unique([token])
  @@index([clientId])
  @@map("client_session")
}
```

## Default Branding Values

When Organization has no custom branding (`primaryColor` is null), the system uses ClinTrek defaults:

| Property | Default Value | Usage |
|----------|--------------|-------|
| primaryColor | Current `--primary` from globals.css | Header, buttons, links |
| accentColor | Current `--accent` from globals.css | Highlights, secondary actions |
| logo | ClinTrek text logo | Header logo area |
