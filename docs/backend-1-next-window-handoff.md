# 后端 1 新窗口统一交接包：流程 API 与阶段推进

日期：2026-07-06  
本地机器：`/Users/zhangyusheng/Documents/设计`

本文已合并用户提供的阶段文档：

```text
03-后端1-流程API与阶段推进(1).md
```

## 新窗口第一句话

可以直接把下面这段发给新 Codex 窗口：

```text
请继续在 /Users/zhangyusheng/Documents/设计/integration-main 工作。当前仓库来自 https://github.com/lxj960202-jerry/integration-main.git，已切到 后端1 分支，后端1 与 origin/main 当前同为 b696ac8。先阅读 docs/backend-1-next-window-handoff.md。我的角色是后端1，负责流程 API 与阶段推进：每点一个按钮，系统应该进入哪一步。不要切 main，不要合 main，不要推远端，不要改动 /Users/zhangyusheng/Documents/设计/aline-team-debug 或其他 aline-* 旧目录。先在本地检查现有实现和测试，再按本文档继续。
```

## 当前仓库与分支

工作目录：

```bash
cd /Users/zhangyusheng/Documents/设计/integration-main
```

远端：

```text
origin = https://github.com/lxj960202-jerry/integration-main.git
```

当前分支：

```text
后端1
```

当前提交：

```text
b696ac8e9b6098940542d832acd4fc8032f400a3
```

远端分支现状：

```text
origin/main      = b696ac8
origin/后端1     = b696ac8
origin/qianduan2 = b696ac8
origin/分支3     = b696ac8
```

当前 `后端1` 已经和仓库主线 `main` 对齐，但后续不要直接在 `main` 上操作。

## 分支策略

用户明确要求：

```text
不要轻易动 main 主线，现在本地跑。
```

因此新窗口应遵守：

- 保持在 `后端1` 分支工作。
- 不要切到 `main` 开发。
- 不要 merge/rebase `main`。
- 不要 push 远端，除非用户明确要求。
- 如果确实需要再开隔离开发分支，先向用户确认；默认不要擅自创建。

用户原始阶段文档中有如下通用说明：

```bash
git switch local/team-debug
git switch -c dev/backend-1-workflow-api
```

这段是给不同电脑/不同基础分支的通用占位说明。当前本地实际情况以本文档为准：已经在 `/Users/zhangyusheng/Documents/设计/integration-main` 的 `后端1` 分支。

## 当前工作区状态

截至交接包生成时：

- 仓库已克隆到本地。
- 已切到 `后端1` 分支并跟踪 `origin/后端1`。
- `.env` 已按 `.env.example` 生成，使用本地 fake 模型配置。
- `.env` 被 `.gitignore` 忽略，不会进入提交。
- 当前未启动 Docker 服务。
- 当前只新增了本文档作为交接资料，没有业务代码改动。

建议新窗口先运行：

```bash
git status -sb
git branch --show-current
git rev-parse --abbrev-ref --symbolic-full-name @{u}
git log -1 --oneline --decorate
```

期望：

```text
## 后端1...origin/后端1
后端1
origin/后端1
b696ac8 ... Merge GitHub repository main
```

## 本地运行方式

如果需要把项目在本地跑起来：

```bash
cd /Users/zhangyusheng/Documents/设计/integration-main
docker compose up --build
```

或：

```bash
make dev
```

服务地址：

| 服务 | 地址 |
|---|---|
| Gateway | http://localhost:8080 |
| Web | http://localhost:3000 |
| API Docs | http://localhost:8000/api/docs |
| API Ready | http://localhost:8000/api/v1/health/ready |
| MinIO Console | http://localhost:9001 |

默认 `.env` 使用 fake 模型：

```text
TEXT_MODEL_PROVIDER=fake
IMAGE_MODEL_PROVIDER=fake
```

本地默认不会调用真实 AI，也不会消耗外部模型额度。

## 后端 1 角色

你是后端 1。

负责品牌生成主流程。

简单说：

```text
你负责每点一个按钮，系统应该进入哪一步。
```

## 当前仓库已有主流程

主流程已经聚合在当前仓库内：

```text
INTAKE
→ DIRECTIONS
→ LOGO
→ VI
→ IP
→ MATERIALS
→ REVIEW
→ PROPOSAL
→ COMPLETED / EXPORT_READY
```

已有核心接口：

- `POST /api/v1/projects`
- `GET /api/v1/projects`
- `GET /api/v1/projects/{project_id}`
- `GET /api/v1/projects/{project_id}/state`
- `GET /api/v1/projects/{project_id}/stages/{stage_key}/versions`
- `POST /api/v1/projects/{project_id}/stages/{stage_key}/decisions`
- `POST /api/v1/projects/{project_id}/stages/{stage_key}/redo`
- `POST /api/v1/projects/{project_id}/stages/{stage_key}/skip`
- `POST /api/v1/projects/{project_id}/stages/{stage_key}/generate`
- `GET /api/v1/stage-runs/{stage_run_id}`
- `POST /api/v1/stage-runs/{stage_run_id}/intake-answers`
- `GET /api/v1/projects/{project_id}/exports/proposal-manifest`
- `GET /api/v1/projects/{project_id}/exports/proposal.md`
- `GET /api/v1/projects/{project_id}/exports/proposal.zip`

已有参考文档：

- `docs/project-handoff-20260706.md`
- `docs/backend1-api-contract.md`
- `docs/backend-1-logo-vi-handoff.md`
- `docs/backend-1-vi-ip-handoff.md`
- `docs/backend-1-ip-materials-handoff.md`
- `docs/backend-1-materials-review-handoff.md`
- `docs/backend-1-review-proposal-handoff.md`
- `docs/backend-1-proposal-export-ready-handoff.md`

注意：`docs/project-handoff-20260706.md` 里有原作者机器路径，不适用于当前本机路径；当前新窗口应以本文档里的路径为准。

## 本阶段要完成的功能

### 1. 检查完整阶段推进

主流程必须能按顺序跑通：

```text
INTAKE
→ DIRECTIONS
→ LOGO
→ VI
→ IP
→ MATERIALS
→ REVIEW
→ PROPOSAL
→ COMPLETED / EXPORT_READY
```

要检查：

- 每一步成功后项目阶段是否正确。
- 每一步失败后错误是否保存。
- 每一步是否能查询到最新结果。

### 2. 完善选择和确认接口

前端需要这些动作：

- 选择 Directions
- 选择 Logo
- 确认 VI
- 生成 IP
- 跳过 IP
- 确认 IP
- 确认 Materials
- 确认 Review
- 确认 Proposal

要保证：

- 每个动作都有接口支持。
- 每个动作都会创建正确的下一阶段任务。
- 返回值能让前端知道下一阶段是什么。

### 3. 保证重复点击安全

用户可能连续点两次按钮。

要保证：

- 不会重复创建多个相同任务。
- 不会把项目状态弄乱。
- 如果已经做过同样选择，应该返回已有结果。

### 4. 保证完成项目不能被错误修改

项目已经完成后：

- 不能再随便选择旧阶段。
- 不能再创建新的下游任务。
- 只有合理的导出读取可以继续。

### 5. 补测试

至少补这些测试：

- 完整流程推进测试。
- 重复点击测试。
- 完成后不可修改测试。
- 某个阶段失败后的错误状态测试。

## 允许修改的文件范围

主要修改这些：

```text
backend/application/stage_runs.py
backend/application/projects.py
backend/application/stages.py
apps/api/app/tasks.py
apps/api/app/routers/projects.py
apps/api/app/routers/stage_runs.py
tests/backend/test_projects.py
tests/backend/agents/test_workflow.py
tests/api/test_project_routes.py
```

## 原则上不要修改的文件

原则上不要改：

```text
apps/web/**
backend/infrastructure/storage/**
backend/exports/**
infra/**
compose.yaml
scripts/**
```

如果必须改，请先说明原因，并在最终回复里明确列出。

## 操作边界

- 不要改动旧目录：
  - `/Users/zhangyusheng/Documents/设计/aline-team-debug`
  - `/Users/zhangyusheng/Documents/设计/aline-brand-workbench`
  - `/Users/zhangyusheng/Documents/设计/aline-backend2-*`
  - `/Users/zhangyusheng/Documents/设计/aline-m0-integration`
- 不要切 main。
- 不要 merge main。
- 不要 push 远端，除非用户明确要求。
- 不要清理 Docker volume，除非用户明确要求。
- 不要把 `.env`、密钥、真实模型 Key 提交进 Git。

## 验收标准

完成后必须满足：

- 从新建项目能跑到 Proposal。
- 每个阶段状态正确。
- 重复点击不会产生重复任务。
- 完成项目不能被错误修改。
- 后端测试通过。

## 必跑检查

完成后运行：

```bash
UV_CACHE_DIR=/private/tmp/aline-uv-cache uv run ruff check .
UV_CACHE_DIR=/private/tmp/aline-uv-cache uv run pytest tests/backend/test_projects.py tests/api/test_project_routes.py
```

如果时间允许，再运行：

```bash
UV_CACHE_DIR=/private/tmp/aline-uv-cache uv run pytest
```

## 建议新窗口工作顺序

1. 确认当前目录和分支：

   ```bash
   cd /Users/zhangyusheng/Documents/设计/integration-main
   git status -sb
   git branch --show-current
   ```

2. 阅读本文档和 API 合同：

   ```bash
   sed -n '1,260p' docs/backend-1-next-window-handoff.md
   sed -n '1,260p' docs/backend1-api-contract.md
   ```

3. 先检查现有实现是否已经覆盖目标：

   ```bash
   rg -n "create_stage_decision|request_stage_control|execute_stage_run|COMPLETED|WAITING_USER|idempotency" backend apps/api tests
   ```

4. 再决定是否需要改代码。

5. 改完只跑后端相关检查，不要顺手做前端大改。

## 最终回复格式

完成后按这个格式回复用户：

```text
我完成了什么：
我修改了哪些文件：
我没有碰哪些范围：
我运行了哪些检查：
还存在什么风险：
需要谁继续配合：
```
