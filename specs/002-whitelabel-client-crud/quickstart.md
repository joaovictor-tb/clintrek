# Quickstart: Whitelabel Organization & Client CRUD

**Feature**: 002-whitelabel-client-crud
**Date**: 2026-03-02

## Integration Scenarios

### 1. Admin configures organization branding

```
1. Admin logs in → /dashboard
2. Navigates to /settings/organization
3. Uploads logo (PNG/JPG/SVG, max 2MB)
4. Picks primary color via color picker
5. Picks accent color via color picker
6. Clicks "Salvar"
7. Server Action: updateOrganizationBranding(formData)
   - Validates file (type, size) with Zod
   - Writes file to data/uploads/organizations/{orgId}/
   - Updates Organization record (logo path, primaryColor, accentColor)
   - Revalidates dashboard path
8. Dashboard reloads with new branding (CSS variables updated)
```

### 2. Admin creates a client

```
1. Admin on /dashboard → clicks "Clientes" in navigation
2. Navigates to /clients (Server Component)
3. Prisma query: findMany clients WHERE organizationId = activeOrg AND deletedAt IS NULL
4. Clicks "Novo cliente"
5. Navigates to /clients/new
6. Fills form: nome (required), email (required), telefone, observações
7. Clicks "Criar"
8. Server Action: createClient(formData)
   - Validates with Zod (clientSchema)
   - Checks email uniqueness in org
   - Creates Client record
   - Revalidates /clients
9. Redirects to /clients with new client in list
```

### 3. Admin invites a client to the portal

```
1. Admin on /clients → clicks on a client
2. Navigates to /clients/{id} (Server Component with client details)
3. Clicks "Convidar para o portal"
4. Server Action: inviteClient(clientId)
   - Generates magic link token (crypto.randomUUID)
   - Creates ClientInvitation (expires in 15 min)
   - Sends branded email via SendGrid:
     - Logo, org name, colors in email template
     - Magic link: {BASE_URL}/portal/{org-slug}/verify?token={token}
   - Updates client invitationStatus to "pending"
5. Admin sees "Convite enviado" feedback
6. Client details page shows invitation status badge
```

### 4. Client accesses portal via magic link (first time)

```
1. Client receives branded email from org
2. Clicks magic link → GET /api/portal/verify?token={token}
3. API route:
   - Looks up ClientInvitation by token
   - Validates: not expired, status is "pending"
   - Finds Client and Organization
   - Marks invitation as "accepted"
   - Creates ClientSession (7-day expiry)
   - Sets httpOnly cookie: clintrek-client-session={sessionToken}
   - Redirects to /portal/{org-slug}
4. Portal page (Server Component):
   - Middleware checks clintrek-client-session cookie
   - Looks up ClientSession → gets Client and Organization
   - Renders portal with org branding (CSS variables)
   - Shows client name, email, welcome message
```

### 5. Client re-authenticates (self-service)

```
1. Client's session expired (after 7 days)
2. Accesses /portal/{org-slug} → middleware redirects to /portal/{org-slug}/login
3. Login page:
   - Shows org branding (logo, colors) — loaded from Organization by slug
   - Email input form
4. Client enters email → submits
5. POST /api/portal/magic-link { email, orgSlug }
   - Looks up active Client by email + org
   - If found: creates ClientInvitation, sends magic link email
   - Returns generic success (no email enumeration)
6. Client receives email, clicks link → same flow as scenario 4
```

### 6. Admin soft-deletes a client

```
1. Admin on /clients/{id} → clicks "Remover"
2. Confirmation dialog appears (AlertDialog)
3. Admin confirms
4. Server Action: deleteClient(clientId)
   - Sets deletedAt = now() on Client
   - Deletes all ClientSession records for this client
   - Revalidates /clients
5. Client disappears from list
6. If client tries to access portal → session cookie invalid → redirects to login
7. If client requests new magic link → no active client found → generic "email sent" message
```

### 7. Branding flow (CSS variables)

```
Layout loads Organization branding:

1. Server Component reads org branding from DB
2. If org has custom colors:
   - Sets inline style on wrapper div:
     style={{ '--org-primary': '#3B82F6', '--org-accent': '#F59E0B' }}
3. If org has NO custom colors:
   - No inline style (falls back to ClinTrek CSS defaults)
4. Components use: className="bg-[var(--org-primary,var(--primary))]"
   - First tries --org-primary
   - Falls back to --primary (ClinTrek default)
```

## Key File Relationships

```
Middleware (src/middleware.ts)
├── /dashboard, /clients, /settings → checks Better Auth session cookie
└── /portal/[slug]/* (except /login) → checks clintrek-client-session cookie

Server Actions (src/actions/)
├── organization.ts → updateOrganizationBranding
├── clients.ts → createClient, updateClient, deleteClient, inviteClient
└── (admin auth check in each action)

API Routes (src/app/api/)
├── portal/magic-link/route.ts → POST (client self-service login)
├── portal/verify/route.ts → GET (magic link verification)
├── portal/logout/route.ts → POST (client logout)
└── uploads/[...path]/route.ts → GET (serve uploaded files)
```
