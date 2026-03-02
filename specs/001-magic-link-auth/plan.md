# Implementation Plan: Magic Link Authentication with Organizations

**Branch**: `001-magic-link-auth` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-magic-link-auth/spec.md`

## Summary

Sistema de autenticação via magic link usando Better Auth com SendGrid para envio de emails. Usuários se cadastram/logam informando apenas o email, recebem um link que os autentica automaticamente. Após primeiro login, usuários sem organization são direcionados a criar uma. Inclui landing page com CTAs e área protegida (dashboard). Implementado com Next.js 16 App Router, Prisma/PostgreSQL, shadcn/ui.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20+
**Primary Dependencies**: Next.js 16.1.6, React 19.2.3, Better Auth (magic-link + organization plugins), @sendgrid/mail, Prisma 7.4.2, shadcn/ui, React Hook Form + Zod, Lucide React
**Storage**: PostgreSQL via Prisma ORM com @prisma/adapter-pg
**Testing**: Sem testes automatizados (conforme constituição)
**Target Platform**: Web (browser moderno)
**Project Type**: Web application (Next.js App Router, fullstack)
**Performance Goals**: Landing page <3s load, magic link entregue <30s
**Constraints**: WCAG 2.1 AA, LGPD compliance, Server Components by default
**Scale/Scope**: Fase inicial, ~8 páginas/componentes, 6 entidades de dados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. shadcn/ui First | PASS | Todos os componentes UI usam shadcn/ui (Button, Input, Card, Form, Label) |
| II. Server Components by Default | PASS | Pages são Server Components. Client Components isolados: magic-link-form, sign-out-button, create-org-form |
| III. Type Safety Absoluta | PASS | TypeScript strict, Zod para validação de formulários, Better Auth tipado |
| IV. Acessibilidade WCAG 2.1 AA | PASS | shadcn/ui garante base acessível, formulários com labels e aria-*, contraste 4.5:1 via theme |
| V. Segurança de Dados | PASS | Tokens/keys server-only, validação Zod em entradas, FR-006 anti-enumeração |
| VI. Simplicidade e YAGNI | PASS | Org simples (nome apenas), sem abstrações extras, Better Auth plugins nativos |
| VII. Suspense para Conteúdo Dinâmico | PASS | Session checks em Suspense boundaries, landing page estática |

**Post-Design Re-check**: PASS - Nenhuma violação detectada.

## Project Structure

### Documentation (this feature)

```text
specs/001-magic-link-auth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── auth-api.md      # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx                        # Landing page (Server Component)
│   ├── layout.tsx                      # Root layout
│   ├── globals.css                     # Tailwind + shadcn theme
│   ├── (auth)/
│   │   ├── signin/page.tsx             # Página de login
│   │   └── signup/page.tsx             # Página de cadastro
│   ├── (protected)/
│   │   ├── layout.tsx                  # Layout com validação de sessão server-side
│   │   ├── dashboard/page.tsx          # Dashboard principal
│   │   └── onboarding/
│   │       └── organization/page.tsx   # Formulário de criação de org
│   └── api/
│       └── auth/
│           └── [...all]/route.ts       # Better Auth catch-all handler
├── components/
│   ├── ui/                             # shadcn/ui components
│   └── features/
│       ├── auth/
│       │   ├── magic-link-form.tsx     # Formulário email + magic link (Client)
│       │   └── sign-out-button.tsx     # Botão de logout (Client)
│       ├── landing/
│       │   └── hero-section.tsx        # Hero da landing page (Server)
│       └── organization/
│           └── create-org-form.tsx     # Formulário de criação de org (Client)
├── lib/
│   ├── auth.ts                         # Better Auth server instance
│   ├── auth-client.ts                  # Better Auth client
│   ├── prisma.ts                       # Prisma singleton (existente)
│   └── utils.ts                        # cn() helper (existente)
├── middleware.ts                       # Cookie check para rotas protegidas
└── types/
```

**Structure Decision**: Next.js App Router com route groups: `(auth)` para páginas públicas de autenticação, `(protected)` para área interna com layout que valida sessão. Segue a estrutura definida na constituição.

## Complexity Tracking

> Nenhuma violação da constituição detectada. Tabela não necessária.
