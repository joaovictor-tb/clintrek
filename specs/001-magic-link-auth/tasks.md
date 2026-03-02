# Tasks: Magic Link Authentication with Organizations

**Input**: Design documents from `/specs/001-magic-link-auth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-api.md, quickstart.md

**Tests**: Sem testes automatizados (conforme constituição - Testing Strategy)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure project tooling

- [X] T001 Install Better Auth and SendGrid dependencies: `npm install better-auth @sendgrid/mail`
- [X] T002 Add required shadcn/ui components: `npx shadcn@latest add button input label card form separator`
- [X] T003 Add environment variables (BETTER_AUTH_SECRET, BETTER_AUTH_URL, SENDGRID_API_KEY, EMAIL_FROM) to `.env` with placeholder values and update `.env.example` if applicable
- [X] T004 Create directory structure: `src/components/features/auth/`, `src/components/features/landing/`, `src/components/features/organization/`, `src/app/(auth)/signin/`, `src/app/(auth)/signup/`, `src/app/(protected)/dashboard/`, `src/app/(protected)/onboarding/organization/`, `src/app/api/auth/[...all]/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Configure Better Auth server instance with Prisma adapter, magic link plugin (expiresIn: 900s), organization plugin, nextCookies plugin, and SendGrid email sending in `src/lib/auth.ts`. Use existing Prisma singleton from `src/lib/prisma.ts`. Session expiresIn: 604800 (7 days). Magic link sendMagicLink callback sends email via @sendgrid/mail.
- [X] T006 Configure Better Auth client with magicLinkClient and organizationClient plugins in `src/lib/auth-client.ts`. Export authClient, signIn, signOut, useSession.
- [X] T007 Create Better Auth catch-all API route handler in `src/app/api/auth/[...all]/route.ts`. Import auth from `@/lib/auth`, use `toNextJsHandler` from `better-auth/next-js`, export GET and POST.
- [X] T008 Generate Prisma schema for Better Auth models by running `npx @better-auth/cli generate`, then run `npx prisma migrate dev --name add-auth-models` and `npx prisma generate`. This creates User, Session, Account, Verification, Organization, Member, Invitation tables.
- [X] T009 Create middleware for route protection in `src/middleware.ts`. Use `getSessionCookie` from `better-auth/cookies` for optimistic cookie check. Redirect to `/signin` if no session cookie. Matcher: `["/dashboard/:path*", "/onboarding/:path*"]`.
- [X] T010 Create protected area layout in `src/app/(protected)/layout.tsx`. Server Component that calls `auth.api.getSession()` with `headers()` for real session validation. If no session, redirect to `/signin`. If session but no activeOrganizationId, check if user has organizations via Prisma query — if none, redirect to `/onboarding/organization`. Wrap children in `<Suspense>` per constitution principle VII.

**Checkpoint**: Auth infrastructure ready - all Better Auth endpoints functional, middleware protecting routes, session validation in protected layout.

---

## Phase 3: User Story 1 - Landing Page com CTAs (Priority: P1) MVP

**Goal**: Visitante vê landing page atrativa com CTAs de "Cadastrar" e "Entrar" que redirecionam para as respectivas páginas.

**Independent Test**: Acessar `/` sem autenticação e verificar que a página renderiza com título, descrição e botões funcionais. Clicar "Cadastrar" redireciona para `/signup`. Clicar "Entrar" redireciona para `/signin`. Acessar `/` autenticado redireciona para `/dashboard`.

### Implementation for User Story 1

- [X] T011 [P] [US1] Create hero section Server Component in `src/components/features/landing/hero-section.tsx`. Display app name "ClinTrek", a compelling tagline about the product, and a brief description. Include two shadcn/ui Button components: "Cadastrar" (primary, links to `/signup`) and "Entrar" (outline/secondary, links to `/signin`). Use Lucide icons where appropriate. Follow shadcn/ui new-york style and ensure WCAG 2.1 AA contrast.
- [X] T012 [US1] Update landing page in `src/app/page.tsx`. Server Component that checks session via `auth.api.getSession()` — if authenticated, redirect to `/dashboard`. Otherwise render the hero-section component. Wrap session check in Suspense boundary per constitution principle VII. Page should be visually appealing with proper spacing, responsive layout (mobile-first), and use Tailwind CSS 4 utility classes.

**Checkpoint**: Landing page functional with CTAs. Visitors see the page, authenticated users are redirected.

---

## Phase 4: User Story 2 - Cadastro via Magic Link (Priority: P1)

**Goal**: Novo usuário informa email no formulário de signup, recebe magic link por email, clica e é autenticado.

**Independent Test**: Acessar `/signup`, informar email válido, submeter formulário, verificar mensagem de confirmação. Verificar recebimento do email com magic link. Clicar no link e confirmar autenticação (redirect para área protegida).

### Implementation for User Story 2

- [X] T013 [US2] Create magic link form Client Component in `src/components/features/auth/magic-link-form.tsx`. "use client" component using React Hook Form + Zod for email validation (z.string().email()). On submit, call `authClient.signIn.magicLink({ email, callbackURL: "/dashboard", newUserCallbackURL: "/onboarding/organization" })`. Show loading state (FR-014) with disabled button and spinner during submission. On success, show confirmation message "Verifique seu email para o link de acesso". On error, show generic error message. Handle rate limit error (429) with specific message about waiting. Accepts `mode` prop ("signup" | "signin") to customize heading text. All form fields must have proper labels and aria attributes (WCAG 2.1 AA).
- [X] T014 [US2] Create signup page in `src/app/(auth)/signup/page.tsx`. Server Component that renders a shadcn/ui Card containing the magic-link-form component with mode="signup". Include heading "Criar conta", subtext explaining magic link flow, and link to `/signin` ("Já tem conta? Entrar"). Center the card on page with proper responsive layout.

**Checkpoint**: Signup flow complete. New users can register via magic link.

---

## Phase 5: User Story 3 - Login via Magic Link (Priority: P1)

**Goal**: Usuário existente informa email no formulário de signin, recebe magic link e é autenticado.

**Independent Test**: Acessar `/signin`, informar email de usuário existente, submeter, verificar mensagem de confirmação. Clicar no magic link recebido e confirmar redirect para dashboard.

### Implementation for User Story 3

- [X] T015 [US3] Create signin page in `src/app/(auth)/signin/page.tsx`. Server Component that renders a shadcn/ui Card containing the magic-link-form component (from T013) with mode="signin". Include heading "Entrar", subtext about magic link, and link to `/signup` ("Não tem conta? Cadastrar"). Same layout pattern as signup page. The form behavior is identical to signup (FR-006: don't reveal if email exists) — the only difference is the UI copy.

**Checkpoint**: Login flow complete. Existing users can sign in via magic link. Combined with US2, the full auth cycle works.

---

## Phase 6: User Story 4 - Criação de Organization (Priority: P2)

**Goal**: Após primeiro login, usuário sem organization é direcionado a criar uma via formulário simples (nome). Após criação, acessa dashboard.

**Independent Test**: Fazer login com usuário novo (sem org), verificar redirect para `/onboarding/organization`. Preencher nome da org e submeter. Confirmar redirect para `/dashboard`. Tentar acessar `/onboarding/organization` com org já existente deve redirecionar para `/dashboard`.

### Implementation for User Story 4

- [X] T016 [US4] Create organization form Client Component in `src/components/features/organization/create-org-form.tsx`. "use client" component using React Hook Form + Zod for validation (name: z.string().min(1, "Nome é obrigatório")). On submit, call `authClient.organization.create({ name, slug: auto-generated })` then `authClient.organization.setActive({ organizationId })`, then redirect to `/dashboard` via `useRouter().push()`. Show loading state during submission. Include proper labels and error messages. Use shadcn/ui Input, Button, Label, Form components.
- [X] T017 [US4] Create onboarding organization page in `src/app/(protected)/onboarding/organization/page.tsx`. Server Component that checks if user already has organizations (via `auth.api.getSession()` and check `activeOrganizationId` or list orgs). If user already has org, redirect to `/dashboard`. Otherwise render a shadcn/ui Card with heading "Criar sua organização", subtext explaining the step, and the create-org-form component.

**Checkpoint**: Organization creation flow complete. New users are guided through org setup before accessing dashboard.

---

## Phase 7: User Story 5 - Área Protegida / Dashboard (Priority: P2)

**Goal**: Usuário autenticado com organization vê dashboard com info básica (email, org name) e pode fazer logout.

**Independent Test**: Fazer login com usuário que tem org, acessar `/dashboard`, verificar que mostra email do usuário e nome da organization. Clicar "Sair" e verificar redirect para landing page. Tentar acessar `/dashboard` sem autenticação redireciona para `/signin`.

### Implementation for User Story 5

- [X] T018 [P] [US5] Create sign out button Client Component in `src/components/features/auth/sign-out-button.tsx`. "use client" component that calls `authClient.signOut()` on click, then redirects to `/` via `useRouter().push()`. Uses shadcn/ui Button (variant="outline"). Show loading state during sign out. Include Lucide `LogOut` icon.
- [X] T019 [US5] Create dashboard page in `src/app/(protected)/dashboard/page.tsx`. Server Component that fetches session via `auth.api.getSession()` with `headers()`. Display user email and active organization name in a clean layout using shadcn/ui Card. Include the sign-out-button component. Use Suspense boundary for dynamic session data. Simple layout: header with org name + user email + sign out button, main content area with welcome message.

**Checkpoint**: Full flow complete. Users can: land → signup → magic link → create org → dashboard → logout.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T020 Create styled magic link email HTML template in `src/lib/auth.ts` (update the sendMagicLink callback). Replace plain `<a>` tag with responsive HTML email template including: ClinTrek branding, clear CTA button, expiration notice (15 min), fallback plain URL, "ignore if not you" footer. Use inline CSS for email client compatibility.
- [X] T021 Add Zod validation schema file in `src/lib/validations/auth.ts` with reusable email schema (`z.string().email("Email inválido")`) and organization name schema (`z.string().min(1, "Nome é obrigatório")`). Update magic-link-form and create-org-form to import from this shared file instead of inline schemas.
- [X] T022 Review and ensure all interactive components meet WCAG 2.1 AA: verify keyboard navigation on all forms, check focus indicators on buttons/inputs, verify aria-labels on icon-only buttons (sign-out), ensure error messages are announced by screen readers (aria-live regions), verify color contrast ratios on all text.
- [X] T023 Run quickstart.md validation: manually walk through the complete flow (landing → signup → email → magic link → org creation → dashboard → logout) and verify all acceptance scenarios from spec.md pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Phase 2 completion
  - US1 (Landing) can proceed independently
  - US2 (Signup) can proceed independently
  - US3 (Signin) depends on T013 from US2 (shares magic-link-form component)
  - US4 (Organization) can proceed independently
  - US5 (Dashboard) can proceed independently
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Landing Page)**: Independent — no dependencies on other stories
- **US2 (Signup)**: Independent — creates the shared magic-link-form component
- **US3 (Signin)**: Depends on US2 (T013 magic-link-form) — reuses the same component
- **US4 (Organization)**: Independent — organization form is self-contained
- **US5 (Dashboard)**: Independent — dashboard page is self-contained

### Within Each User Story

- Server-side config before client components
- Shared components before pages that use them
- Core implementation before polish

### Parallel Opportunities

**Phase 1**: T001 + T002 + T003 + T004 can all run in parallel
**Phase 2**: T005 + T006 can run in parallel (different files). T007 depends on T005. T008 depends on T005. T009 + T010 can run in parallel after T005.
**Phase 3+**: Once Phase 2 completes:
  - US1 (T011-T012) and US2 (T013-T014) and US4 (T016-T017) can run in parallel
  - US3 (T015) waits for T013 from US2
  - US5 (T018-T019) can run in parallel with other stories

---

## Parallel Example: After Phase 2 Completes

```text
# These can all start simultaneously:
Agent A: T011 [US1] hero-section.tsx → T012 [US1] page.tsx (Landing)
Agent B: T013 [US2] magic-link-form.tsx → T014 [US2] signup/page.tsx (Signup)
Agent C: T016 [US4] create-org-form.tsx → T017 [US4] onboarding page (Organization)
Agent D: T018 [US5] sign-out-button.tsx → T019 [US5] dashboard/page.tsx (Dashboard)

# Then after T013 completes:
Agent B or E: T015 [US3] signin/page.tsx (Signin)
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 = Auth Flow)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: US1 Landing Page
4. Complete Phase 4: US2 Signup
5. Complete Phase 5: US3 Signin
6. **STOP and VALIDATE**: Full auth flow works (land → signup → magic link → authenticated)

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 Landing Page → First visual deliverable
3. US2 + US3 Signup/Signin → Auth cycle complete (MVP!)
4. US4 Organization → Multi-tenant structure
5. US5 Dashboard → Complete application flow
6. Polish → Production-ready quality

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No automated tests per constitution (Testing Strategy: "sem testes unitarios ou automatizados")
- T013 (magic-link-form) is the critical shared component — used by both US2 and US3
- T010 (protected layout) handles both session check AND organization check — central guard
- Better Auth CLI (T008) generates all DB models automatically — no manual Prisma schema writing needed
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
