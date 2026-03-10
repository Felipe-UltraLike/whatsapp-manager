# WhatsApp Manager

Sistema de gestão de instâncias WhatsApp com integração uaZapi.

## 🚀 Funcionalidades

- **Autenticação Fechada**: Sistema de login sem registro público
- **RBAC**: Controle de acesso com 3 níveis (SUPER_ADMIN, ADMIN, USER)
- **Gestão de Empresas**: Cadastro e gerenciamento de empresas com limite de instâncias
- **Gestão de Usuários**: Cadastro de usuários vinculados a empresas
- **Gestão de Instâncias WhatsApp**: Criação e gerenciamento de instâncias
- **QRCode**: Geração de QRCode para conexão com WhatsApp via uaZapi
- **Validação de Limites**: Verificação automática do limite de instâncias por empresa

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React, TypeScript, shadcn/ui
- **Backend**: Next.js API Routes
- **Banco de Dados**: SQLite com Prisma ORM
- **Autenticação**: JWT + bcryptjs
- **Estado**: React Query

## 📋 Pré-requisitos

- Node.js 18+
- Bun ou npm

## 🔧 Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd whatsapp-manager

# Instale as dependências
bun install

# Configure o banco de dados
cp .env.example .env
bunx prisma db push

# Execute o seed para criar usuários iniciais
bunx prisma db seed

# Inicie o servidor
bun run dev
```

## 👤 Usuários Padrão

| Email | Senha | Função |
|-------|-------|--------|
| admin@system.com | admin123 | SUPER_ADMIN |
| admin@empresa.com | admin123 | ADMIN |
| user@empresa.com | user123 | USER |

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Autenticação NextAuth
│   │   ├── empresas/      # CRUD de empresas
│   │   ├── usuarios/      # CRUD de usuários
│   │   ├── instancias/    # CRUD de instâncias
│   │   └── login/         # API de login
│   ├── dashboard/         # Página do dashboard
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de login
├── components/
│   └── ui/                # Componentes shadcn/ui
├── lib/
│   ├── auth.ts            # Configuração NextAuth
│   ├── db.ts              # Prisma client
│   └── uazapi.ts          # Integração uaZapi
└── prisma/
    └── schema.prisma      # Schema do banco de dados
```

## 🔐 Níveis de Acesso

### SUPER_ADMIN
- Gerenciar empresas
- Gerenciar usuários
- Gerenciar instâncias de qualquer empresa

### ADMIN
- Gerenciar instâncias da própria empresa

### USER
- Visualizar instâncias da própria empresa

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=file:./db/whatsapp.db
JWT_SECRET=sua-chave-secreta-jwt
NEXTAUTH_SECRET=sua-chave-secreta-nextauth
NEXTAUTH_URL=http://localhost:3000

# Configuração uaZapi
UAZAPI_SERVER=https://nexus-ultra.uazapi.com
UAZAPI_TOKEN=seu-token-uazapi
```

## 📱 Integração uaZapi

O sistema integra com a API uaZapi para:
- Criar instâncias WhatsApp
- Gerar QRCode para conexão
- Verificar status de conexão
- Obter número de telefone conectado

### Formato de Telefone
O número de telefone deve seguir o formato: `DDI+DDD+Numero@s.whatsapp.net`

Exemplo: `5511999998888@s.whatsapp.net`

## 📄 Licença

Este projeto está sob a licença MIT.
