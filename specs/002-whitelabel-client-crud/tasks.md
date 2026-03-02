# Tasks: Whitelabel Organization & Client CRUD

**Input**: Design documents from `/specs/002-whitelabel-client-crud/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/client-api.md, quickstart.md

**Tests**: No automated tests (per constitution — manual testing only).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create directory structure

- [x] T001 Install new shadcn/ui components: `npx shadcn@latest add table dialog alert-dialog badge skeleton sonner`
- [x] T002 Create directory structure: `src/actions/`, `src/components/features/clients/`, `src/components/features/portal/`, `src/app/(protected)/clients/`, `src/app/(protected)/clients/new/`, `src/app/(protected)/clients/[id]/`, `src/app/(protected)/clients/[id]/edit/`, `src/app/(protected)/settings/organization/`, `src/app/portal/[orgSlug]/`, `src/app/portal/[orgSlug]/login/`, `src/app/portal/[orgSlug]/verify/`, `src/app/api/portal/magic-link/`, `src/app/api/portal/logout/`, `src/app/api/uploads/[...path]/`
- [x] T003 Create `data/uploads/organizations/` directory and add `data/` to `.gitignore`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, validation schemas, and shared infrastructure that MUST be complete before ANY user story

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Update `prisma/schema.prisma`: add `primaryColor` and `accentColor` fields to Organization model, add Client, ClientInvitation, and ClientSession models per data-model.md. Add relation fields on Organization (`clients`, `clientInvitations`, `clientSessions`)
- [x] T005 Run Prisma migration: `npx prisma migrate dev --name add-whitelabel-client-models` and `npx prisma generate`
- [x] T006 [P] Create Zod validation schemas in `src/lib/validations/organization.ts`: hex color regex `/^#[0-9a-fA-F]{6}$/`, logo file validation (max 2MB, PNG/JPG/SVG), brandingSchema
- [x] T007 [P] Create Zod validation schemas in `src/lib/validations/client.ts`: clientSchema (name min 1 max 255, email, phone max 20, notes max 5000), portalLoginSchema (email, orgSlug)
- [x] T008 [P] Update `src/app/globals.css`: add CSS custom property fallbacks `--org-primary` and `--org-accent` that default to existing `--primary` and `--accent` values
- [x] T009 [P] Create branding provider component in `src/components/features/organization/branding-provider.tsx`: Server Component that accepts org colors and sets `--org-primary`/`--org-accent` CSS variables as inline style on a wrapper div. Falls back to no inline style when no custom branding

**Checkpoint**: Foundation ready — database models exist, validation schemas defined, branding infrastructure in place

---

## Phase 3: User Story 1 — Personalização da Organização (Priority: P1) MVP

**Goal**: Admin can upload logo and set primary/accent colors for their organization via a settings page

**Independent Test**: Navigate to /settings/organization, upload a logo, set colors, save. Verify the settings are persisted after page reload.

### Implementation for User Story 1

- [x] T010 [US1] Create file-serving API route in `src/app/api/uploads/[...path]/route.ts`: GET handler that reads files from `data/uploads/` directory, sets Content-Type based on extension (image/png, image/jpeg, image/svg+xml), returns 404 if not found, sets Cache-Control header
- [x] T011 [US1] Create `updateOrganizationBranding` Server Action in `src/actions/organization.ts`: validates auth + active org, accepts FormData (logo file, primaryColor, accentColor), validates with Zod, writes logo to `data/uploads/organizations/{orgId}/logo-{uuid}.{ext}`, deletes old logo if replacing, updates Organization record, calls revalidatePath for `/dashboard` and `/settings/organization`
- [x] T012 [US1] Create org-settings-form component in `src/components/features/organization/org-settings-form.tsx`: Client Component with React Hook Form, file input for logo (with preview), native `<input type="color">` for primaryColor and accentColor with text input fallback for hex, shows current branding values, submits via updateOrganizationBranding Server Action, displays success/error feedback with Sonner toast
- [x] T013 [US1] Create settings page in `src/app/(protected)/settings/organization/page.tsx`: Server Component wrapped in Suspense, loads current org branding from DB, renders OrgSettingsForm with current values, page title "Configurações da Organização"

**Checkpoint**: Admin can configure org branding. Settings persist in DB and logo is stored on filesystem.

---

## Phase 4: User Story 2 — Dashboard com Branding da Organização (Priority: P1)

**Goal**: Dashboard and protected area UI reflects the organization's branding (logo, colors)

**Independent Test**: Configure org branding (US1), then navigate to /dashboard. Verify logo appears in header and colors are applied. Change colors, reload, verify immediate update.

**Depends on**: US1 (branding data must exist to be displayed)

### Implementation for User Story 2

- [x] T014 [US2] Update protected layout in `src/app/(protected)/layout.tsx`: load org branding (logo, primaryColor, accentColor) from DB using activeOrganizationId, wrap children with BrandingProvider component passing org colors, add org logo to header (or ClinTrek text fallback), add navigation links ("Dashboard", "Clientes", "Configurações")
- [x] T015 [US2] Update dashboard page in `src/app/(protected)/dashboard/page.tsx`: use branded CSS variables for visual elements (buttons, links, accents), show org name prominently, ensure Suspense wrapping for dynamic content

**Checkpoint**: Dashboard reflects org branding. Navigation links to Clients and Settings visible.

---

## Phase 5: User Story 3 — Cadastro de Clientes / CRUD (Priority: P1)

**Goal**: Admin can list, create, view details, edit, and soft-delete clients. List supports search and pagination.

**Independent Test**: Navigate to /clients (empty), create a client with name+email, verify it appears. Click on client, verify details page. Edit client, verify changes. Delete client, verify removal from list. Search by name/email.

### Implementation for User Story 3

- [x] T016 [P] [US3] Create client CRUD Server Actions in `src/actions/clients.ts`: `createClient(formData)` — validates auth, checks email uniqueness (active clients only, excluding soft-deleted), creates Client record, revalidates /clients; `updateClient(clientId, formData)` — validates ownership, updates record; `deleteClient(clientId)` — soft delete (sets deletedAt), deletes all ClientSession records for this client, revalidates /clients
- [x] T017 [P] [US3] Create client-table component in `src/components/features/clients/client-table.tsx`: Server Component using shadcn Table, displays name, email, phone, invitation status (Badge), createdAt. Each row links to client details page `/clients/{id}`
- [x] T018 [P] [US3] Create client-form component in `src/components/features/clients/client-form.tsx`: Client Component with React Hook Form + Zod clientSchema, fields: name (required), email (required), phone (optional), notes (optional textarea). Reusable for create and edit mode (accepts optional defaultValues prop). Submits via createClient or updateClient Server Action
- [x] T019 [P] [US3] Create client-search component in `src/components/features/clients/client-search.tsx`: Client Component with debounced search input, updates URL search params `?search=term` via router.push to trigger server re-render
- [x] T020 [P] [US3] Create pagination component in `src/components/features/clients/pagination.tsx`: Server Component with page links (not buttons) using `?page=N` URL params, shows current page and total pages, 20 items per page
- [x] T021 [P] [US3] Create delete-client-dialog component in `src/components/features/clients/delete-client-dialog.tsx`: Client Component using shadcn AlertDialog, confirms deletion, calls deleteClient Server Action, shows loading state
- [x] T022 [US3] Create clients list page in `src/app/(protected)/clients/page.tsx`: Server Component wrapped in Suspense, reads searchParams (page, search), queries Prisma for clients (WHERE organizationId, deletedAt IS NULL, name/email contains search, skip/take pagination, orderBy createdAt desc), renders ClientSearch + ClientTable + Pagination, shows empty state with "Novo cliente" button, counts total for pagination
- [x] T023 [US3] Create new client page in `src/app/(protected)/clients/new/page.tsx`: Server Component with ClientForm in create mode, page title "Novo Cliente", redirects to /clients on success
- [x] T024 [US3] Create client details page in `src/app/(protected)/clients/[id]/page.tsx`: Server Component wrapped in Suspense, loads client by id (verify org ownership), shows all client data (name, email, phone, notes, invitation status as Badge, createdAt), "Editar" link to edit page, DeleteClientDialog button, redirect to /clients if not found
- [x] T025 [US3] Create edit client page in `src/app/(protected)/clients/[id]/edit/page.tsx`: Server Component, loads client by id (verify org ownership), renders ClientForm in edit mode with current values as defaultValues, redirects to /clients/[id] on success

**Checkpoint**: Full client CRUD working — list with search/pagination, create, view, edit, soft-delete.

---

## Phase 6: User Story 4 — Convite de Cliente via Magic Link (Priority: P2)

**Goal**: Admin can invite a client to the portal. Client receives branded email with magic link. Client can self-authenticate via portal login.

**Independent Test**: From client details, click "Convidar". Check email received with org branding. Click magic link, verify redirect to portal. Try expired link, verify error message. Try self-service login at /portal/{slug}/login.

**Depends on**: US3 (clients must exist), US1 (branding for emails)

### Implementation for User Story 4

- [x] T026 [US4] Create client auth utilities in `src/lib/client-auth.ts`: `generateToken()` using crypto.randomUUID, `createClientSession(clientId, orgId)` creates ClientSession record + returns token, `getClientSession(token)` looks up session (validates not expired, client not deleted), `deleteClientSession(token)`, cookie helpers (set/get/clear `clintrek-client-session` cookie with httpOnly, secure, sameSite lax, path /portal, maxAge 7 days)
- [x] T027 [US4] Create `inviteClient` Server Action in `src/actions/clients.ts`: validates auth + client ownership, checks client not soft-deleted, invalidates existing pending invitations, creates ClientInvitation with 15-min expiry token, sends branded email via SendGrid (HTML template with org logo, colors, name, magic link URL `{BASE_URL}/portal/{org-slug}/verify?token={token}`), updates client invitationStatus to "pending", revalidates client details page
- [x] T028 [P] [US4] Create invite-button component in `src/components/features/clients/invite-button.tsx`: Client Component button "Convidar para o portal", calls inviteClient Server Action, shows loading state, success toast "Convite enviado", error handling
- [x] T029 [US4] Update client details page `src/app/(protected)/clients/[id]/page.tsx`: add InviteButton component, show invitation status with Badge (none/pending/accepted), show last invitation date if exists
- [x] T030 [US4] Create portal magic-link API route in `src/app/api/portal/magic-link/route.ts`: POST handler, validates body with Zod (email, orgSlug), looks up org by slug, looks up active client by email + orgId, if found creates ClientInvitation + sends branded email, always returns `{ success: true }` (no email enumeration), rate limiting: check recent invitations count
- [x] T031 [US4] Create portal verify route in `src/app/portal/[orgSlug]/verify/route.ts`: GET handler, reads token from searchParams, looks up ClientInvitation by token, validates not expired and status pending, finds Client + Organization, marks invitation accepted, creates ClientSession via client-auth utility, sets cookie, redirects to `/portal/{orgSlug}`. On error: redirects to `/portal/{orgSlug}/login?error=expired|invalid|unavailable`
- [x] T032 [US4] Update middleware in `src/middleware.ts`: add matcher for `/portal/:orgSlug` routes (excluding `/portal/:orgSlug/login` and `/portal/:orgSlug/verify`), check `clintrek-client-session` cookie exists, if missing redirect to `/portal/{orgSlug}/login`

**Checkpoint**: Full invitation flow working — admin invites, client receives email, magic link authenticates, self-service re-authentication available.

---

## Phase 7: User Story 5 — Portal do Cliente com Branding (Priority: P2)

**Goal**: Authenticated client sees a branded portal with org identity (logo, colors), their basic info, and can logout.

**Independent Test**: Access portal via magic link, verify org branding (logo, colors), verify client name/email displayed, verify logout works and redirects to login page. Try accessing portal without auth, verify redirect to login.

**Depends on**: US4 (client auth must work), US1 (branding data)

### Implementation for User Story 5

- [x] T033 [P] [US5] Create portal-header component in `src/components/features/portal/portal-header.tsx`: Server Component, displays org logo (or org name fallback), applies branded colors, includes logout button (form POST to /api/portal/logout)
- [x] T034 [P] [US5] Create portal-login-form component in `src/components/features/portal/portal-login-form.tsx`: Client Component with React Hook Form + Zod portalLoginSchema, email input, submits to `/api/portal/magic-link` API route with orgSlug, shows success message "Verifique seu email", shows error states (expired link, unavailable)
- [x] T035 [US5] Create portal layout in `src/app/portal/[orgSlug]/layout.tsx`: Server Component, loads org by slug from DB (logo, colors, name), wraps children with BrandingProvider using org colors, renders PortalHeader, returns 404 if org not found
- [x] T036 [US5] Create portal login page in `src/app/portal/[orgSlug]/login/page.tsx`: Server Component wrapped in Suspense, loads org branding by slug, renders PortalLoginForm with orgSlug prop, shows error messages from searchParams (?error=expired|invalid|unavailable), applies org branding
- [x] T037 [US5] Create portal home page in `src/app/portal/[orgSlug]/page.tsx`: Server Component wrapped in Suspense, reads client session from cookie via client-auth utility, loads client data from DB, displays welcome message with client name, shows client basic info (name, email), applies org branding
- [x] T038 [US5] Create portal logout API route in `src/app/api/portal/logout/route.ts`: POST handler, reads clintrek-client-session cookie, deletes ClientSession from DB, clears cookie, extracts orgSlug from referer or request body, redirects to `/portal/{orgSlug}/login`

**Checkpoint**: Complete portal experience — login, branded portal, client info, logout.

---

## Phase 8: User Story 6 — Atualização do Onboarding (Priority: P3)

**Goal**: Organization creation form (onboarding) includes optional branding fields (logo, colors).

**Independent Test**: Create a new user, go through onboarding, verify logo and color fields are present and optional. Create org with branding, verify dashboard immediately shows branding. Create org without branding, verify defaults work.

**Depends on**: US1 (branding field components can be reused), US2 (dashboard must show branding)

### Implementation for User Story 6

- [x] T039 [US6] Update create-org-form component in `src/components/features/organization/create-org-form.tsx`: add optional file input for logo, add optional color pickers for primaryColor and accentColor (reuse same pattern from org-settings-form), update form submission to include branding data via Server Action or authClient.organization.create with metadata, handle logo upload if provided
- [x] T040 [US6] Create `createOrganizationWithBranding` Server Action in `src/actions/organization.ts` (or update existing flow): after org creation via Better Auth, update org record with branding fields (logo, primaryColor, accentColor) if provided, handle logo file upload

**Checkpoint**: Onboarding supports optional branding — both with and without branding paths work.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility review, final verification

- [x] T041 WCAG 2.1 AA accessibility review: verify all new forms have labels, all interactive elements are keyboard-accessible, color contrast meets 4.5:1 ratio for text, aria attributes on dynamic content (toasts, dialogs, badges), focus management on page transitions
- [x] T042 Build verification: run `npm run build` and verify zero errors, check all pages render correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational. No story dependencies.
- **US2 (Phase 4)**: Depends on US1 (branding data must exist to display)
- **US3 (Phase 5)**: Depends on Foundational. No story dependencies. **Can run in parallel with US1/US2**
- **US4 (Phase 6)**: Depends on US3 (clients must exist to invite) and US1 (branding for emails)
- **US5 (Phase 7)**: Depends on US4 (auth flow must work)
- **US6 (Phase 8)**: Depends on US1 (branding components to reuse)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Setup → Foundational ─┬─→ US1 ──→ US2
                       │          ↓
                       └─→ US3 ──→ US4 ──→ US5
                                   ↑
                              US1 ─┘
                              US1 ──→ US6
```

### Within Each User Story

- Server Actions before UI components (actions provide the interface)
- Shared components before pages (components are composed into pages)
- List page before detail pages (navigation flow)
- Core flow before edge cases

### Parallel Opportunities

- **Phase 2**: T006, T007, T008, T009 can all run in parallel (different files)
- **Phase 3**: T010 and T011 can be parallel (different files), then T012 depends on T011, T013 depends on T012
- **Phase 5**: T016–T021 can all run in parallel (different files), then T022–T025 depend on components
- **Phase 6**: T028 can run in parallel with other tasks (different file)
- **Phase 7**: T033 and T034 can run in parallel (different files)
- **US1 and US3** can be developed in parallel by different developers (no cross-dependencies until US4)

---

## Parallel Example: User Story 3

```bash
# Launch all components in parallel (different files, no dependencies):
Task: "Create client CRUD Server Actions in src/actions/clients.ts"
Task: "Create client-table component in src/components/features/clients/client-table.tsx"
Task: "Create client-form component in src/components/features/clients/client-form.tsx"
Task: "Create client-search component in src/components/features/clients/client-search.tsx"
Task: "Create pagination component in src/components/features/clients/pagination.tsx"
Task: "Create delete-client-dialog component in src/components/features/clients/delete-client-dialog.tsx"

# Then compose into pages (depend on components above):
Task: "Create clients list page in src/app/(protected)/clients/page.tsx"
Task: "Create new client page in src/app/(protected)/clients/new/page.tsx"
Task: "Create client details page in src/app/(protected)/clients/[id]/page.tsx"
Task: "Create edit client page in src/app/(protected)/clients/[id]/edit/page.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 — Org Branding Config
4. Complete Phase 4: US2 — Dashboard Branding
5. Complete Phase 5: US3 — Client CRUD
6. **STOP and VALIDATE**: Admin can brand org and manage clients

### Full Delivery

7. Complete Phase 6: US4 — Client Invitation
8. Complete Phase 7: US5 — Client Portal
9. Complete Phase 8: US6 — Onboarding Update
10. Complete Phase 9: Polish
11. **FINAL VALIDATION**: All flows from quickstart.md working

### Incremental Delivery

- After US1+US2: Admin has branded dashboard (demo-ready)
- After US3: Admin can manage clients (core value)
- After US4+US5: Clients can access portal (full feature)
- After US6: Onboarding is complete experience

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Constitution: no automated tests, Server Components by default, Zod validation, Server Actions for mutations
- All forms use React Hook Form + Zod resolver
- All pages wrapped in Suspense for dynamic content
- Cache invalidation via revalidatePath after mutations
- Cookie isolation: admin uses `better-auth.session_token`, clients use `clintrek-client-session`
