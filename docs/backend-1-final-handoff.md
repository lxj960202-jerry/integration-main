# 后端 1 最终交接包（小白版）

日期：2026-07-06  
分支：`后端1`  
本地目录：`/Users/zhangyusheng/Documents/设计/integration-main`

## 先说人话版结论

后端 1 的任务是：

```text
用户每点一个按钮，系统应该进入正确的下一步。
```

现在这条主流程已经在本地跑通：

```text
创建项目
→ Intake 收集需求
→ Directions 生成方向
→ 用户选择一个方向
→ Logo 生成标志方案
→ 用户选择一个 Logo
→ VI 生成视觉规范
→ 用户确认 VI
→ IP 阶段等待用户选择
→ 用户选择生成 IP 或跳过 IP
→ Materials 生成应用物料
→ 用户确认 Materials
→ Review 审核
→ 用户确认 Review
→ Proposal 生成提案
→ 用户确认 Proposal
→ 项目完成 COMPLETED
```

当前还不需要接真实大模型 API。现在用的是 fake 模型，意思是“假的、固定结果的模型”，主要用来先把按钮和流程跑顺，不花钱，也更容易排查问题。

## 你现在该用哪个地址

本机默认的 `8080 / 3000 / 8000` 端口已经有一组旧目录容器在跑，它来自：

```text
/Users/zhangyusheng/Documents/设计/aline-team-debug
```

所以后端 1 联调不要用默认端口，先用这组备用端口：

| 用途 | 地址 |
|---|---|
| 前端页面 | `http://127.0.0.1:13000` |
| 前端/API 网关 | `http://127.0.0.1:18080` |
| API 文档 | `http://127.0.0.1:18000/api/docs` |
| MinIO 控制台 | `http://127.0.0.1:19001` |

浏览器或前端请求接口时，推荐走：

```text
http://127.0.0.1:18080/api/v1
```

## 当前服务怎么启动

如果服务已经在跑，不需要重复启动。检查命令：

```bash
GATEWAY_PORT=18080 WEB_PORT=13000 API_EXPOSE_PORT=18000 POSTGRES_EXPOSE_PORT=15432 REDIS_EXPOSE_PORT=16379 MINIO_API_PORT=19000 MINIO_CONSOLE_PORT=19001 docker compose -p integration-main-backend1 ps
```

如果没跑，用下面命令启动当前项目自己的联调栈：

```bash
GATEWAY_PORT=18080 WEB_PORT=13000 API_EXPOSE_PORT=18000 POSTGRES_EXPOSE_PORT=15432 REDIS_EXPOSE_PORT=16379 MINIO_API_PORT=19000 MINIO_CONSOLE_PORT=19001 docker compose -p integration-main-backend1 up --build -d
```

注意：

- `-p integration-main-backend1` 是为了和旧目录容器隔离。
- 不要清 Docker volume，除非明确要重置所有本地数据。
- 不要去改或停止旧 `aline-*` 目录的容器，避免影响别人或旧窗口。

## 怎么判断服务是好的

健康检查、MinIO、S3、导出验收属于后端 2 的范围。后端 2 成功代码合入后，可以先看 ready 接口：

```bash
curl http://127.0.0.1:18080/api/v1/health/ready
```

正常会看到：

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

这里三个词的意思：

| 名字 | 意思 |
|---|---|
| `database` | PostgreSQL 数据库可用 |
| `redis` | Redis 队列可用 |
| `object_storage` | MinIO 文件存储可用 |

三项都是 `ok`，后端服务才算准备好。

如果只看后端 1 当前分支，还没合后端 2，`ready` 接口可能还是旧格式，只看到 `checks.postgres` 和 `checks.redis`。这不是后端 1 的按钮流程问题，最终以后端 2 的健康检查版本为准。

## 前端按钮该怎么接

完整按钮接口表在：

```text
docs/backend-1-button-api-map.md
```

最核心的记法是：

```text
点按钮
→ 调一个后端接口
→ 后端返回一个新的 stage_run.id
→ 前端轮询这个 stage_run.id
→ 成功后展示结果和下一个按钮
```

前端最常用的轮询接口：

```http
GET /api/v1/stage-runs/{stage_run_id}
```

每个任务会有一个状态：

| 状态 | 小白解释 | 前端要做什么 |
|---|---|---|
| `QUEUED` | 排队中 | 继续等 |
| `RUNNING` | 正在生成 | 继续等 |
| `SUCCEEDED` | 成功了 | 停止轮询，展示结果 |
| `WAITING_USER` | 后端在等用户点按钮 | 停止轮询，展示用户选择按钮 |
| `FAILED` | 失败了 | 停止轮询，展示错误 |

失败时前端看这两个字段：

```text
error_code
error_message
```

## 按钮和接口的短表

| 用户点什么 | 后端接口 | 下一步 |
|---|---|---|
| 创建项目 | `POST /api/v1/projects` | 轮询 `INTAKE` |
| 提交 Intake 答案 | `POST /api/v1/stage-runs/{intake_run_id}/intake-answers` | 轮询 `DIRECTIONS` |
| 选择方向 | `POST /api/v1/projects/{project_id}/stages/directions/decisions` | 轮询 `LOGO` |
| 选择 Logo | `POST /api/v1/projects/{project_id}/stages/logo/decisions` | 轮询 `VI` |
| 确认 VI | `POST /api/v1/projects/{project_id}/stages/vi/decisions` | 轮询 `IP`，直到 `WAITING_USER` |
| 生成 IP | `POST /api/v1/projects/{project_id}/stages/ip/generate` | 轮询新的 `IP` |
| 确认 IP | `POST /api/v1/projects/{project_id}/stages/ip/decisions` | 轮询 `MATERIALS` |
| 跳过 IP | `POST /api/v1/projects/{project_id}/stages/ip/skip` | 轮询 `MATERIALS` |
| 确认 Materials | `POST /api/v1/projects/{project_id}/stages/materials/decisions` | 轮询 `REVIEW` |
| 确认 Review | `POST /api/v1/projects/{project_id}/stages/review/decisions` | 轮询 `PROPOSAL` |
| 确认 Proposal | `POST /api/v1/projects/{project_id}/stages/proposal/decisions` | 项目变成 `COMPLETED` |

## 页面刷新后怎么办

页面刷新后，前端不要猜当前做到哪一步，直接问后端：

```http
GET /api/v1/projects/{project_id}/state
```

这个接口会告诉前端：

- 项目当前阶段是什么。
- 每个阶段最新任务是什么状态。
- 每个阶段最新结果是什么。
- 用户之前做过哪些选择。

简单规则：

| `/state` 里看到什么 | 前端怎么做 |
|---|---|
| 最新 run 是 `QUEUED` 或 `RUNNING` | 继续轮询这个 run |
| 最新 run 是 `SUCCEEDED` | 展示该阶段结果 |
| 最新 run 是 `WAITING_USER` | 展示该阶段用户按钮，例如 IP 生成/跳过 |
| 最新 run 是 `FAILED` | 展示失败提示 |
| `project.status` 是 `COMPLETED` | 展示完成态和下载入口 |

## 重复点击会怎样

后端 1 已经处理重复点击：

- 同一个方向点两次：返回同一个 Logo 任务，不会重复创建。
- 同一个 Logo 点两次：返回同一个 VI 任务。
- 同一个阶段确认两次：返回同一个下一阶段任务。
- IP 跳过点两次：返回同一个 Materials 任务。
- IP 生成点两次：返回同一个 IP 生成任务。

如果用户先选了 A，再试图对同一个版本选 B，后端会返回 `409`，意思是“冲突，不能这么做”。

## 项目完成后会怎样

Proposal 确认后：

```text
project.status = COMPLETED
project.current_stage = PROPOSAL
```

完成后不能再继续改阶段。下面这些写操作都会被拒绝：

- 重新选择 Directions。
- 重新选择 Logo。
- 重新确认 VI / IP / Materials / Review。
- redo / skip / generate。
- 再提交 Intake 答案。

完成后可以继续读：

- 项目状态。
- Proposal 导出清单。
- Markdown 提案。
- ZIP 交付包。

## 导出接口

项目完成后可用：

```http
GET /api/v1/projects/{project_id}/exports/proposal-manifest
GET /api/v1/projects/{project_id}/exports/proposal.md
GET /api/v1/projects/{project_id}/exports/proposal.zip
```

如果项目还没完成，这些接口会返回 `409`。

## 已经实测过什么

### 1. 跳过 IP 主流程

已用真实 HTTP 跑通：

```text
创建项目
→ INTAKE
→ DIRECTIONS
→ LOGO
→ VI
→ IP WAITING_USER
→ IP SKIP
→ MATERIALS
→ REVIEW
→ PROPOSAL
→ COMPLETED
```

实测项目：

```text
24e9a817-6b87-4ed0-8085-ce5e3209bfea
```

### 2. 生成 IP 分支

已用真实 HTTP 跑通：

```text
VI confirmed
→ IP WAITING_USER
→ IP GENERATE
→ IP SUCCEEDED
→ IP CONFIRM
→ MATERIALS SUCCEEDED
```

实测项目：

```text
ce9b01ff-89db-4201-9598-884b970110e0
```

## 本轮代码改了什么

后端 1 当前不再提交健康检查代码，避免和后端 2 冲突。

后端 2 负责：

```text
apps/api/app/routers/health.py
apps/api/app/health.py
S3 / MinIO / storage / export / e2e / Docker 文档
```

后端 1 负责：

```text
流程 API
阶段推进
选择 / 确认 / 跳过 / 生成
重复点击保护
完成态保护
给前端的按钮接口说明
```

本轮后端 1 新增文档：

```text
docs/backend-1-button-api-map.md
docs/backend-1-final-handoff.md
docs/backend-1-next-window-handoff.md
```

现在后端 1 工作区应该只剩这些文档改动，不应该再包含：

```text
apps/api/app/routers/health.py
tests/api/test_health.py
apps/web/**
backend/application/projects.py
backend/application/stage_runs.py
backend/agents/workflow.py
```

## 已经跑过的检查

```bash
UV_CACHE_DIR=/private/tmp/aline-uv-cache uv run ruff check .
UV_CACHE_DIR=/private/tmp/aline-uv-cache uv run pytest tests/backend/test_projects.py tests/api/test_project_routes.py
UV_CACHE_DIR=/private/tmp/aline-uv-cache uv run pytest
```

结果：

```text
ruff 通过
后端 1 主测试通过
全量测试通过
```

E2E smoke、Docker/MinIO/S3、导出环境检查由后端 2 负责，他们的成功说明里已经写了全部通过。

只有一个第三方 `StarletteDeprecationWarning`，不影响当前功能。

## 现在还不要做什么

暂时不要急着做这些：

- 不要接真实大模型 API Key。
- 不要把 fake 模型换成真实模型。
- 不要直接在 `main` 上改。
- 不要清理 Docker volume。
- 不要改旧 `aline-*` 目录。

原因很简单：现在最重要的是让前端先把按钮流程按后端 1 接起来。等按钮流程稳定，再接真实大模型，排查会轻很多。

## 什么时候接真实大模型

建议等下面几件事都完成：

- 前端能创建项目。
- 前端能展示每个阶段结果。
- 每个按钮都能调用正确接口。
- 页面刷新后能恢复当前阶段。
- 重复点击不会让页面乱掉。
- 完成态能展示下载入口。

这些完成后，再接真实大模型。顺序建议：

```text
先接文字模型
再接图片模型
```

不要一上来全接，容易同时出现成本、速度、图片生成、文本格式多个问题。

## 下一步建议

下一步进入前端按钮联调：

1. 前端打开 `http://127.0.0.1:13000`。
2. 前端按 `docs/backend-1-button-api-map.md` 接按钮。
3. 后端 1 继续盯接口返回、阶段推进和错误语义。
4. 如果前端发现某个按钮缺字段、状态不清楚、返回不方便展示，后端 1 再小步调整。

后端 1 现在的主要任务从“开发主流程”转为：

```text
陪前端联调，保证按钮点下去，阶段推进正确。
```
