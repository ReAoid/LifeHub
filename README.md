# LifeHub

> 插件化个人生活管理中台 · Python FastAPI + React

A plug-and-play modular personal data management system. The core focuses on generic infrastructure, while business functions exist as independent plugins that can be enabled on demand.

## Architecture

```
LifeHub/
├── lifehub-backend/     # Python FastAPI backend
├── lifehub-web/         # React frontend
├── docker/              # Docker Compose deployment
└── docs/                # Documentation
```

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16
- Redis 7
- Poetry

### Backend

```bash
cd lifehub-backend
poetry install
cp .env.example .env  # Edit as needed
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```

### Frontend

```bash
cd lifehub-web
npm install
npm run dev
```

### Docker

```bash
docker-compose -f docker/docker-compose.yml up -d
```

## License

MIT
