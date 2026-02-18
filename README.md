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
