# Feature Specification: Magic Link Authentication with Organizations

**Feature Branch**: `001-magic-link-auth`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "Sistema de login via magic link com Better Auth e SendGrid. Usuário digita email, recebe link, é redirecionado logado. Login associado a uma organization. Se não tiver organization, cria uma. Landing page chamativa com CTAs de cadastro e login. Páginas de signin/signup redirecionando para área protegida."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Landing Page com CTAs de Cadastro e Login (Priority: P1)

Um visitante acessa a aplicação pela primeira vez e vê uma landing page atrativa que comunica o valor do produto. A página apresenta chamadas claras para ação (CTAs) de "Cadastrar" e "Entrar", incentivando o visitante a se registrar ou fazer login.

**Why this priority**: A landing page é a porta de entrada da aplicação. Sem ela, não há conversão de visitantes em usuários. É o primeiro ponto de contato e precisa causar boa impressão.

**Independent Test**: Pode ser testada acessando a URL raiz da aplicação e verificando que a página renderiza corretamente com os CTAs visíveis e funcionais.

**Acceptance Scenarios**:

1. **Given** um visitante não autenticado, **When** acessa a URL raiz da aplicação, **Then** vê uma landing page com título, descrição do produto, e botões visíveis de "Cadastrar" e "Entrar"
2. **Given** um visitante na landing page, **When** clica em "Cadastrar", **Then** é redirecionado para a página de cadastro (signup)
3. **Given** um visitante na landing page, **When** clica em "Entrar", **Then** é redirecionado para a página de login (signin)
4. **Given** um usuário já autenticado, **When** acessa a URL raiz, **Then** é redirecionado automaticamente para a área protegida (dashboard)

---

### User Story 2 - Cadastro via Magic Link (Priority: P1)

Um novo usuário se cadastra informando seu email. O sistema envia um magic link para o email informado via SendGrid. O usuário clica no link recebido no email e é autenticado automaticamente na aplicação.

**Why this priority**: É o fluxo core de entrada de novos usuários. Sem cadastro, nenhuma outra funcionalidade pode ser utilizada.

**Independent Test**: Pode ser testada preenchendo o formulário de cadastro com um email válido, verificando o recebimento do email com magic link, clicando no link e confirmando que o usuário é autenticado.

**Acceptance Scenarios**:

1. **Given** um visitante na página de signup, **When** informa um email válido e submete o formulário, **Then** o sistema exibe uma mensagem confirmando que um link foi enviado para o email
2. **Given** um email de magic link enviado, **When** o usuário clica no link dentro do prazo de validade, **Then** é autenticado e redirecionado para a área protegida
3. **Given** um email de magic link enviado, **When** o usuário clica no link após o prazo de validade expirar, **Then** vê uma mensagem de erro informando que o link expirou e oferecendo opção de reenviar
4. **Given** um visitante na página de signup, **When** informa um email já cadastrado, **Then** o sistema envia o magic link normalmente (sem revelar se o email já existe, por segurança)
5. **Given** um visitante na página de signup, **When** informa um email em formato inválido, **Then** vê uma mensagem de validação indicando formato incorreto

---

### User Story 3 - Login via Magic Link (Priority: P1)

Um usuário existente acessa a página de login, informa seu email e recebe um magic link. Ao clicar no link, é autenticado e redirecionado para a área protegida.

**Why this priority**: Login é essencial para usuários retornantes. Junto com o cadastro, forma o ciclo completo de autenticação.

**Independent Test**: Pode ser testada com um usuário previamente cadastrado, submetendo o email no formulário de login, clicando no magic link recebido e verificando acesso à área protegida.

**Acceptance Scenarios**:

1. **Given** um usuário existente na página de signin, **When** informa seu email e submete, **Then** o sistema exibe mensagem confirmando envio do magic link
2. **Given** um magic link recebido por email, **When** o usuário clica no link, **Then** é autenticado e redirecionado para a área protegida (dashboard)
3. **Given** um email não cadastrado na página de signin, **When** o usuário submete o formulário, **Then** o sistema exibe a mesma mensagem de confirmação (sem revelar se o email existe)

---

### User Story 4 - Criação de Organization após Primeiro Login (Priority: P2)

Após o primeiro login, se o usuário não pertencer a nenhuma organization, o sistema apresenta um formulário simples para criar sua organization. Somente após definir a organization, o usuário tem acesso completo à área protegida.

**Why this priority**: Organizations são a estrutura base do sistema, mas o fluxo de autenticação precisa funcionar primeiro. Sem a organization configurada, o usuário não pode usar a aplicação completa.

**Independent Test**: Pode ser testada fazendo login com um usuário novo (sem organization) e verificando que o formulário de criação de organization é exibido antes de acessar o dashboard.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado sem organization, **When** acessa a área protegida, **Then** é redirecionado para o formulário de criação de organization
2. **Given** um usuário no formulário de criação de organization, **When** preenche o nome da organization e submete, **Then** a organization é criada e o usuário é redirecionado para o dashboard
3. **Given** um usuário no formulário de criação de organization, **When** tenta acessar qualquer rota protegida diretamente, **Then** é redirecionado de volta ao formulário de organization
4. **Given** um usuário que já possui organization, **When** faz login, **Then** é redirecionado diretamente para o dashboard (sem passar pelo formulário)

---

### User Story 5 - Área Protegida (Dashboard) (Priority: P2)

Após autenticação e com organization definida, o usuário acessa uma área protegida (dashboard) que exibe informações básicas do usuário e da organization, além da opção de logout.

**Why this priority**: O dashboard é o destino final do fluxo de login. Precisa existir para validar que a autenticação e organization funcionam corretamente.

**Independent Test**: Pode ser testada fazendo login com um usuário que já possui organization e verificando que o dashboard exibe dados corretos e permite logout.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado com organization, **When** acessa o dashboard, **Then** vê o nome da organization e seu email
2. **Given** um usuário autenticado no dashboard, **When** clica em "Sair", **Then** a sessão é encerrada e é redirecionado para a landing page
3. **Given** um usuário não autenticado, **When** tenta acessar qualquer rota protegida, **Then** é redirecionado para a página de login

---

### Edge Cases

- O que acontece quando o usuário clica no magic link em um dispositivo/navegador diferente do que solicitou? O link deve funcionar normalmente, autenticando no novo dispositivo.
- O que acontece quando o usuário solicita múltiplos magic links em sequência? Apenas o link mais recente deve ser válido; os anteriores são invalidados.
- O que acontece se o serviço de email (SendGrid) estiver indisponível? O sistema exibe mensagem de erro genérica pedindo para tentar novamente em alguns minutos.
- O que acontece quando o usuário tenta acessar o formulário de organization já tendo uma? É redirecionado para o dashboard.
- O que acontece quando o nome da organization está em branco? Validação impede o envio do formulário com campo obrigatório vazio.
- O que acontece quando um email excede o limite de solicitações de magic link? O sistema exibe mensagem informando que muitas tentativas foram feitas e pede para aguardar antes de tentar novamente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema DEVE permitir que visitantes se cadastrem informando apenas o email
- **FR-002**: Sistema DEVE enviar magic links por email para autenticação
- **FR-003**: Sistema DEVE autenticar o usuário automaticamente ao clicar no magic link válido
- **FR-004**: Magic links DEVEM expirar após 15 minutos
- **FR-005**: Sistema DEVE invalidar magic links anteriores quando um novo é solicitado para o mesmo email
- **FR-006**: Sistema NÃO DEVE revelar se um email está ou não cadastrado (proteção contra enumeração)
- **FR-007**: Sistema DEVE redirecionar usuários autenticados sem organization para o formulário de criação
- **FR-008**: Sistema DEVE permitir criação de organization com pelo menos o campo nome
- **FR-009**: Sistema DEVE proteger todas as rotas da área interna, redirecionando usuários não autenticados para login
- **FR-010**: Sistema DEVE manter a sessão do usuário ativa após autenticação, com duração de 7 dias antes de expirar
- **FR-011**: Sistema DEVE permitir que o usuário encerre sua sessão (logout)
- **FR-012**: Landing page DEVE apresentar CTAs claros para cadastro e login
- **FR-013**: Sistema DEVE validar formato de email antes de enviar o magic link
- **FR-014**: Sistema DEVE exibir feedback visual durante o envio do magic link (loading state)
- **FR-015**: Sistema DEVE limitar solicitações de magic link a 5 por hora por email (rate limiting contra abuso)

### Key Entities

- **User**: Representa um usuário da aplicação. Atributos principais: email (único), nome (opcional). Relaciona-se com uma Organization.
- **Organization**: Representa a organização/empresa do usuário. Atributos principais: identificador único interno, nome (não precisa ser único, nomes duplicados são permitidos). Relaciona-se com um ou mais Users.
- **Session**: Representa a sessão ativa de um usuário autenticado. Gerenciada pelo sistema de autenticação.
- **Verification Token**: Representa o magic link gerado para autenticação. Atributos: token, email associado, data de expiração, status (usado/não usado).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários conseguem completar o fluxo de cadastro (email → magic link → autenticado) em menos de 3 minutos
- **SC-002**: 95% dos magic links são entregues na caixa de entrada do usuário em até 30 segundos
- **SC-003**: Usuários conseguem criar uma organization em menos de 1 minuto após o primeiro login
- **SC-004**: 100% das tentativas de acesso a rotas protegidas por usuários não autenticados resultam em redirecionamento para login
- **SC-005**: Landing page carrega completamente em menos de 3 segundos na primeira visita
- **SC-006**: 90% dos novos usuários completam todo o fluxo (cadastro → magic link → organization → dashboard) sem abandonar

## Clarifications

### Session 2026-02-27

- Q: Quantas solicitações de magic link um mesmo email pode fazer por hora? → A: 5 por hora
- Q: Quanto tempo a sessão do usuário deve durar antes de expirar? → A: 7 dias
- Q: O nome da organization deve ser único no sistema? → A: Não, nomes duplicados são permitidos (ID interno como chave única)

## Assumptions

- O usuário possui acesso a um email funcional para receber o magic link
- O formulário de organization é simples no momento (apenas nome), podendo ser expandido no futuro
- Não há necessidade de autenticação por senha, social login ou 2FA nesta fase
- Um usuário pertence a exatamente uma organization nesta fase inicial
- A landing page será a página raiz (/) da aplicação
- O signup e signin terão formulários visuais distintos, mas o fluxo técnico (envio de magic link) é o mesmo
