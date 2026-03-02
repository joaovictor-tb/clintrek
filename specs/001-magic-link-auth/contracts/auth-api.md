# Auth API Contracts

**Feature Branch**: `001-magic-link-auth`
**Date**: 2026-02-27

> Better Auth expõe automaticamente endpoints sob `/api/auth/*` via catch-all route handler.
> Este documento descreve os contratos relevantes para o feature.

## Endpoints (Better Auth managed)

### POST /api/auth/magic-link/sign-in

Solicita envio de magic link para o email.

**Request**:
```json
{
  "email": "user@example.com",
  "callbackURL": "/dashboard",
  "newUserCallbackURL": "/onboarding/organization"
}
```

**Response (200)**:
```json
{
  "status": true
}
```

**Response (429)** - Rate limit excedido:
```json
{
  "error": "Too many requests"
}
```

**Behavior**:
- Se email não existe, cria user + envia magic link (signup)
- Se email existe, envia magic link (signin)
- Mesma resposta independente de existência do email (FR-006)
- Rate limit: 5 por hora por email (FR-015)

---

### GET /api/auth/magic-link/verify

Verifica token do magic link e autentica o usuário.

**Query params**:
- `token`: string (token do magic link)
- `callbackURL`: string (URL de redirect após autenticação)

**Response**: Redirect para `callbackURL` com sessão criada (set-cookie)

**Error cases**:
- Token expirado (>15min): redirect para error page
- Token já usado: redirect para error page
- Token inválido: redirect para error page

---

### POST /api/auth/sign-out

Encerra a sessão do usuário.

**Request**: (cookie de sessão enviado automaticamente)

**Response (200)**:
```json
{
  "success": true
}
```

---

### GET /api/auth/get-session

Retorna dados da sessão atual.

**Response (200)** - Autenticado:
```json
{
  "session": {
    "id": "session-id",
    "userId": "user-id",
    "expiresAt": "2026-03-06T00:00:00Z",
    "activeOrganizationId": "org-id"
  },
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

**Response (401)** - Não autenticado:
```json
{
  "session": null,
  "user": null
}
```

---

### POST /api/auth/organization/create

Cria uma nova organization.

**Request**:
```json
{
  "name": "Minha Organização",
  "slug": "minha-organizacao"
}
```

**Response (200)**:
```json
{
  "id": "org-id",
  "name": "Minha Organização",
  "slug": "minha-organizacao",
  "createdAt": "2026-02-27T00:00:00Z"
}
```

**Validation**:
- `name` é obrigatório
- `slug` é gerado automaticamente se não fornecido

---

### POST /api/auth/organization/set-active

Define a organization ativa na sessão.

**Request**:
```json
{
  "organizationId": "org-id"
}
```

**Response (200)**:
```json
{
  "success": true
}
```

---

### GET /api/auth/organization/list

Lista organizations do usuário autenticado.

**Response (200)**:
```json
[
  {
    "id": "org-id",
    "name": "Minha Organização",
    "slug": "minha-organizacao",
    "role": "owner"
  }
]
```

## Route Structure (App Router)

```
/ (landing page - público)
├── /signin (formulário de login - público)
├── /signup (formulário de cadastro - público)
├── /onboarding/organization (criação de org - autenticado, sem org)
├── /dashboard (área protegida - autenticado, com org)
└── /api/auth/[...all] (Better Auth catch-all handler)
```

## Middleware Protection

**Rotas protegidas** (requerem cookie de sessão):
- `/dashboard/*`
- `/onboarding/*`

**Rotas públicas** (sem autenticação):
- `/`
- `/signin`
- `/signup`
- `/api/auth/*`
