# Backend 2 Runbook: Environment, Assets, Export

This file keeps the historical name `backend-3-runbook.md`, but the current owner
scope for this branch is Backend 2: Docker startup, MinIO-backed assets, proposal
downloads, and acceptance scripts.

## Local Setup

```sh
cp .env.example .env
./scripts/check-environment.sh
docker compose up --build -d
./scripts/verify-stack.sh
```

Default local URLs:

- App gateway: `http://127.0.0.1:8080`
- API docs: `http://127.0.0.1:8000/api/docs`
- MinIO console: `http://127.0.0.1:9001`

When ports are occupied, edit `.env`:

- `GATEWAY_PORT`
- `WEB_PORT`
- `API_EXPOSE_PORT`
- `POSTGRES_EXPOSE_PORT`
- `REDIS_EXPOSE_PORT`
- `MINIO_API_PORT`
- `MINIO_CONSOLE_PORT`

Keep `API_PORT=8000` unless the API process inside the container changes.

## Verification

Required checks:

```sh
./scripts/verify-stack.sh
UV_CACHE_DIR=/private/tmp/aline-uv-cache uv run pytest tests/backend/storage tests/backend/exports
```

If time allows, run:

```sh
BRAND_STUDIO_RUN_E2E=1 UV_CACHE_DIR=/private/tmp/aline-uv-cache uv run pytest tests/e2e
```

Or let the helper start, verify, test, and stop the stack:

```sh
./scripts/run-e2e.sh
```

## Service Health

`./scripts/verify-stack.sh` expects these services:

- `postgres`
- `redis`
- `minio`
- `api`
- `worker`
- `web`
- `gateway` or `nginx`

The API ready endpoint is:

```text
GET /api/v1/health/ready
```

It returns:

```json
{
  "status": "ok",
  "dependencies": {
    "database": "ok",
    "redis": "ok",
    "object_storage": "ok"
  }
}
```

If a dependency is unavailable, it returns HTTP `503` with the same dependency
map in the response detail.

## Asset Storage

Storage code lives in `backend/infrastructure/storage/`.

Important helpers:

- `S3ArtifactStorage.from_settings(settings)`
- `FileArtifactService.store_file(request)`
- `create_asset_url_map(storage, references, expires_in_seconds=None)`
- `create_presigned_url_map(storage, references, expires_in_seconds=None)`
- `build_artifact_object_key(project_id, stage, artifact_id, filename)`
- `build_prefixed_artifact_object_key(prefix, artifact_id, filename)`
- `build_temporary_artifact_prefix(project_id, scope=None)`

Local MinIO settings come from `.env`:

- `S3_ENDPOINT_URL=http://minio:9000`
- `S3_ACCESS_KEY_ID=brand-agent-local`
- `S3_SECRET_ACCESS_KEY=brand-agent-local-secret`
- `S3_BUCKET=brand-agent-local`
- `S3_REGION=us-east-1`

Persistent business records should store artifact IDs and object metadata.
Frontend-facing payloads should receive short-lived URLs produced from those
artifact references.

## Proposal Export

Application proposal export code lives in `backend/application/exports.py`.

After a project is `COMPLETED` and has a confirmed `PROPOSAL` version:

```text
GET /api/v1/projects/{project_id}/exports/proposal-manifest
GET /api/v1/projects/{project_id}/exports/proposal.md
GET /api/v1/projects/{project_id}/exports/proposal.zip
```

`proposal.md` includes:

- Project name and ID
- Proposal title and narrative
- Proposal version, stage run, final decision, and generated time
- Every proposal section summary
- Asset references

`proposal.zip` contains:

- `proposal.md`
- `proposal-manifest.json`

Development demo endpoints are available without database state:

```text
GET /api/v1/dev/demo-proposal-manifest
GET /api/v1/dev/demo-proposal.md
GET /api/v1/dev/demo-proposal.zip
```

## Common Failures

### Port Is Already In Use

Check listeners:

```sh
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:8000 -sTCP:LISTEN
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

Either stop the process or change the matching `.env` exposed port.

### Docker Desktop Is Not Running

Start Docker Desktop, then run:

```sh
docker info
./scripts/check-environment.sh
```

### MinIO Is Unavailable

Check:

```sh
docker compose ps minio minio-init
curl -f http://127.0.0.1:${MINIO_API_PORT:-9000}/minio/health/live
```

Then rerun:

```sh
./scripts/verify-stack.sh
```

### API Ready Is Unavailable

Check dependency logs:

```sh
docker compose logs api
docker compose logs postgres
docker compose logs redis
docker compose logs minio
```

Then rerun:

```sh
./scripts/verify-stack.sh
```
