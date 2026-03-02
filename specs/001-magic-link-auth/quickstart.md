# Quickstart: Magic Link Authentication with Organizations

**Feature Branch**: `001-magic-link-auth`
**Date**: 2026-02-27

## Prerequisites

- Node.js v20.19+
- PostgreSQL rodando localmente ou remotamente
- Conta SendGrid com API key e sender verificado
- Projeto clintrek com Prisma já configurado

## Setup Steps

### 1. Instalar dependências

```bash
npm install better-auth @sendgrid/mail
```

### 2. Configurar variáveis de ambiente

Adicionar ao `.env`:

```env
# Existing
DATABASE_URL="postgresql://user:password@localhost:5432/clintrek?schema=public"

# Better Auth
BETTER_AUTH_SECRET="gerar-com-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"

# SendGrid
SENDGRID_API_KEY="SG.sua-api-key"
EMAIL_FROM="noreply@seudominio.com"
```

Gerar secret: `openssl rand -base64 32`

### 3. Configurar Better Auth (Server)

Criar `src/lib/auth.ts`:

```ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink, organization } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import sgMail from "@sendgrid/mail";
import prisma from "@/lib/prisma";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  session: {
    expiresIn: 604800, // 7 dias em segundos
  },
  plugins: [
    nextCookies(),
    magicLink({
      expiresIn: 900, // 15 minutos em segundos
      sendMagicLink: async ({ email, url }) => {
        await sgMail.send({
          to: email,
          from: process.env.EMAIL_FROM!,
          subject: "Entrar no ClinTrek",
          html: `<a href="${url}">Clique aqui para entrar</a>`,
        });
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
    }),
  ],
});
```

### 4. Configurar Better Auth (Client)

Criar `src/lib/auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/react";
import { magicLinkClient, organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [magicLinkClient(), organizationClient()],
});

export const { signIn, signOut, useSession } = authClient;
```

### 5. Criar API Route Handler

Criar `src/app/api/auth/[...all]/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### 6. Gerar Schema Prisma

```bash
npx @better-auth/cli generate
npx prisma migrate dev --name add-auth-models
npx prisma generate
```

### 7. Criar Middleware

Criar `src/middleware.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
```

### 8. Testar

```bash
npm run dev
```

1. Acesse `http://localhost:3000`
2. Clique em "Cadastrar"
3. Informe um email
4. Verifique a caixa de entrada do email
5. Clique no magic link
6. Crie uma organization
7. Acesse o dashboard

## Componentes shadcn/ui necessários

```bash
npx shadcn@latest add button input label card form separator
```

## File Structure (esta feature)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx          # Validação server-side da sessão
│   │   ├── dashboard/page.tsx
│   │   └── onboarding/
│   │       └── organization/page.tsx
│   ├── api/auth/[...all]/route.ts
│   ├── page.tsx                # Landing page
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                     # shadcn/ui
│   └── features/
│       ├── auth/
│       │   ├── magic-link-form.tsx
│       │   └── sign-out-button.tsx
│       ├── landing/
│       │   └── hero-section.tsx
│       └── organization/
│           └── create-org-form.tsx
├── lib/
│   ├── auth.ts                 # Better Auth server
│   ├── auth-client.ts          # Better Auth client
│   ├── prisma.ts               # Prisma singleton
│   └── utils.ts                # cn() helper
├── middleware.ts
└── types/
```
