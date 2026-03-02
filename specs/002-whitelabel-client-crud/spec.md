# Feature Specification: Whitelabel Organization & Client CRUD

**Feature Branch**: `002-whitelabel-client-crud`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User description: "CRUD de clientes com organização whitelabel (cores, logo), convite de cliente via magic link, portal do cliente com branding da organização"

## Clarifications

### Session 2026-03-02

- Q: Qual a estrutura de URL do portal do cliente? (path-based, subdomínio, ou path simples) → A: Path-based `/portal/[org-slug]`
- Q: Remoção de clientes é hard delete ou soft delete? → A: Soft delete com campo `deletedAt` (dados preservados, ocultos das listagens)
- Q: Qual a duração da sessão do cliente no portal após autenticação? → A: 7 dias
- Clarificação direta: Após o primeiro acesso via convite, o cliente pode solicitar novo magic link por conta própria (sem precisar de novo convite da clínica). Cada organização tem sua própria tela de login (`/portal/[org-slug]/login`). Cliente com múltiplas organizações acessa cada uma pela URL específica
- Q: Tela de login do portal é genérica ou por organização? → A: Por organização em `/portal/[org-slug]/login` (cada org tem seu login independente, sem seletor centralizado)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Personalização da Organização (Priority: P1)

Administrador acessa as configurações da organização e personaliza a identidade visual: faz upload de logo, define cor primária e cor de destaque. Ao salvar, o dashboard e todo o sistema passam a refletir as cores e logo da organização. Caso não personalize, o sistema usa os valores padrão do ClinTrek.

**Why this priority**: Base para todo o whitelabel. Sem a personalização da organização, nenhuma funcionalidade de branding do cliente funciona. Também melhora imediatamente a experiência do admin ao acessar o dashboard.

**Independent Test**: Acessar configurações da organização, fazer upload de logo e definir cores. Verificar que o dashboard exibe o logo e as cores definidas. Sair e entrar novamente para confirmar persistência.

**Acceptance Scenarios**:

1. **Given** admin autenticado com organização ativa, **When** acessa configurações da organização, **Then** vê formulário com campos para logo, cor primária e cor de destaque, com os valores atuais preenchidos (ou padrão).
2. **Given** admin no formulário de configuração, **When** faz upload de um logo (imagem PNG/JPG, máx 2MB) e define cores, **Then** as alterações são salvas e o dashboard imediatamente reflete o novo branding.
3. **Given** admin no formulário de configuração, **When** tenta fazer upload de arquivo inválido (>2MB ou formato não suportado), **Then** vê mensagem de erro explicativa.
4. **Given** organização sem personalização, **When** qualquer usuário acessa o dashboard, **Then** o sistema exibe a identidade visual padrão do ClinTrek.
5. **Given** admin na tela de criação de organização (onboarding), **When** cria a organização, **Then** pode opcionalmente definir logo e cores já nesta etapa.

---

### User Story 2 - Dashboard com Branding da Organização (Priority: P1)

Ao acessar o dashboard, o administrador vê a identidade visual da sua organização: logo no header, cores primária e de destaque aplicadas nos elementos de interface (header, botões, links). A experiência é visualmente coerente com a marca da organização.

**Why this priority**: Entrega valor imediato ao admin e é pré-requisito visual para o portal do cliente. Se o dashboard já funciona com branding, a extensão para o portal do cliente é incremental.

**Independent Test**: Configurar branding de uma organização, acessar o dashboard e verificar que logo, cor primária e cor de destaque estão aplicados nos elementos visuais corretos.

**Acceptance Scenarios**:

1. **Given** organização com logo e cores configuradas, **When** admin acessa o dashboard, **Then** o header exibe o logo da organização e os elementos de UI usam as cores definidas.
2. **Given** organização sem branding customizado, **When** admin acessa o dashboard, **Then** o dashboard usa a identidade visual padrão do ClinTrek.
3. **Given** admin troca as cores da organização, **When** recarrega o dashboard, **Then** as novas cores são aplicadas imediatamente.

---

### User Story 3 - Cadastro de Clientes (CRUD) (Priority: P1)

Administrador gerencia clientes da organização: pode listar, criar, editar e remover clientes. Cada cliente tem nome, email, telefone e observações. A lista de clientes exibe os dados em formato de tabela com busca e paginação básica. O admin pode ver detalhes de um cliente individual.

**Why this priority**: Funcionalidade core do sistema. CRUD de clientes é o pilar de uma aplicação de gestão clínica. Sem clientes cadastrados, o convite e o portal não fazem sentido.

**Independent Test**: Acessar a lista de clientes (vazia), criar um novo cliente com nome e email, verificar que aparece na lista. Editar o cliente, confirmar alteração. Remover o cliente, confirmar remoção.

**Acceptance Scenarios**:

1. **Given** admin autenticado no dashboard, **When** acessa a seção de clientes, **Then** vê lista de clientes da organização (vazia se nenhum cadastrado) com opção de criar novo.
2. **Given** admin na lista de clientes, **When** clica em "Novo cliente" e preenche nome e email (obrigatórios), telefone e observações (opcionais), **Then** o cliente é criado e aparece na lista.
3. **Given** admin na lista de clientes, **When** clica em um cliente existente, **Then** vê a página de detalhes do cliente com todos os dados e opções de editar e remover.
4. **Given** admin na página de detalhes, **When** edita os dados e salva, **Then** as alterações são persistidas e refletidas na lista.
5. **Given** admin na página de detalhes, **When** clica em remover e confirma, **Then** o cliente é removido da lista.
6. **Given** admin na lista de clientes com vários registros, **When** digita no campo de busca, **Then** a lista filtra por nome ou email do cliente.
7. **Given** admin tenta criar cliente com email já existente na mesma organização, **When** submete o formulário, **Then** vê mensagem de erro indicando email duplicado.

---

### User Story 4 - Convite de Cliente via Magic Link (Priority: P2)

Administrador pode convidar um cliente cadastrado para acessar o portal do cliente. Ao convidar, o sistema envia um email com magic link personalizado com a identidade visual da organização. O cliente clica no link e é autenticado automaticamente no portal da organização que o convidou.

**Why this priority**: Expande significativamente o valor do sistema ao permitir que clientes acessem informações por conta própria. Depende do CRUD de clientes (US3) e do branding (US1/US2).

**Independent Test**: Cadastrar um cliente, clicar em "Convidar", verificar que email é enviado com branding da organização. Clicar no magic link e confirmar que o cliente é direcionado ao portal com a identidade visual da organização.

**Acceptance Scenarios**:

1. **Given** admin na página de detalhes de um cliente, **When** clica em "Convidar para o portal", **Then** o sistema envia um email ao cliente com magic link e branding da organização.
2. **Given** email de convite enviado, **When** o cliente clica no magic link dentro do prazo de validade (15 minutos), **Then** é autenticado automaticamente e redirecionado ao portal com branding da organização.
3. **Given** email de convite enviado, **When** o cliente clica no magic link após expiração, **Then** vê mensagem informando que o link expirou e orientação para solicitar novo convite.
4. **Given** admin na página de detalhes de um cliente já convidado, **When** visualiza o status, **Then** vê se o cliente já acessou o portal ou se o convite está pendente.
5. **Given** cliente que já acessou o portal anteriormente, **When** deseja acessar novamente, **Then** acessa `/portal/[org-slug]/login` e solicita novo magic link por conta própria (sem novo convite do admin).
6. **Given** cliente cadastrado em múltiplas organizações, **When** deseja acessar o portal de uma organização específica, **Then** acessa a URL da organização desejada (`/portal/[org-slug]/login`) e solicita magic link.

---

### User Story 5 - Portal do Cliente com Branding (Priority: P2)

Cliente autenticado via magic link acessa um portal dedicado com a identidade visual da organização que o convidou (logo, cores). O portal exibe informações básicas do cliente (nome, email) e uma mensagem de boas-vindas. O cliente pode fazer logout.

**Why this priority**: Completa o fluxo de valor do convite. Sem o portal, o convite não tem destino. É a experiência do cliente final.

**Independent Test**: Acessar o portal via magic link de convite, verificar que exibe logo e cores da organização, nome do cliente, e botão de logout funcional.

**Acceptance Scenarios**:

1. **Given** cliente autenticado via magic link, **When** acessa o portal, **Then** vê a identidade visual da organização (logo, cores) e seus dados básicos (nome, email).
2. **Given** cliente no portal, **When** clica em "Sair", **Then** é desautenticado e redirecionado para uma página de confirmação.
3. **Given** visitante sem autenticação, **When** tenta acessar o portal diretamente, **Then** é redirecionado para a tela de login do portal onde pode informar seu email e solicitar um magic link por conta própria.
4. **Given** cliente autenticado, **When** o portal carrega, **Then** a página exibe em menos de 3 segundos com branding correto.

---

### User Story 6 - Atualização do Onboarding de Organização (Priority: P3)

O formulário de criação de organização (onboarding pós-primeiro login) é expandido para incluir, além do nome, campos opcionais para logo, cor primária e cor de destaque. O administrador pode configurar o branding já na criação.

**Why this priority**: Melhoria de experiência, mas não bloqueia funcionalidade. O admin pode sempre configurar o branding depois nas configurações.

**Independent Test**: Fazer login como novo usuário, verificar que o onboarding agora inclui campos de branding opcionais. Criar organização com e sem branding, confirmar que ambos os fluxos funcionam.

**Acceptance Scenarios**:

1. **Given** usuário novo no onboarding, **When** vê o formulário de criação de organização, **Then** campos de logo, cor primária e cor de destaque estão disponíveis (opcionais).
2. **Given** usuário novo no onboarding, **When** cria organização apenas com nome (sem branding), **Then** a organização é criada com branding padrão.
3. **Given** usuário novo no onboarding, **When** cria organização com nome, logo e cores, **Then** a organização é criada com branding customizado e o dashboard já reflete.

---

### Edge Cases

- O que acontece se o admin faz upload de um logo com dimensões muito grandes? O sistema aceita a imagem e a exibe conforme enviada, limitando apenas o tamanho do arquivo (máx 2MB) e formato (PNG, JPG, SVG). O front-end exibe com tamanho fixo via CSS.
- O que acontece se o cliente foi removido (US3) mas ainda tem sessão ativa no portal? A sessão do cliente é invalidada ao remover. No próximo acesso, é redirecionado com mensagem de que o acesso não está mais disponível.
- O que acontece se dois admins editam o mesmo cliente simultaneamente? O último a salvar prevalece (last-write-wins). Conflitos de edição simultânea estão fora do escopo desta fase.
- O que acontece se as cores configuradas não atendem WCAG AA de contraste? O sistema exibe as cores conforme configuradas pelo admin. Não valida contraste WCAG nesta fase.
- O que acontece se o email de convite falha no envio? O sistema exibe mensagem de erro ao admin e permite reenviar o convite.
- O que acontece se um cliente tenta solicitar magic link com email que não está cadastrado em nenhuma organização? O sistema exibe mensagem genérica ("Se este email estiver cadastrado, você receberá um link de acesso") para não revelar se o email existe no sistema.
- O que acontece se um cliente foi removido (soft delete) de uma organização e tenta solicitar magic link nessa org? O sistema não envia magic link e exibe mensagem genérica ("Se este email estiver cadastrado, você receberá um link de acesso").

## Requirements *(mandatory)*

### Functional Requirements

**Organização & Branding**
- **FR-001**: Sistema DEVE permitir que o admin faça upload de logo da organização (PNG, JPG ou SVG, máx 2MB)
- **FR-002**: Sistema DEVE permitir que o admin defina cor primária e cor de destaque da organização via seletor de cores (formato hexadecimal)
- **FR-003**: Sistema DEVE aplicar o branding da organização (logo, cores) em todo o dashboard quando configurado
- **FR-004**: Sistema DEVE usar identidade visual padrão do ClinTrek quando a organização não tem branding customizado
- **FR-005**: Sistema DEVE armazenar o logo como URL (upload para storage) e as cores como valores hexadecimais

**CRUD de Clientes**
- **FR-006**: Admin DEVE poder listar todos os clientes da sua organização em formato de tabela
- **FR-007**: Admin DEVE poder criar um cliente informando nome e email (obrigatórios), telefone e observações (opcionais)
- **FR-008**: Admin DEVE poder visualizar todos os dados de um cliente individual
- **FR-009**: Admin DEVE poder editar os dados de um cliente existente
- **FR-010**: Admin DEVE poder remover um cliente com confirmação prévia (soft delete — cliente marcado com `deletedAt`, dados preservados mas ocultos das listagens)
- **FR-011**: Sistema DEVE impedir criação de cliente com email duplicado na mesma organização
- **FR-012**: Admin DEVE poder filtrar clientes por nome ou email na lista
- **FR-013**: Clientes são isolados por organização — um admin só vê clientes da sua própria organização

**Convite de Cliente**
- **FR-014**: Admin DEVE poder convidar um cliente cadastrado para o portal, gerando envio de email com magic link
- **FR-015**: Email de convite DEVE conter branding da organização (logo, cores, nome)
- **FR-016**: Magic link de convite DEVE expirar em 15 minutos
- **FR-017**: Sistema DEVE registrar status do convite (pendente, aceito) e exibi-lo na página de detalhes do cliente
- **FR-018**: Cliente que já foi convidado anteriormente DEVE poder solicitar novo magic link por conta própria na tela de login da organização (`/portal/[org-slug]/login`), sem necessidade de novo convite do admin
- **FR-018a**: A tela de login do portal é por organização (`/portal/[org-slug]/login`) e exibe o branding da organização (logo, cores). O magic link gerado autentica o cliente diretamente naquela organização
- **FR-018b**: Um mesmo email de cliente pode existir em múltiplas organizações (cada registro de Client é isolado por organização). Cliente acessa cada organização pela URL específica

**Portal do Cliente**
- **FR-019**: Cliente autenticado DEVE ver portal em `/portal/[org-slug]` com branding da organização que o convidou (logo, cores)
- **FR-020**: Portal DEVE exibir dados básicos do cliente (nome, email) e mensagem de boas-vindas
- **FR-021**: Cliente DEVE poder fazer logout do portal
- **FR-022**: Acesso ao portal sem autenticação DEVE redirecionar para tela de login do portal (`/portal/[org-slug]/login`)
- **FR-023**: Remoção de um cliente DEVE invalidar suas sessões ativas no portal

**Onboarding Atualizado**
- **FR-024**: Formulário de criação de organização DEVE incluir campos opcionais para logo, cor primária e cor de destaque

### Key Entities

- **Organization (expandida)**: Adiciona logo (URL da imagem), cor primária (hex), cor de destaque (hex) aos dados existentes (nome, slug)
- **Client**: Pessoa atendida pela organização. Nome, email, telefone, observações, status do convite, `deletedAt` (soft delete). Pertence a uma organização (um mesmo email pode existir como Client em múltiplas organizações). Diferente de User — client é o "paciente" ou "cliente" da clínica
- **ClientInvitation**: Registro de convite enviado a um cliente. Contém referência ao cliente, token do magic link, status (pendente/aceito), data de envio e expiração
- **ClientSession**: Sessão do cliente no portal. Separada da sessão de admin para garantir isolamento. Duração de 7 dias após autenticação

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin consegue personalizar branding da organização (logo + cores) em menos de 2 minutos
- **SC-002**: Dashboard reflete branding da organização imediatamente após configuração
- **SC-003**: Admin consegue cadastrar um novo cliente em menos de 1 minuto
- **SC-004**: Cliente recebe email de convite em menos de 30 segundos após o admin enviar
- **SC-005**: Cliente consegue acessar o portal via magic link em menos de 3 cliques (abrir email, clicar link, portal carregado)
- **SC-006**: Portal do cliente exibe branding correto da organização em 100% dos acessos
- **SC-007**: Busca de clientes retorna resultados em menos de 1 segundo para listas de até 1000 registros
- **SC-008**: Todas as operações CRUD de clientes completam com feedback visual em menos de 2 segundos

## Assumptions

- O upload de logo será armazenado em um serviço de storage (a definir no plano técnico) — não em base64 no banco de dados
- Clientes (pacientes/atendidos) são entidades distintas de Users (administradores). Terão autenticação separada via magic link próprio
- Paginação na lista de clientes seguirá padrão de 20 itens por página
- O portal do cliente nesta fase é mínimo (dados básicos + boas-vindas). Funcionalidades avançadas no portal são escopo futuro
- As cores da organização são aplicadas via CSS custom properties (variáveis) — detalhes técnicos a definir no plano
- O campo "observações" do cliente é texto livre, sem limite prático (será definido no plano técnico)

## Scope Boundaries

**Incluído nesta feature:**
- Expansão dos dados de organização (logo, cores)
- Aplicação de branding no dashboard
- CRUD completo de clientes
- Convite de cliente via magic link
- Portal básico do cliente com branding
- Atualização do onboarding

**Excluído (escopo futuro):**
- Funcionalidades avançadas no portal do cliente (agendamentos, documentos, etc.)
- Validação de contraste WCAG nas cores da organização
- Edição de logo com crop/resize in-app
- Múltiplos temas por organização
- Convite em lote de clientes
- Permissões granulares por tipo de admin
- Notificações push para clientes
