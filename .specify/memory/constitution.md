<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Added sections:
  - Core Principles: VII. Suspense Obrigatório para Dados Dinâmicos
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (no changes needed - aligns with principles)
  - .specify/templates/spec-template.md ✅ (no changes needed - aligns with principles)
  - .specify/templates/tasks-template.md ✅ (no changes needed - aligns with principles)
Follow-up TODOs: None
-->

# CLintrek Constitution

## Core Principles

### I. shadcn/ui First

Todos os componentes de interface DEVEM utilizar shadcn/ui como base. Componentes customizados só são permitidos quando não existe equivalente no shadcn/ui ou quando a necessidade é altamente específica ao domínio de licitações.

**Regras**:
- SEMPRE verificar o catálogo shadcn/ui antes de criar componentes
- Componentes customizados DEVEM seguir as convenções de estilo shadcn/ui (variantes via CVA, composição via Radix primitives)
- Utilizar Lucide React para todos os ícones
- Manter consistência com o tema "new-york" configurado no projeto

**Justificativa**: Padronização de UI, acessibilidade garantida, manutenção simplificada e consistência visual em toda a aplicação.

### II. Server Components by Default

Toda página e componente DEVE ser Server Component por padrão. Client Components ("use client") são permitidos apenas para interatividade essencial (formulários, modais, animações, estado local).

**Regras**:
- NUNCA adicionar "use client" sem justificativa clara
- Isolar interatividade em componentes pequenos e específicos
- Dados pesados e lógica de negócio DEVEM permanecer no servidor
- Utilizar Server Actions para mutações de dados

**Justificativa**: Performance otimizada, SEO superior, bundle size reduzido e melhor experiência para usuários com conexões lentas (comum em prefeituras de pequenos municípios).

### III. Type Safety Absoluta

TypeScript strict mode é obrigatório. Nenhum uso de `any`, `as unknown`, ou supressão de erros de tipo sem justificativa documentada em código.

**Regras**:
- NUNCA usar `any` - preferir `unknown` com narrowing adequado
- NUNCA usar `@ts-ignore` ou `@ts-expect-error` sem comentário explicativo
- Todas as funções públicas DEVEM ter tipos explícitos de retorno
- Utilizar Zod para validação de dados externos (API, formulários)

**Justificativa**: Reduz bugs em produção, melhora a manutenibilidade e documenta contratos de API automaticamente.

### IV. Acessibilidade (WCAG 2.1 AA)

Toda interface DEVE ser acessível conforme WCAG 2.1 nível AA. Servidores públicos com deficiências visuais ou motoras DEVEM conseguir utilizar o sistema.

**Regras**:
- TODOS os elementos interativos DEVEM ser acessíveis via teclado
- TODOS os formulários DEVEM ter labels associados e mensagens de erro acessíveis
- Contraste de cores DEVE atender ao mínimo de 4.5:1 para texto normal
- Utilizar aria-* attributes quando semântica HTML não for suficiente

**Justificativa**: Conformidade com a Lei Brasileira de Inclusão (Lei 13.146/2015) e garantia de acesso universal ao serviço público.

### V. Segurança de Dados Públicos

Dados de licitações são públicos por natureza, mas dados de usuários e credenciais DEVEM ser protegidos. Validação de entrada é obrigatória em todas as fronteiras do sistema.

**Regras**:
- NUNCA expor credenciais, tokens ou chaves em código cliente
- TODAS as entradas de usuário DEVEM ser validadas com Zod antes de processamento
- Server Actions DEVEM validar permissões do usuário autenticado
- Logs NUNCA devem conter dados sensíveis (CPF, senhas, tokens)

**Justificativa**: Proteção de dados pessoais (LGPD), prevenção de ataques e manutenção da integridade do processo licitatório.

### VI. Simplicidade e YAGNI

Código simples que resolve o problema atual é preferível a abstrações complexas para problemas futuros hipotéticos.

**Regras**:
- NUNCA criar abstrações para uso único
- NUNCA adicionar features não solicitadas
- Três linhas de código repetido são preferíveis a uma abstração prematura
- Refatoração DEVE ser justificada por necessidade concreta, não teórica

**Justificativa**: Manutenibilidade, velocidade de entrega e redução de complexidade acidental.

### VII. Suspense Obrigatório para Conteúdo Dinâmico

Todo acesso a dados dinâmicos (headers, cookies, searchParams, uncached fetch) DEVE ocorrer dentro de limites de `Suspense`.

**Regras**:
- NUNCA bloquear o shell estático com dados dinâmicos na raiz da página.
- Envolver componentes dinâmicos em `<Suspense>` com fallback apropriado.
- Utilizar `use cache` para dados que podem ser estáticos, ou `Suspense` para o que deve ser request-time.
- SEMPRE em CRUDs se preocupar com a invalidacao do cache para que o usuario veja os dados atualizados
**Justificativa**: Habilita Partial Prerendering (PPR) por padrão, garantindo TTFB imediato e streaming de conteúdo dinâmico sem erros de build.

## Technology Standards

**Framework**: Next.js 16+ com App Router
**Runtime**: React 19 com React Compiler habilitado
**Estilização**: Tailwind CSS 4 com CSS variables para temas
**Componentes**: shadcn/ui (estilo new-york) + Radix UI primitives
**Ícones**: Lucide React
**Validação**: Zod para schemas e validação runtime
**Estado Global**: Zustand (quando necessário) ou React Context para escopos limitados
**Formulários**: React Hook Form + Zod resolver
**Cache**: cacheComponents habilitado - utilizar estratégias de revalidação adequadas

**Estrutura de Diretórios**:
```
src/
├── app/              # App Router (páginas e layouts)
├── components/
│   ├── ui/           # Componentes shadcn/ui
│   └── features/     # Componentes específicos de domínio
├── lib/              # Utilitários e configurações
├── hooks/            # Custom React hooks
├── types/            # Definições TypeScript compartilhadas
└── actions/          # Server Actions
```

## Development Workflow

### Code Review

- PRs DEVEM passar por review antes de merge
- Verificar conformidade com princípios da constituição
- Verificar acessibilidade de novos componentes
- Verificar type safety (sem any, tipos explícitos)

### Testing Strategy

- sem testes unitarios ou automatizados 

### Commits

- Mensagens sempre em ingles são aceitas
- Formato: `tipo: descrição breve`
- Tipos: feat, fix, refactor, docs, test, chore

## Governance

Esta constituição é o documento normativo supremo do projeto clintrek. Todas as decisões técnicas e de design DEVEM estar em conformidade com os princípios aqui estabelecidos.

**Processo de Emenda**:
1. Proposta documentada com justificativa técnica
2. Discussão em PR dedicado
3. Aprovação por consenso da equipe
4. Atualização de versão conforme SemVer:
   - MAJOR: Remoção ou redefinição de princípios
   - MINOR: Adição de novos princípios ou seções
   - PATCH: Clarificações e correções de texto

**Compliance**:
- Todo PR DEVE ser verificado contra os princípios desta constituição
- Violações DEVEM ser documentadas e justificadas na seção "Complexity Tracking" do plano
- Dúvidas sobre interpretação são resolvidas em favor da simplicidade (Princípio VI)

**Version**: 1.1.1 | **Ratified**: 2026-01-22 | **Last Amended**: 2026-01-26
