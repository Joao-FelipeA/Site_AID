# Projeto AID

Sistema de gestão do **Projeto AID** (Apoio à Inclusão Digital): controle de
presença de alunos por QR code, matrícula automática por dia da semana com
capacidade limitada, e gestão de doações de equipamentos.

## Visão geral

- **Usuários** não se auto-cadastram: entram por importação de uma
  planilha pública do Google Sheets. Senha padrão = 3 primeiras letras do
  nome + `@` + 4 últimos dígitos do RGM. No primeiro login (ou depois de
  um reset), o sistema força a troca de senha.
- **Cada aluno fica matriculado em 1 dia da semana** (Segunda a Sexta),
  escolhido a partir de 2 opções que ele pediu na planilha: tenta a 1ª
  opção, depois a 2ª, e se as duas estiverem cheias (máx. 11 alunos/dia)
  realoca automaticamente pro dia com mais vaga.
- **Presença via QR code**: cada aula gerada tem um QR code único; o aluno
  escaneia e confirma presença. Ao finalizar a aula, o sistema calcula
  quem veio e quem faltou, soma a frequência dos presentes, e sincroniza
  uma planilha de frequência (célula verde/vermelha por dia).
- **Doações**: qualquer pessoa registra uma doação (nome, contato,
  materiais) sem precisar de conta. Cada material vira um registro
  próprio. Toda alteração sincroniza uma planilha de doações.
- **Administradores** podem criar/editar/remover usuários, importar a
  planilha (substitui todos os alunos pelos da planilha), gerenciar
  aulas/QR codes/finalização, e gerenciar doações.

## Arquitetura

```
Projeto_AID/
├── backend/    API REST (Express + TypeScript + Prisma + PostgreSQL)
└── frontend/   SPA (React + TypeScript + Vite + React Router)
```

| Camada | Stack |
| --- | --- |
| Backend | Express, TypeScript, Prisma ORM, PostgreSQL (Supabase), JWT, Zod, googleapis |
| Frontend | React, TypeScript, Vite, React Router, Tailwind CSS v4 |

Documentação detalhada de cada parte: [backend/README.md](backend/README.md)
e [frontend/README.md](frontend/README.md).

## Rodando o projeto

Precisa de dois processos rodando ao mesmo tempo (backend na porta 3000,
frontend na porta 5500).

```bash
# Backend
cd backend
npm install
cp .env.example .env
# preencha DATABASE_URL/DIRECT_URL, JWT_SECRET etc. no .env
npx prisma migrate deploy
npm run prisma:seed     # cria o primeiro admin
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5500`. Login do admin criado pelo seed:
`admin@cs.unipe.edu.br` / `admin@0000` (troque assim que possível).

## Banco de dados

Funciona com qualquer PostgreSQL (local ou [Supabase](https://supabase.com)).
No Supabase, o Prisma Migrate precisa da **conexão direta** (porta 5432),
não do pooler (porta 6543) — por isso o schema usa `DIRECT_URL` separado
de `DATABASE_URL`. Veja `backend/.env.example` para o formato de cada uma.

## Modelo de dados

| Tabela | Descrição |
| --- | --- |
| `usuario` | Alunos e admins. Guarda as 2 opções de dia pedidas, o dia final atribuído e a origem (1ª opção / 2ª opção / realocado) |
| `aula` | Uma sessão de aula numa data específica, com QR code próprio |
| `presenca` | Registro de quem confirmou presença em qual aula |
| `doacao` | Dados do doador |
| `material_doado` | Cada item doado, vinculado a uma doação |

## Planilhas do Google Sheets

- **Importar alunos**: lê uma planilha **pública** direto (export CSV),
  sem credencial nenhuma — o admin cola o ID/link no painel. Colunas:
  `Nome | Email | RGM | Dia1 | Dia2`.
- **Exportar doações/frequência**: planilhas privadas, escritas pelo
  sistema via conta de serviço do Google (credenciais em `.env`,
  opcional — o app funciona sem isso, só não sincroniza essas planilhas).

Detalhes em [backend/README.md](backend/README.md#google-sheets).
