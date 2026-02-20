# BioFit

Aplicacao focada em nutricionistas e personal trainers, com:

- Dashboard com indicadores principais
- Area de pacientes (cadastro, edicao e remocao)
- Sessao de base de alimentos e calorias (cadastro, edicao e remocao)

## Stack

- Backend: Node.js + Express
- Frontend: React + Vite
- Banco de dados: PostgreSQL (Neon)

## Como rodar

1. Instalar dependencias na raiz:

```bash
npm install
```

2. Configurar ambiente do backend:

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` e preencha `DATABASE_URL` com a string de conexao do Neon.
Tambem defina `JWT_SECRET` para assinar os tokens de login.

3. Rodar backend + frontend juntos:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend/API: `http://localhost:3001`

## Deploy no GitHub Pages

GitHub Pages publica apenas o frontend estatico. O backend precisa estar publicado separadamente.

1. Publique o backend (Render, Railway, Fly.io, etc.) e garanta uma URL publica, por exemplo:
   - `https://seu-backend.com/api`
2. No repositorio do GitHub, configure a variavel:
   - `Settings > Secrets and variables > Actions > Variables`
   - Nome: `VITE_API_URL`
   - Valor: URL publica da API (com `/api`)
3. Execute o workflow de deploy do Pages novamente.

Sem `VITE_API_URL`, o deploy de frontend agora falha para evitar publicar uma versao quebrada.

## Autenticacao

- O login agora valida usuario no PostgreSQL (Neon).
- Cadastro por tela esta desabilitado.
- Acesso via email + senha em `Entrar`.
- Dashboard, pacientes e alimentos sao filtrados por usuario autenticado.

## Endpoints principais

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard/summary`
- `GET /api/consultations?date=YYYY-MM-DD`
- `GET /api/consultations/calendar?month=YYYY-MM`
- `POST /api/consultations`
- `GET /api/patients`
- `POST /api/patients`
- `PUT /api/patients/:id`
- `DELETE /api/patients/:id`
- `GET /api/foods`
- `POST /api/foods`
- `PUT /api/foods/:id`
- `DELETE /api/foods/:id`

## Estrutura de alimento

Ao criar/editar alimentos, envie:

- `name`
- `measurementBasis` (`100g`, `100ml` ou `unidade`)
- `calories`
- `protein`
- `carbs`
- `fat`
- `fiber`

Na tela de alimentos existem dois atalhos:

- `Baixar planilha modelo` (CSV)
- `Importar alimentos em massa` (CSV com os campos acima)
