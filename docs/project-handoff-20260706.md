# Aline Brand Workbench 聚合项目交接文档

日期：2026-07-06

## 继续工作的目录

后续所有开发都应基于大家完整聚合后的代码：

```bash
cd /Users/lxj/Documents/小组项目/项目聚合下载/aline-brand-workbench-branches-20260705/integration-main
```

当前分支：

```bash
integration/main
```

不要继续在最初的后端个人目录里开发：

```bash
/Users/lxj/Documents/小组项目/aline-brand-workbench
```

## 新窗口第一句话建议

可以直接把下面这段发给新窗口：

```text
请继续在 /Users/lxj/Documents/小组项目/项目聚合下载/aline-brand-workbench-branches-20260705/integration-main 的 integration/main 分支上工作。先阅读 docs/project-handoff-20260706.md，不要切回 /Users/lxj/Documents/小组项目/aline-brand-workbench。当前改动尚未提交，先看 git status --short。下一步建议先检查并提交当前集成改动，或者继续做 Proposal 导出/下载入口。
```

## 当前状态

- 当前工作区已有未提交改动。
- 这些改动是基于完整聚合代码继续完成的，不是基于最初的后端个人目录。
- 暂未提交 commit，交给新窗口前可先 review diff。
- Docker 本地栈已跑通。
- 前后端主流程已从 Intake 跑到 Proposal 完成态。

## 已完成的集成来源

已在 `integration-main` 工作树中合并或补齐：

- `origin/codex/backend2-main-ready`
- `origin/feat/backend-3-artifact-access`
- `origin/feat/frontend-1-project-intake`
- `origin/qianduan2`
- 后端 1 快照差异中的 API 合同文档与旧 redo 测试

## 已完成的基础修复

- 修复 Docker workspace 名称：从旧的 `@brand-studio/web` 调整为 `@aline/web`。
- 涉及文件：
  - `compose.yaml`
  - `infra/docker/web.Dockerfile`
- 修复 `scripts/verify-stack.sh`，让它读取 `API_EXPOSE_PORT`。
- 本地 `.env` 已被 git 忽略。
- 当前本地端口配置：
  - Gateway: `18080`
  - Web: `3000`
  - API: `18000`
  - Postgres: `15432`
  - Redis: `16379`
  - MinIO: `19000` / `19001`

## 已完成的第一批功能

前端项目详情页已经接入 `/projects/{id}/state`：

- 新增或扩展 API 类型：
  - `ProjectStateResponse`
  - `StageDecisionRequest`
  - `StageDecisionResponse`
  - `StageControlRequest`
  - `StageControlResponse`
  - `StageRunStatus` 增加 `WAITING_USER`
- 新增 API client：
  - `getProjectState(projectId)`
  - `createStageDecision(projectId, stageKey, payload)`
  - `requestStageControl(projectId, stageKey, action, payload?)`
- 轮询逻辑把 `WAITING_USER` 识别为终态之一。
- `ProjectWorkspace` 已支持：
  - 加载项目详情和项目状态
  - 提交阶段决策
  - 处理阶段确认
  - 处理阶段控制动作
- `ProjectDetail` 已从 project state 组装 workbench props 并渲染工作台。
- Ready Intake 支持在 `answers=[]` 时继续。
- 后端调整：
  - `backend/agents/schemas/intake.py`
  - `backend/application/stage_runs.py`
- 测试补充：
  - `tests/api/test_project_routes.py`
- 文档更新：
  - `docs/backend1-api-contract.md`
  - `docs/frontend-1-handoff.md`
- `apps/web/next.config.ts` 增加：
  - `allowedDevOrigins: ["127.0.0.1", "localhost"]`
- 工作台布局已调整为更适合全流程展示的宽版布局。

## 已完成的第二批功能

工作台已从原先只展示 `Directions / Logo`，扩展成完整阶段流：

```text
Directions -> Logo -> VI -> IP Choice -> IP -> Materials -> Review -> Proposal -> Completed
```

主要改动文件：

- `apps/web/features/workbench/types.ts`
- `apps/web/features/workbench/stage-output-panel.tsx`
- `apps/web/features/workbench/stage-output-panel.module.css`
- `apps/web/features/workbench/directions-logo-workbench.tsx`
- `apps/web/features/workbench/directions-logo-workbench.module.css`
- `apps/web/features/workbench/index.ts`
- `apps/web/features/projects/project-detail.tsx`
- `apps/web/features/projects/project-workspace.tsx`
- `apps/web/features/directions/directions-result.tsx`
- `apps/web/features/logo/logo-result.tsx`

现在支持：

- Directions 选定后锁定其他方向。
- Logo 选定后锁定其他 Logo。
- VI / IP / Materials / Review / Proposal 用统一的阶段输出面板展示。
- IP Choice 阶段出现时，前端显示：
  - 生成 IP
  - 跳过 IP
- Proposal 确认后项目进入 `COMPLETED`。

## API 冒烟测试项目

已用下面这个测试项目跑通过完整链路：

```text
project_id = d20ea999-28a7-4cbf-a98a-d746d12ef7ae
```

浏览器验证地址：

```text
http://127.0.0.1:18080/projects/d20ea999-28a7-4cbf-a98a-d746d12ef7ae
```

该项目当前状态：

- `status=COMPLETED`
- `current_stage=PROPOSAL`
- `version=19`

关键阶段记录：

- Intake run: `acfb313c-662e-4772-9293-e1d8a5a084f4`
- Directions run: `a5bf2a69-97e1-48a9-b96d-7c01def1269b`
- Directions version: `a4dedf63-b021-46a5-8431-9bdb0529c516`
- Selected direction: `direction-clear`
- Logo run: `9654b324-b65e-45ee-9ce4-38c1472479c3`
- Logo version: `1c9b0936-9a9a-4f36-8a3a-245082bfdefe`
- Selected logo: `logo-wordmark`
- VI run: `0b589640-1459-4e59-83bf-70804da87923`
- VI version: `e49fcd92-ecaa-4c1e-8e40-09bd9d852197`
- IP Choice run: `3b207c12-45bd-45d7-a19c-d04dce5c9a0e`
- IP run: `4272ccdc-1b87-4b58-9cd1-25b43e01d955`
- IP version: `2596020b-43ad-44fb-b0be-bd10b806b07c`
- Materials run: `aeb053bf-f8b0-4591-9f2b-a762afceb423`
- Materials version: `1b973cae-ad67-40c9-a740-dd1873f36de7`
- Review run: `5c6646de-e9e8-4e61-8500-ef7fa61e31d1`
- Review version: `68aae2b5-c70e-4528-90b3-371286e4ba58`
- Proposal run: `ccd34b8d-680c-43a2-8944-7e2e56baaff1`
- Proposal version: `6def5396-0ff3-43d8-a9cd-45b6ce57d6e6`
- Final proposal confirmation run: `5f3c2d7a-7c5e-4d99-8e77-d98df4dd3796`

## 已通过的检查

在当前聚合目录中已通过：

```bash
npm run typecheck:web
npm run lint:web
git diff --check
make check
./scripts/verify-stack.sh
```

`make check` 当时结果：

- Ruff 通过。
- Python format check 通过。
- 前端 lint 通过，但有一个非阻塞 warning。
- `uv run pytest` 通过：`183 passed, 7 skipped, 1 warning`。
- Web test 通过。
- Next build 通过。

## 已知 warning

`apps/web/features/logo/logo-result.tsx` 当前仍使用 `<img>`，Next lint 有 warning：

```text
@next/next/no-img-element
```

这是非阻塞 warning，`make check` 退出码为 0。后续可以谨慎替换为 `next/image`，但要注意 Logo 图片 URL 可能是动态资源，不要为了消 warning 引入显示问题。

## 当前未提交改动清单

上次检查时工作区包含这些改动：

- `apps/web/app/globals.css`
- `apps/web/components/workbench/stage-navigation.module.css`
- `apps/web/features/directions/directions-result.tsx`
- `apps/web/features/logo/logo-result.tsx`
- `apps/web/features/projects/project-detail.tsx`
- `apps/web/features/projects/project-workspace.tsx`
- `apps/web/features/workbench/directions-logo-workbench.module.css`
- `apps/web/features/workbench/directions-logo-workbench.tsx`
- `apps/web/features/workbench/index.ts`
- `apps/web/features/workbench/types.ts`
- `apps/web/lib/api/client.ts`
- `apps/web/lib/api/polling.ts`
- `apps/web/lib/api/types.ts`
- `apps/web/next.config.ts`
- `backend/agents/schemas/intake.py`
- `backend/application/stage_runs.py`
- `docs/backend1-api-contract.md`
- `docs/frontend-1-handoff.md`
- `tests/api/test_project_routes.py`
- `apps/web/features/workbench/stage-output-panel.module.css`
- `apps/web/features/workbench/stage-output-panel.tsx`
- `docs/project-handoff-20260706.md`

新窗口应先执行：

```bash
git status --short
git diff --stat
```

## 建议下一步

1. 先 review 当前 diff，确认后提交当前集成改动。
2. 继续做 Proposal 导出 / 下载入口。
3. 检查后端是否已有 export/artifact 相关接口，重点看：
   - `backend/application/exports.py`
   - `backend/exports/`
   - API routers 中与 artifacts / exports 相关的路由
4. 如果后端已支持导出，则在前端增加：
   - API client 方法
   - Proposal 完成后的下载按钮
   - 下载中、成功、失败状态
5. 如时间允许，再补前端测试，覆盖 project state 到 workbench props 的组装逻辑。
6. 可选优化：处理阶段列表里 IP Choice / Proposal confirmation 这类控制 run 的展示，避免用户误以为重复生成。
7. 可选优化：消除 `<img>` lint warning，但不要影响动态图片显示。

## 本地运行提示

进入项目：

```bash
cd /Users/lxj/Documents/小组项目/项目聚合下载/aline-brand-workbench-branches-20260705/integration-main
```

如果栈已经在跑，可直接访问：

```text
http://127.0.0.1:18080
```

推荐验证页面：

```text
http://127.0.0.1:18080/projects/d20ea999-28a7-4cbf-a98a-d746d12ef7ae
```

健康检查：

```bash
./scripts/verify-stack.sh
```

完整检查：

```bash
make check
```

## 注意事项

- 不要回滚用户或其他成员的无关改动。
- 当前工作树脏是预期状态，因为集成改动尚未提交。
- 继续开发时以聚合目录为唯一准绳。
- 如果要提交，建议提交信息围绕完整阶段工作台与聚合修复，例如：

```text
Integrate full brand workbench flow
```
