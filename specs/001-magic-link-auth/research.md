# Research: Magic Link Authentication with Organizations

**Feature Branch**: `001-magic-link-auth`
**Date**: 2026-02-27

## Decision 1: Authentication Framework

**Decision**: Better Auth (`better-auth` npm package)

**Rationale**: Especificado pelo usuário. Better Auth oferece plugins nativos para magic link e organizations, adapter para Prisma, e integração direta com Next.js App Router. Suporta React 19 e Server Components.

**Alternatives considered**:
- Auth.js (NextAuth v5): Mais popular mas menos flexível para customização de fluxos e sem plugin de organization nativo.
- Lucia Auth: Descontinuado, recomenda Better Auth como substituto.
- Clerk/Auth0: SaaS externo, custo adicional, menos controle.

## Decision 2: Email Provider

**Decision**: SendGrid (`@sendgrid/mail` npm package)

**Rationale**: Especificado pelo usuário. SendGrid é amplamente utilizado para emails transacionais, oferece SDK oficial para Node.js, e tem tier gratuito suficiente para desenvolvimento. Better Auth oferece callback `sendMagicLink` onde se implementa o envio via SendGrid.

**Alternatives considered**:
- Resend: API moderna, mas não especificado pelo usuário.
- AWS SES: Mais barato em escala mas mais complexo de configurar.
- Nodemailer + SMTP: Genérico, sem dashboard de monitoramento.

## Decision 3: Database Adapter Pattern

**Decision**: Better Auth `prismaAdapter` usando o Prisma singleton existente do projeto

**Rationale**: O projeto já tem Prisma configurado com `@prisma/adapter-pg` para PostgreSQL. Better Auth tem seu próprio `prismaAdapter` que aceita uma instância de PrismaClient. O singleton em `src/lib/prisma.ts` será compartilhado entre Better Auth e o restante da aplicação.

**Alternatives considered**:
- Better Auth com adapter direto de PostgreSQL (sem Prisma): Perderia a tipagem e migrations do Prisma.
- Drizzle ORM: Não configurado no projeto.

## Decision 4: Route Protection Strategy

**Decision**: Cookie check otimista no middleware + validação completa no server-side (layout/page)

**Rationale**: Combina performance (middleware edge-compatible para redirect rápido) com segurança (validação real da sessão no servidor). Alinhado com o princípio VII da constituição (Suspense para dados dinâmicos).

**Alternatives considered**:
- Middleware com validação completa (Node.js runtime): Mais lento, bloqueia todas as requests.
- Apenas server-side sem middleware: Permite flash de conteúdo antes do redirect.

## Decision 5: Organization Model (Fase Inicial)

**Decision**: Usar o Organization plugin do Better Auth com configuração mínima

**Rationale**: O plugin já gerencia tabelas Organization, Member e relacionamentos. Para a fase inicial, apenas o campo `name` é necessário (conforme spec). O plugin provê roles (owner/admin/member) nativamente, preparando para expansão futura sem retrabalho.

**Alternatives considered**:
- Organization custom sem plugin: Mais trabalho, duplicação de lógica já existente no plugin.
- Apenas campo `organizationName` no User: Sem separação de entidades, dificulta expansão futura.

## Decision 6: Rate Limiting de Magic Links

**Decision**: Rate limiting a nível de aplicação: 5 requests/hora/email (conforme clarificação)

**Rationale**: SendGrid não tem rate limit por request no endpoint `/mail/send`, mas limita por volume mensal no plano. Rate limiting no app protege contra abuso de envio e custos inesperados.

**Alternatives considered**:
- Rate limiting apenas no SendGrid: Insuficiente, não previne requests ao servidor.
- Redis-based rate limiting: Over-engineering para fase inicial. Pode usar controle simples via banco de dados (contagem de verifications criadas por email na última hora).

## Decision 7: Magic Link Expiration

**Decision**: 15 minutos (900 segundos) conforme FR-004

**Rationale**: Padrão de segurança que equilibra conveniência (tempo suficiente para acessar email) com proteção (janela curta contra interceptação). O default do Better Auth é 5 minutos, será configurado para 900 segundos.

**Alternatives considered**:
- 5 minutos (Better Auth default): Pode ser curto demais para usuários com email lento.
- 30 minutos: Janela de exposição desnecessariamente longa.

## Decision 8: Session Duration

**Decision**: 7 dias conforme clarificação

**Rationale**: Padrão para apps SaaS. Equilibra segurança com conveniência. Better Auth suporta configuração de `session.expiresIn`.

**Alternatives considered**:
- 24 horas: Muito curto, forçaria re-login frequente.
- 30 dias: Muito longo para app com dados sensíveis.

## Key Technical Findings

### Better Auth + Prisma Schema
Better Auth fornece CLI (`npx @better-auth/cli generate`) que gera automaticamente os models Prisma necessários: User, Session, Account, Verification. O Organization plugin adiciona: Organization, Member, Invitation, e campo `activeOrganizationId` na Session.

### Better Auth Magic Link Plugin
- Import: `import { magicLink } from "better-auth/plugins"`
- Client: `import { magicLinkClient } from "better-auth/client/plugins"`
- Método: `authClient.signIn.magicLink({ email, callbackURL })`
- Suporta `newUserCallbackURL` para redirecionar novos usuários (ideal para fluxo de organization)

### Better Auth Organization Plugin
- Import: `import { organization } from "better-auth/plugins"`
- Client: `import { organizationClient } from "better-auth/client/plugins"`
- Métodos: `organization.create()`, `organization.setActive()`, `useActiveOrganization()`, `useListOrganizations()`
- Roles padrão: owner, admin, member
- `allowUserToCreateOrganization: true` habilitado

### SendGrid Integration
- Package: `@sendgrid/mail`
- Integra via callback `sendMagicLink` do Better Auth
- Requer: `SENDGRID_API_KEY` e sender verificado
- Sem rate limit por request no `/mail/send`, mas plano limita volume mensal

### Next.js 16 Route Protection
- Middleware (cookie check) em `middleware.ts` para redirect rápido
- Validação real via `auth.api.getSession()` nos layouts/pages protegidos
- `nextCookies()` plugin necessário para Server Actions
