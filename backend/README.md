# Blog CMS Backend

FastAPI backend for the blog CMS MVP and early Phase 2 work.

## Environment

Copy `.env.example` to `.env` and update the values for your local PostgreSQL instance.

Required settings:

- `DATABASE_URL` for PostgreSQL connection string
- `SECRET_KEY` for JWT signing
- `CORS_ORIGINS` for the frontend origin
- `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` for the seed script

## Setup

1. Create and activate the Python environment.
2. Install dependencies from `requirements.txt`.
3. Start PostgreSQL and create the target database.
4. Run the migration path:

```bash
python -m scripts.migrate
```

5. Seed the first admin user and sample content:

```bash
python -m scripts.seed_admin
```

You can override the defaults with flags:

```bash
python -m scripts.seed_admin --username admin --email admin@example.com --password admin1234
```

## Run

Start the API with:

```bash
uvicorn app.main:app --reload
```

## Phase 2 foundation

- Articles can now be tagged with categories.
- Categories are exposed at `GET /articles/categories`.
- Admin category CRUD lives under `GET|POST|PATCH|DELETE /categories/admin...`.
- Public and admin article queries include categories in their payloads.
- `GET /articles?search=...` keeps text search on the backend.
- The migration path uses Alembic instead of `create_all` on startup.
- Check migration status with `python -m scripts.migration_status`.