# LifeHub Backend
Plugin-based personal life management platform built with Python FastAPI.

## Development

```bash
# Install dependencies
poetry install

# Run migrations
cd lifehub-backend
poetry run alembic upgrade head

# Start server
poetry run uvicorn app.main:app --reload
```
