# Data Model: Magic Link Authentication with Organizations

**Feature Branch**: `001-magic-link-auth`
**Date**: 2026-02-27

> Nota: Better Auth gera automaticamente os models via CLI (`npx @better-auth/cli generate`).
> Este documento descreve o modelo conceitual e as customizações necessárias.

## Entities

### User

Representa um usuário da aplicação.

| Field          | Type     | Constraints                | Notes                          |
|----------------|----------|----------------------------|--------------------------------|
| id             | string   | PK, auto-generated         | ID único gerado pelo Better Auth |
| name           | string   | required                   | Nome do usuário               |
| email          | string   | required, unique           | Email de autenticação         |
| emailVerified  | boolean  | required, default: false   | Verificação via magic link    |
| image          | string?  | optional                   | Avatar URL (futuro)           |
| createdAt      | DateTime | auto-generated             |                                |
| updatedAt      | DateTime | auto-generated             |                                |

**Relationships**:
- Has many Sessions
- Has many Accounts
- Has many Members (via Organization plugin)

---

### Session

Representa uma sessão ativa do usuário.

| Field                  | Type      | Constraints        | Notes                        |
|------------------------|-----------|--------------------|------------------------------|
| id                     | string    | PK, auto-generated |                              |
| token                  | string    | unique             | Token de sessão              |
| expiresAt              | DateTime  | required           | Expira em 7 dias (604800s)   |
| ipAddress              | string?   | optional           | IP do cliente                |
| userAgent              | string?   | optional           | User agent do navegador      |
| userId                 | string    | FK → User          |                              |
| activeOrganizationId   | string?   | FK → Organization  | Org ativa (plugin)           |
| createdAt              | DateTime  | auto-generated     |                              |
| updatedAt              | DateTime  | auto-generated     |                              |

**Relationships**:
- Belongs to User
- References active Organization (optional)

---

### Account

Representa uma conta de autenticação associada ao usuário.

| Field                   | Type      | Constraints        | Notes                           |
|-------------------------|-----------|--------------------|---------------------------------|
| id                      | string    | PK, auto-generated |                                 |
| accountId               | string    | required           | ID no provider                  |
| providerId              | string    | required           | Nome do provider (ex: "credential") |
| userId                  | string    | FK → User          |                                 |
| accessToken             | string?   | optional           | OAuth token                     |
| refreshToken            | string?   | optional           | OAuth refresh                   |
| idToken                 | string?   | optional           | OIDC token                      |
| accessTokenExpiresAt    | DateTime? | optional           |                                 |
| refreshTokenExpiresAt   | DateTime? | optional           |                                 |
| scope                   | string?   | optional           |                                 |
| password                | string?   | optional           | Não usado (magic link only)     |
| createdAt               | DateTime  | auto-generated     |                                 |
| updatedAt               | DateTime  | auto-generated     |                                 |

**Relationships**:
- Belongs to User

---

### Verification

Representa tokens de verificação (magic links).

| Field      | Type      | Constraints        | Notes                            |
|------------|-----------|--------------------|----------------------------------|
| id         | string    | PK, auto-generated |                                  |
| identifier | string    | required           | Email associado                  |
| value      | string    | required           | Token (plain ou hashed)          |
| expiresAt  | DateTime  | required           | Expira em 15 min (900s)          |
| createdAt  | DateTime? | optional           |                                  |
| updatedAt  | DateTime? | optional           |                                  |

**Validation Rules**:
- Token invalidado após uso (single-use)
- Tokens anteriores invalidados quando novo é gerado para o mesmo email (FR-005)

---

### Organization

Representa a organização/empresa do usuário.

| Field     | Type     | Constraints         | Notes                             |
|-----------|----------|---------------------|-----------------------------------|
| id        | string   | PK, auto-generated  | Identificador único interno       |
| name      | string   | required            | Nome (duplicados permitidos)      |
| slug      | string   | unique              | Slug auto-gerado do nome          |
| logo      | string?  | optional            | URL do logo (futuro)              |
| metadata  | string?  | optional            | JSON para campos futuros          |
| createdAt | DateTime | auto-generated      |                                   |

**Relationships**:
- Has many Members

**Validation Rules**:
- Nome é obrigatório e não precisa ser único
- Slug é gerado automaticamente e deve ser único

---

### Member

Representa a associação entre User e Organization.

| Field          | Type     | Constraints           | Notes                     |
|----------------|----------|-----------------------|---------------------------|
| id             | string   | PK, auto-generated    |                           |
| userId         | string   | FK → User             |                           |
| organizationId | string   | FK → Organization     |                           |
| role           | string   | required              | owner, admin, member      |
| createdAt      | DateTime | auto-generated        |                           |

**Relationships**:
- Belongs to User
- Belongs to Organization

**Validation Rules**:
- Um User pertence a exatamente uma Organization nesta fase
- O criador da Organization recebe role "owner"

---

### Invitation (Organization Plugin)

Representa convite para organização (disponível via plugin, não usado na fase inicial).

| Field          | Type     | Constraints           | Notes                       |
|----------------|----------|-----------------------|-----------------------------|
| id             | string   | PK, auto-generated    |                             |
| email          | string   | required              | Email do convidado          |
| inviterId      | string   | FK → User             | Quem convidou               |
| organizationId | string   | FK → Organization     |                             |
| role           | string   | required              | Role atribuída              |
| status         | string   | required              | pending, accepted, rejected |
| expiresAt      | DateTime | required              |                             |

> Nota: Tabela criada pelo plugin mas não utilizada ativamente na fase inicial.

---

## Entity Relationship Diagram

```
User 1──N Session
User 1──N Account
User 1──N Member
Organization 1──N Member
Member N──1 User
Member N──1 Organization
Session N──1? Organization (activeOrganizationId)
```

## State Transitions

### User Authentication Flow
```
Visitor → [submit email] → Magic Link Sent → [click link] → Authenticated
Authenticated (no org) → [create org] → Authenticated (with org) → Dashboard
```

### Magic Link Token Lifecycle
```
Created → [user clicks] → Consumed (single-use)
Created → [15 min passes] → Expired
Created → [new token requested] → Invalidated
```

### Session Lifecycle
```
Created (login) → Active → [7 days] → Expired
Active → [logout] → Terminated
```
