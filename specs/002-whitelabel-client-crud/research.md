# Research: Whitelabel Organization & Client CRUD

**Feature**: 002-whitelabel-client-crud
**Date**: 2026-03-02

## Decision 1: Logo Storage

**Decision**: Local filesystem with Next.js API route for serving files

**Rationale**: Aligns with constitution principle VI (YAGNI). For a small clinic management app with a handful of organizations, local file storage is the simplest approach. Files are stored in a `data/uploads/` directory (outside `public/` since public is static at build time) and served via a dynamic API route `/api/uploads/[...path]`. The Organization model stores only the relative file path.

**Alternatives considered**:
- **Vercel Blob**: Excellent if deploying to Vercel, but locks into Vercel ecosystem. Premature optimization for current scale.
- **Uploadthing**: Good DX but adds external dependency and cost ($10+/month) for storing a few logos.
- **Supabase Storage**: Overkill — adds external service for a handful of 2MB files.
- **Base64 in database**: Rejected by spec. Causes query bloat and prevents CDN/caching.

**Migration path**: If the app moves to serverless deployment (Vercel, AWS Lambda), swap the filesystem storage for Vercel Blob or S3. The abstraction is in the Server Action — only the storage implementation changes.

## Decision 2: Client Portal Authentication

**Decision**: Custom implementation with Prisma models + API routes + middleware

**Rationale**: The client auth requirements are simple (magic link only, 7-day sessions, per-org login). A custom implementation using existing infrastructure (Prisma, SendGrid) is simpler than configuring a second Better Auth instance. It avoids potential cookie conflicts, doesn't require learning Better Auth's internal customization API, and gives full control over the session lifecycle.

**Implementation**:
- `Client` model — the patient entity (already in spec)
- `ClientInvitation` model — magic link tokens with 15-min expiry
- `ClientSession` model — httpOnly cookie with 7-day expiry
- Cookie name: `clintrek-client-session` (isolated from admin `better-auth.session_token`)
- API routes: `/api/portal/magic-link` (generate), `/api/portal/verify` (verify token)
- Middleware: check `clintrek-client-session` cookie for `/portal/[slug]` routes (except `/login`)

**Alternatives considered**:
- **Second Better Auth instance**: Lower code but risks cookie conflicts (documented issues with cookiePrefix in some versions). Generates its own schema which may conflict with existing models. Overkill for magic-link-only auth.
- **Jose/Iron-Session (JWT)**: Stateless but requires building magic link flow from scratch. No rate limiting. JWT payload visible in browser (Jose). Better suited for APIs, not a portal with DB-backed sessions.

## Decision 3: CSS Theming for Whitelabel

**Decision**: CSS custom properties (variables) set dynamically on the root element

**Rationale**: The existing `globals.css` already uses OKLCH CSS custom properties for theming. We extend this by setting `--org-primary` and `--org-accent` variables on the `<html>` element via a server-side layout component. Tailwind CSS 4 supports arbitrary CSS variables natively.

**Implementation**:
- Server component reads org branding from DB
- Sets CSS variables as inline style on a wrapper div
- Tailwind classes reference these variables: `bg-[var(--org-primary)]`
- Fallback to ClinTrek defaults when org has no custom branding

**Alternatives considered**:
- **Tailwind CSS plugin**: More complex, requires build-time configuration. Not suitable for runtime theming.
- **CSS-in-JS (styled-components)**: Violates constitution (adds client-side overhead, not aligned with Server Components).
- **Zustand store for theme**: Unnecessary state management. CSS variables are reactive and don't need JS state.

## Decision 4: Color Picker Component

**Decision**: Native HTML `<input type="color">` with hex text input

**Rationale**: HTML5 color picker is accessible, keyboard-navigable, requires zero dependencies, and outputs hex format. Combined with a text input for manual hex entry, it satisfies FR-002. Aligns with YAGNI — no need for a full-featured color picker library.

**Alternatives considered**:
- **react-colorful**: Popular but adds dependency for a feature used in one form.
- **Custom color picker**: Over-engineering for selecting 2 colors in a settings page.

## Decision 5: File Upload Approach

**Decision**: Server Action with FormData for file upload

**Rationale**: Next.js Server Actions support FormData natively, including file uploads. No need for external upload libraries or API routes. The Server Action validates file type/size with Zod, writes to filesystem, and returns the file URL. This aligns with the constitution (Server Actions for mutations).

**Implementation**:
- Server Action receives FormData with file
- Validates: max 2MB, PNG/JPG/SVG only (via Zod)
- Generates unique filename (crypto.randomUUID + extension)
- Writes to `data/uploads/organizations/[orgId]/`
- Returns URL path for storage in DB

## Decision 6: Client List Pagination

**Decision**: Server-side pagination with URL search params

**Rationale**: Prisma supports `skip`/`take` for pagination. Using URL search params (`?page=1&search=term`) keeps state in the URL (bookmarkable, shareable) and works with Server Components. 20 items per page as specified.

**Implementation**:
- `searchParams` in page component for page number and search query
- Prisma query with `skip`, `take`, `where` (name/email contains search term)
- Server Component renders — no client-side state needed
- Pagination controls as links (not buttons) for accessibility
