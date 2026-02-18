# Case Oppgave - Monorepo

A full-stack application with a Next.js frontend, Python FastAPI backend, and PostgreSQL database.

## Project Structure

```
.
├── frontend/       # Next.js React application
├── backend/        # Python FastAPI CRUD API
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Docker
- Docker Compose
- Node.js (for local frontend development)
- Python 3.11+ (for local backend development)

## Quick Start with Docker

1. Build and run all services:
```bash
docker-compose up --build
```

2. Access the services:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **PostgreSQL**: localhost:5432

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`

## Database

PostgreSQL credentials:
- User: `user`
- Password: `password`
- Database: `casedb`

## Docker Compose Services

- **frontend**: Next.js application on port 3000
- **backend**: FastAPI application on port 8000
- **db**: PostgreSQL database on port 5432

## Stopping Services

```bash
docker-compose down
```

To also remove volumes:
```bash
docker-compose down -v
```

## CI/CD (GitHub Actions)

This repo includes:

- Conventional commit validation on PRs and `main` pushes
- Automated version/tag/release using `release-please`
- Azure deploy on published GitHub Releases

### Conventional Commits

Use commit messages like:

- `feat(frontend): add expense form`
- `fix(backend): validate project id`
- `chore(ci): update workflow`

Workflow: [ .github/workflows/commitlint.yml ](.github/workflows/commitlint.yml)

### Release Please (version tags + GitHub Releases)

`release-please` reads conventional commits on `main`, opens/updates a Release PR, and when merged creates tags/releases.

Important files:

- [release-please-config.json](release-please-config.json)
- [.release-please-manifest.json](.release-please-manifest.json)
- [ .github/workflows/release-please.yml ](.github/workflows/release-please.yml)

With current config, monorepo tags are component-based:

- `frontend-vX.Y.Z`
- `backend-vX.Y.Z`

### Azure Deploy (simplified for interview)

Workflow: [ .github/workflows/deploy-azure.yml ](.github/workflows/deploy-azure.yml)

On GitHub Release publish, it deploys directly to Azure Web Apps (no container registry required).

Required GitHub repository secrets:

- `AZURE_BACKEND_WEBAPP_NAME`
- `AZURE_FRONTEND_WEBAPP_NAME`
- `AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND`
- `AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND`
- `FRONTEND_PUBLIC_API_URL`

Recommended low-cost Azure resources:

- **Azure App Service Plan (B1 Linux)**
   - host both frontend and backend web apps on same B1 plan
- **Azure Database for PostgreSQL Flexible Server (Burstable B1ms)**
   - smallest storage tier practical for demo/interview

This keeps cost low while still showing production-style CI/CD and cloud deployment.

#### What you must configure in Azure

1. Create two Linux Web Apps (same App Service Plan):
   - backend app (Python 3.11)
   - frontend app (Node 20)
2. Download publish profile from each Web App and store in GitHub secrets:
   - backend -> `AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND`
   - frontend -> `AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND`
3. Set backend startup command in Azure Web App:
   - `gunicorn -w 2 -k uvicorn.workers.UvicornWorker main:app`
4. Set backend app setting:
   - `DATABASE_URL` = your Azure PostgreSQL connection string
5. Set frontend app setting:
   - `NEXT_PUBLIC_API_URL` = backend public URL (e.g. `https://<backend>.azurewebsites.net`)

#### What you must configure in GitHub

1. Add all required secrets listed above.
2. Keep using conventional commits on `main`.
3. Merge the `release-please` PR to publish a GitHub Release and trigger deploy.
