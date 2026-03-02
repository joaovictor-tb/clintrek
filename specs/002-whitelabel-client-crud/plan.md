# Implementation Plan: Whitelabel Organization & Client CRUD

**Branch**: `002-whitelabel-client-crud` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-whitelabel-client-crud/spec.md`

## Summary

Expand ClinTrek organizations with whitelabel branding (logo, primary/accent colors), implement a full client (patient) CRUD with search and pagination, add client invitation via magic link with branded emails, and build a client-facing portal at `/portal/[org-slug]` with per-org branding and self-service re-authentication.

Key technical approach: extend existing Prisma/Organization model with branding fields, use CSS custom properties for runtime theming, build custom client authentication (separate from Better Auth admin auth) with Prisma-backed sessions, and use Server Actions for all mutations.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20+
**Primary Dependencies**: Next.js 16.1.6, React 19.2.3, Better Auth 1.5.1 (admin auth), Prisma 7.4.2, @sendgrid/mail, shadcn/ui, React Hook Form + Zod 4, Lucide React
**Storage**: PostgreSQL (Prisma ORM) + local filesystem for logo uploads (`data/uploads/`)
**Testing**: Manual testing (per constitution — no automated tests)
**Target Platform**: Web (browser), server-rendered via Next.js
**Project Type**: Web application (full-stack Next.js)
**Performance Goals**: CRUD operations < 2s, search < 1s for 1000 records, portal load < 3s
**Constraints**: WCAG 2.1 AA accessibility, Server Components by default, no `any` types
**Scale/Scope**: Up to 1000 clients per organization, ~10 new pages/components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. shadcn/ui First | PASS | All UI components use shadcn/ui. New components needed: Table, Dialog, AlertDialog, Badge, Skeleton, Sonner. Native `<input type="color">` for color picker (no shadcn equivalent). |
| II. Server Components by Default | PASS | All pages are Server Components. Client Components only for: forms (color picker, client form, portal login), sign-out button, branding provider. |
| III. Type Safety Absoluta | PASS | Zod validation on all inputs (client form, branding form, portal login). Prisma provides typed queries. Server Actions have explicit return types. |
| IV. Acessibilidade WCAG 2.1 AA | PASS | All forms with labels, keyboard navigation, aria attributes. AlertDialog for delete confirmation. Color picker has text input fallback. |
| V. Segurança de Dados | PASS | All Server Actions validate auth + org ownership. Client portal uses isolated cookie. Generic error messages prevent email enumeration. No secrets in client code. |
| VI. Simplicidade e YAGNI | PASS | Local filesystem for logos (simplest). Custom client auth (no extra library). Native color picker. No unnecessary abstractions. |
| VII. Suspense Obrigatório | PASS | Dynamic data (client list, org branding, session checks) wrapped in Suspense. Cache invalidation via revalidatePath on mutations. |

**Post-Phase 1 Re-check**: All gates still pass. No violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/002-whitelabel-client-crud/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── client-api.md    # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (protected)/
│   │   ├── dashboard/
│   │   │   └── page.tsx                    # UPDATE: add branding
│   │   ├── clients/
│   │   │   ├── page.tsx                    # NEW: client list with search/pagination
│   │   │   ├── new/
│   │   │   │   └── page.tsx                # NEW: create client form
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # NEW: client details
│   │   │       └── edit/
│   │   │           └── page.tsx            # NEW: edit client form
│   │   ├── settings/
│   │   │   └── organization/
│   │   │       └── page.tsx                # NEW: org branding settings
│   │   ├── layout.tsx                      # UPDATE: add branding provider
│   │   └── onboarding/
│   │       └── organization/
│   │           └── page.tsx                # UPDATE: add branding fields
│   ├── portal/
│   │   └── [orgSlug]/
│   │       ├── layout.tsx                  # NEW: portal layout with branding
│   │       ├── page.tsx                    # NEW: portal home (client dashboard)
│   │       ├── login/
│   │       │   └── page.tsx                # NEW: client login (request magic link)
│   │       └── verify/
│   │           └── route.ts                # NEW: magic link verification (redirect)
│   ├── api/
│   │   ├── portal/
│   │   │   ├── magic-link/
│   │   │   │   └── route.ts               # NEW: client magic link generation
│   │   │   └── logout/
│   │   │       └── route.ts               # NEW: client logout
│   │   └── uploads/
│   │       └── [...path]/
│   │           └── route.ts               # NEW: serve uploaded files
│   └── globals.css                         # UPDATE: add org branding CSS variables
├── components/
│   ├── features/
│   │   ├── organization/
│   │   │   ├── create-org-form.tsx         # UPDATE: add branding fields
│   │   │   ├── org-settings-form.tsx       # NEW: branding settings form
│   │   │   └── branding-provider.tsx       # NEW: CSS variable provider
│   │   ├── clients/
│   │   │   ├── client-table.tsx            # NEW: client list table
│   │   │   ├── client-form.tsx             # NEW: create/edit client form
│   │   │   ├── client-search.tsx           # NEW: search input
│   │   │   ├── invite-button.tsx           # NEW: invite action button
│   │   │   ├── delete-client-dialog.tsx    # NEW: delete confirmation
│   │   │   └── pagination.tsx              # NEW: pagination controls
│   │   └── portal/
│   │       ├── portal-login-form.tsx       # NEW: client magic link request form
│   │       └── portal-header.tsx           # NEW: portal header with branding
│   └── ui/                                 # ADD: table, dialog, alert-dialog, badge, skeleton, sonner
├── lib/
│   ├── client-auth.ts                      # NEW: client session utilities
│   └── validations/
│       ├── client.ts                       # NEW: client Zod schemas
│       └── organization.ts                 # NEW: org branding Zod schemas
├── actions/
│   ├── organization.ts                     # NEW: branding server actions
│   └── clients.ts                          # NEW: client CRUD server actions
├── middleware.ts                            # UPDATE: add portal route protection
└── types/                                  # (unused for now — types co-located)

data/
└── uploads/
    └── organizations/                      # Logo files stored here
        └── {orgId}/
            └── logo-{uuid}.{ext}

prisma/
└── schema.prisma                           # UPDATE: add Client, ClientInvitation, ClientSession models + Organization branding fields
```

**Structure Decision**: Follows the existing Next.js App Router structure established in feature 001. New pages added under `(protected)/` for admin views and `portal/[orgSlug]/` for client-facing views. Server Actions in `src/actions/`. Constitution's directory structure maintained.

## Complexity Tracking

No constitution violations detected. No complexity justifications needed.
