# Projeto AID - Frontend

SPA em React + TypeScript + Vite + React Router, visual "cyber-HUD" (tema
custom via Tailwind v4). Consome a API do [backend](../backend) via
fetch + JWT.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5500`. Garanta que:

- O backend esteja rodando (`npm run dev` em `backend/`). A URL da API
  fica em `src/lib/api.ts` (`API_BASE_URL`, com fallback pra
  `http://localhost:3000`) - pode sobrescrever criando um `.env` com
  `VITE_API_BASE_URL=...`.
- A variavel `FRONTEND_URL` do backend aponte pra essa mesma URL
  (`http://localhost:5500` por padrao), pois e ela que fica embutida no
  link do QR code de presenca.

## Build de producao

```bash
npm run build     # gera dist/
npm run preview   # serve o build de producao localmente (porta 5500)
```

O Vite ja cuida do fallback de SPA (todas as rotas servem `index.html`)
tanto no dev server quanto no preview - nao precisa de config extra tipo
`serve.json`.

## Rotas

| Rota | Descricao |
| --- | --- |
| `/login` | Login (email academico + senha) |
| `/trocar-senha` | Forcado no primeiro login / senha redefinida por admin |
| `/dashboard` | Painel do aluno: dia de aula, frequencia |
| `/presenca-confirmar?aula=&token=` | Aberta ao escanear o QR code da aula |
| `/presenca-confirmar-robotica?aula=&token=` | Aberta ao escanear o QR code da aula de robotica |
| `/doacao` | Registrar doacao (doador + materiais) - acesso publico, sem login |
| `/admin` | Painel admin: usuarios, aulas, robotica, doacoes |
| `/quem-somos`, `/fale-conosco` | Paginas institucionais estaticas |

## Estrutura

- `src/lib/api.ts` - cliente fetch tipado com JWT + tratamento de erro
- `src/lib/auth.tsx` - `AuthContext`/`useAuth`, sessao em localStorage
- `src/lib/types.ts` - tipos dos dados retornados pelo backend
- `src/lib/diasSemana.ts` - labels dos dias da semana (espelha o backend)
- `src/lib/horarioRobotica.ts` - labels dos horarios de robotica + helper
  pra data da proxima sexta (espelha o backend)
- `src/components/` - `Header`, `Layout`, `Modal`, `Banner`, `HudContainer`,
  `SelectDiaSemana`, `SelectHorarioRobotica`, `RouteGuards`
  (`ProtectedRoute`/`AdminRoute`)
- `src/pages/` - uma pasta/arquivo por rota; `pages/admin/` tem as 4 abas
  do painel (`UsuariosTab`, `AulasTab`, `AulaRoboticaTab`, `DoacoesTab`)

## Logo

`public/assets/logo-aid.png` substitui o badge de texto "AID" no
cabeçalho (`Header.tsx`).
