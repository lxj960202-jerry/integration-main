# Docker And E2E Notes

This stack runs the local Brand Agent Studio environment used by backend, frontend,
and acceptance testing.

## Services

`compose.yaml` starts:

- `postgres`
- `redis`
- `minio`
- `minio-init`
- `api`
- `worker`
- `web`
- `gateway`

`minio-init` creates the local bucket from `S3_BUCKET` before `api` and `worker`
start.

## First Run

```sh
cp .env.example .env
./scripts/check-environment.sh
docker compose up --build -d
./scripts/verify-stack.sh
```

Open the app through the gateway:

```text
http://127.0.0.1:8080
```

If `.env` changes the ports, use these external port variables:

- `GATEWAY_PORT` for the gateway
- `WEB_PORT` for the Next.js dev server
- `API_EXPOSE_PORT` for the FastAPI server exposed on the host
- `MINIO_API_PORT` and `MINIO_CONSOLE_PORT` for MinIO

`API_PORT` is the API port inside the container and normally stays `8000`.

## Verify

```sh
./scripts/verify-stack.sh
```

The verification script checks Docker, Compose, service process state, and these
HTTP endpoints:

- Gateway: `/health`
- Web: `/api/health`
- API: `/api/v1/health/ready`
- API docs: `/api/docs`
- MinIO: `/minio/health/live`
- MinIO console

The API ready check reports database, Redis, and object storage dependency
status.

## E2E Smoke

```sh
./scripts/run-e2e.sh
```

The script builds and starts Compose, runs `./scripts/verify-stack.sh`, runs the
E2E smoke tests with `BRAND_STUDIO_RUN_E2E=1`, then stops the stack.

Keep the stack running after E2E:

```sh
KEEP_STACK=1 ./scripts/run-e2e.sh
```

Run only the pytest E2E checks against an already running stack:

```sh
BRAND_STUDIO_RUN_E2E=1 UV_CACHE_DIR=/private/tmp/aline-uv-cache uv run pytest tests/e2e
```

## Proposal Downloads

After a project reaches `COMPLETED`, these files are available:

```text
GET /api/v1/projects/{project_id}/exports/proposal.md
GET /api/v1/projects/{project_id}/exports/proposal.zip
```

`proposal.zip` contains:

- `proposal.md`
- `proposal-manifest.json`

For a no-database demo contract, use:

```text
GET /api/v1/dev/demo-proposal.md
GET /api/v1/dev/demo-proposal.zip
```

## Stop

```sh
docker compose stop
```
