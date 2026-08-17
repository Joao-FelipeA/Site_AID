# Projeto AID - Backend

API em TypeScript + Express + Prisma (PostgreSQL) para gestao de usuarios,
aulas/presenca (via QR code) e doacoes, com sincronizacao de planilhas no
Google Sheets.

## Stack

- Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT para autenticacao
- Google Sheets API (googleapis) para importacao de alunos e exportacao de
  doacoes/frequencia
- zod para validacao de entrada

## Setup

```bash
npm install
cp .env.example .env
# preencha DATABASE_URL, JWT_SECRET e as credenciais do Google Sheets no .env
npx prisma migrate dev --name init
npm run prisma:seed   # cria o primeiro administrador
npm run dev
```

O seed cria um admin padrao (`admin@cs.unipe.edu.br` / `admin@0000`, ou os
valores de `SEED_ADMIN_EMAIL`/`SEED_ADMIN_SENHA` se definidos). Troque a
senha assim que possivel via `PUT /usuarios/:uuid`.

## Google Sheets

Duas coisas separadas:

**Importar alunos** (`POST /usuarios/importar`) le uma planilha **publica**
direto (export CSV do Google Sheets), sem credencial nenhuma. O admin cola
o ID ou o link da planilha no painel a cada importacao. A planilha precisa
estar compartilhada como "Qualquer pessoa com o link" (Leitor). Colunas:
`Nome | Email | RGM | Dia1 | Dia2` a partir da linha 2 (`Dia1`/`Dia2`
aceitam texto livre como "Segunda-Feira", "terca", "QUI" etc. e sao as
duas opcoes de dia do aluno, nao os dias finais - ver regra abaixo).

**Exportar doacoes/frequencia** (planilhas privadas, escritas pelo sistema)
precisam de uma conta de servico:
1. Crie um projeto no Google Cloud, ative a Google Sheets API e crie uma
   conta de servico. Baixe a chave JSON.
2. Preencha `GOOGLE_CLIENT_EMAIL` e `GOOGLE_PRIVATE_KEY` no `.env` com os
   dados dessa chave.
3. Compartilhe as planilhas de doacoes e frequencia com o email da conta
   de servico, dando permissao de Editor.
4. Preencha `GOOGLE_SHEET_DOACOES_ID` e `GOOGLE_SHEET_FREQUENCIA_ID` com o
   ID de cada planilha (trecho da URL entre `/d/` e `/edit`).

## Regras de negocio implementadas

- **Sem auto-cadastro**: usuarios comuns entram via importacao de uma
  planilha publica (`POST /usuarios/importar`, admin). Email = coluna
  Email (validado contra `EMAIL_DOMINIO`), senha padrao = 3 primeiras
  letras do nome + `@` + 4 ultimos digitos do RGM (hash bcrypt). Cada
  importacao **substitui todos os alunos**: apaga todos os usuarios
  nao-admin e cria de novo a partir da planilha (idempotente por design -
  reflete sempre o estado atual da planilha, nao acumula).
- **Capacidade por dia, 1 dia final por aluno**: cada dia util (Seg-Sex)
  comporta no maximo `CAPACIDADE_MAXIMA_POR_DIA` (padrao 11) alunos. Cada
  aluno pede 2 opcoes de dia na planilha (Dia1, Dia2) mas fica matriculado
  em UM UNICO dia final: tenta a 1a opcao, senao a 2a, senao realoca pra
  qualquer outro dia com vaga. O resultado da importacao traz um
  relatorio opcoes-pedidas-vs-dia-final por aluno
  (`src/services/alocacaoDias.ts`).
- **QR code por aula**: `POST /aulas` cria uma aula para uma data
  especifica (o dia da semana e derivado da data). `GET /aulas/:uuid/qrcode`
  retorna o QR code (PNG base64) que os alunos escaneiam para chamar
  `POST /aulas/:uuid/presenca`. `POST /aulas/:uuid/finalizar` fecha a aula,
  calcula quem compareceu/faltou, soma a frequencia dos presentes e
  sincroniza a planilha de frequencia: celula do dia verde = presente,
  vermelha = faltou, em branco = aluno nao tem aula naquele dia; celula
  do nome verde = 0 faltas acumuladas, amarela = 1-2 faltas, vermelha =
  3+ faltas.
- **Doacoes**: `POST /doacoes` e publico (o doador nao tem conta no
  sistema) e cria o doador junto com a lista de materiais doados (cada
  material com UUID proprio na tabela `MaterialDoado`). Gerenciar doacoes
  ja registradas (listar, editar, remover, adicionar/remover material)
  exige login. Toda alteracao sincroniza a planilha de doacoes (Nome,
  Contato, materiais concatenados).
- **Administradores**: todo `POST/PUT/DELETE` em `/usuarios` exige
  `e_admin = true` no token. Admins podem criar contas comuns ou admin e
  editar qualquer usuario.

## Endpoints principais

| Metodo | Rota | Acesso | Descricao |
| --- | --- | --- | --- |
| POST | /auth/login | publico | login (email + senha) -> JWT |
| GET | /usuarios/me | autenticado | perfil proprio |
| GET/POST | /usuarios | admin | listar / criar usuario |
| GET/PUT/DELETE | /usuarios/:uuid | admin | detalhe / editar / remover |
| PUT | /usuarios/:uuid/dias-aula | admin | trocar o dia de aula do aluno (recebe as 2 opcoes) |
| POST | /usuarios/importar | admin | substitui todos os alunos pelos da planilha publica (`spreadsheetIdOuUrl`) |
| GET/POST | /aulas | autenticado / admin | listar / criar aula |
| GET/PUT/DELETE | /aulas/:uuid | autenticado / admin | detalhe / editar / remover |
| GET | /aulas/:uuid/qrcode | admin | gerar QR code da aula |
| POST | /aulas/:uuid/presenca | autenticado | aluno marca presenca via QR |
| POST | /aulas/:uuid/finalizar | admin | fecha a aula e sincroniza frequencia |
| POST | /aulas/sincronizar-frequencia | admin | forca resincronizar a planilha de frequencia sem finalizar aula |
| POST | /doacoes | publico | criar doacao + materiais (sem login) |
| GET | /doacoes | autenticado | listar doacoes |
| GET/PUT/DELETE | /doacoes/:uuid | autenticado | detalhe / editar / remover |
| POST/DELETE | /doacoes/:uuid/materiais(/:materialUuid) | autenticado | gerenciar materiais |

## Scripts

- `npm run dev` - servidor com hot-reload
- `npm run build` / `npm start` - build de producao
- `npm run typecheck` - checagem de tipos
- `npm run prisma:studio` - explorar o banco
- `npm run prisma:migrate` - criar/aplicar migrations
