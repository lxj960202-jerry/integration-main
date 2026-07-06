# 全组功能开发文档（两前端、两后端、一 UI）

日期：2026-07-06
当前建议工作分支：`codex/integration-full-flow`
本地目录：`/Users/zhangyusheng/Documents/设计/integration-main`

## 先说结论

项目经理图里的主流程，当前已经有一条 MVP 闭环：

```text
用户新建项目
-> 填品牌需求
-> 系统整理 BrandSpec
-> Intake 判断信息是否足够
-> 生成 3 个品牌方向
-> 用户选方向
-> 生成 Logo 方案
-> 用户选 Logo
-> 生成 VI 规范
-> 用户确认 VI
-> 用户选择生成 IP 或跳过 IP
-> 生成物料
-> 用户确认物料
-> 自动审稿
-> 用户确认审稿
-> 生成最终提案
-> 用户确认提案
-> 项目完成并可下载交付文件
```

所以现在不是从零开始做，而是在已经跑通的主链路上补齐正式版能力。

产品经理已确认本轮补功能方向：

1. 全阶段“不满意 / 刷新 / 重新生成”要补。
2. 最终下载要补完整交付能力。
3. 真实大模型接入要进入后续计划。
4. 首页 / 历史记录 / UI 状态要继续完善。
5. Logo 数量确认是 3 个，不改成 4 个。

目前最大缺口调整为 4 个：

1. 每个阶段的“不满意 / 刷新 / 重新生成”还没全支持。
2. 最终导出现在有 Markdown 和 ZIP，但还不是完整 PDF + 全部图片素材包。
3. 当前默认 fake 模型，适合联调，不代表真实大模型输出质量。
4. 首页、历史记录和正式 UI 状态还需要按 UI 稿继续完善。

Logo 数量已经确认：继续使用当前 3 个 Logo 方案，不需要改 4 个。

## 当前能看的本地地址

当前集成栈已跑通，建议大家统一看这套：

| 用途 | 地址 |
|---|---|
| Web 页面 | `http://127.0.0.1:23000` |
| Gateway | `http://127.0.0.1:28080` |
| API 文档 | `http://127.0.0.1:28000/api/docs` |
| MinIO 控制台 | `http://127.0.0.1:29001` |

检查服务：

```bash
docker compose -p integration-main-full ps
curl http://127.0.0.1:28080/api/v1/health/ready
```

正常 ready 结果应该包含：

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

## 当前真实状态

### 已经验证通过

- 四个分支已经合到本地集成分支。
- Docker 栈可以启动。
- 后端健康检查通过。
- 前端页面可以新建项目并一路点到完成。
- API 层完整项目状态可以返回 `COMPLETED`。
- 前端 typecheck / lint / test / build 通过。
- 后端 pytest 通过。
- e2e smoke 通过。

### 当前模式

现在 `.env` 默认是 fake 模型：

```env
TEXT_MODEL_PROVIDER=fake
IMAGE_MODEL_PROVIDER=fake
```

fake 模型的意思：

- 好处：不花钱、速度快、结果稳定、适合联调。
- 缺点：不是最终真实 AI 效果。

正式接大模型前，先把按钮、接口、导出、重做逻辑稳定住。

## 项目经理流程图对照表

| 图里流程 | 当前状态 | 说明 |
|---|---|---|
| 用户进入平台 | 已有基础 | 当前有项目列表和项目详情 |
| 首页 | 部分完成 | 有工作台首页雏形，正式首页还要 UI 设计 |
| 历史记录 | 部分完成 | 左侧项目列表等于简版历史记录 |
| 新建项目 | 已完成 | `POST /api/v1/projects` |
| 填写品牌需求 | 已完成 | 结构化字段进入 BrandSpec |
| 创建项目 BrandSpec | 已完成 | 后端保存 BrandSpec |
| 艺术总监 Agent 分析需求 | 已完成主链路 | Intake 阶段负责判断信息是否足够 |
| 信息是否完整 | 已完成 | 不完整时返回问题，完整时进入 Directions |
| 生成问题 | 已完成 | Intake questions |
| 用户补充答案 | 已完成 | 提交后继续分析 |
| 生成 3 个品牌方向 | 已完成 | 当前固定 3 个方向 |
| 用户选择一个方向 | 已完成 | 选择后进入 Logo |
| Logo 生成方案 | 已完成基础版 | 产品已确认 3 个 Logo，不改 4 个 |
| 用户选择 / 确认 Logo | 已完成 | 选择后进入 VI |
| VI agent 生成 VI 手册 | 已完成基础版 | 有色板、字体、Logo 规则、布局 |
| 用户确认 VI | 已完成 | 确认后进入 IP Choice |
| IP agent 生成 IP 形象 | 已完成基础版 | 用户可生成或跳过 IP |
| 用户确认 IP | 已完成 | 确认后进入物料 |
| 物料 agent 生成应用物料 | 已完成基础版 | 当前 2 个场景 |
| 用户确认物料 | 已完成 | 确认后进入 Review |
| 自动生成品牌全案 | 已完成基础版 | Proposal 阶段 |
| 提案包含 Logo/VI/IP/物料 | 部分完成 | 提案有引用，但导出包还不完整 |
| 用户点击下载 | 部分完成 | 有 Markdown/ZIP，缺 PDF 和完整素材包 |
| 用户选择 PDF/ZIP | 部分完成 | ZIP 有，PDF 未接到当前 API |

## 功能分层

### 1. 项目层

负责项目创建、项目列表、项目详情、历史记录。

当前已有：

- 创建项目
- 列表项目
- 查看项目详情
- 查看项目状态
- 页面刷新后恢复当前阶段

还需要补：

- 正式首页布局
- 历史记录筛选 / 搜索 / 状态标签
- 项目归档或删除是否需要，待产品确认

### 2. 需求层 BrandSpec / Intake

负责把用户需求变成结构化品牌信息。

当前已有：

- `BrandSpec`
- Intake 判断 ready
- 不完整时生成问题
- 用户提交答案后继续流程

还需要补：

- UI 对每个字段的填写说明
- 更明确的必填/选填规则
- 真实模型接入后的 Intake prompt 调优

### 3. 生成阶段层

当前核心阶段：

```text
DIRECTIONS
LOGO
VI
IP
MATERIALS
REVIEW
PROPOSAL
```

每个阶段有三类数据：

- `StageRun`：一次任务执行，例如正在生成 Logo。
- `StageVersion`：一次生成出来的结果版本。
- `Decision`：用户做出的选择或确认。

前端不要自己猜流程，统一读：

```http
GET /api/v1/projects/{project_id}/state
GET /api/v1/stage-runs/{stage_run_id}
```

### 4. 人工决策层

当前已有用户决策：

| 阶段 | 用户动作 |
|---|---|
| Directions | 选择一个方向 |
| Logo | 选择一个 Logo |
| VI | 确认 VI |
| IP Choice | 生成 IP 或跳过 IP |
| IP | 确认 IP |
| Materials | 确认物料 |
| Review | 确认审稿结果 |
| Proposal | 完成项目 |

还需要补：

- 每阶段“不满意 / 重新生成”
- 重新生成时填写原因或反馈
- 重新生成后自动把下游版本标记为过期
- 前端展示“旧版本 / 新版本 / 已过期”

### 5. 资产层

当前已有：

- 图片生成后存入 MinIO/S3
- 数据库有 `artifacts` 表
- 结果里会返回 `preview_asset_id`

当前不足：

- 前端还没有完整拿图片 URL 的稳定接口。
- 下载 ZIP 里还没有打包真实图片。
- 还没有单个素材下载入口。

### 6. 导出层

当前已有接口：

| 功能 | 接口 |
|---|---|
| 导出清单 | `GET /api/v1/projects/{project_id}/exports/proposal-manifest` |
| 下载 Markdown | `GET /api/v1/projects/{project_id}/exports/proposal.md` |
| 下载 ZIP | `GET /api/v1/projects/{project_id}/exports/proposal.zip` |

当前不足：

- PDF 导出还没接到项目 API。
- ZIP 目前主要是 `proposal.md` 和 `proposal-manifest.json`，还不是完整交付包。
- 需要把 Logo/IP/物料图片打进 ZIP。

## 五人分工建议

现在团队是：

```text
前端 1
前端 2
后端 1
后端 2
UI 设计
```

建议不要所有人都抢同一个文件。按功能边界分，最快也最不容易冲突。

## UI 设计任务

UI 先不要管接口细节，重点把用户使用路径设计清楚。

### UI 需要产出

1. 首页 / 历史记录
2. 新建项目表单
3. 需求填写 / Intake 补问
4. 品牌方向选择页
5. Logo 选择页
6. VI 确认页
7. IP 生成 / 跳过 / 确认页
8. 物料确认页
9. 审稿结果页
10. 最终提案页
11. 下载交付页
12. 加载中、失败、重新生成、已过期状态

### UI 每个页面必须标清楚

- 页面标题
- 当前用户应该做什么
- 主按钮是什么
- 次按钮是什么
- 哪些按钮什么时候禁用
- 加载中怎么显示
- 失败时怎么显示
- 不满意时怎么重新生成
- 完成后下载入口在哪里

### UI 不要先做的

- 不要先做复杂营销落地页。
- 不要只做漂亮首页却没有按钮状态。
- 不要把“重新生成”设计成普通刷新图标，用户会看不懂。

## 前端 1 任务

前端 1 负责项目入口、历史记录、需求填写、状态恢复。

### 负责文件范围建议

```text
apps/web/features/projects/**
apps/web/features/intake/**
apps/web/lib/api/**
apps/web/app/page.tsx
apps/web/app/projects/[projectId]/page.tsx
```

### 近期任务

1. 首页 / 历史记录页面
   - 展示项目列表
   - 展示项目状态
   - 支持进入项目
   - 支持新建项目

2. 新建项目表单
   - 品牌名称
   - 行业
   - 品牌背景
   - 目标用户
   - 风格关键词
   - 需求描述

3. Intake 补问
   - 展示问题
   - 支持文本、单选、多选
   - 提交答案后轮询下一阶段

4. 页面刷新恢复
   - 调 `GET /projects/{id}/state`
   - 如果有正在跑的 run，继续轮询
   - 如果等待用户，展示对应按钮
   - 如果已完成，展示最终提案

### 前端 1 验收标准

- 新用户可以创建项目。
- 需求不足时可以补充答案。
- 页面刷新后不会丢状态。
- 项目列表能区分进行中和已完成。

## 前端 2 任务

前端 2 负责品牌生成工作台和每个阶段结果展示。

### 负责文件范围建议

```text
apps/web/features/workbench/**
apps/web/features/directions/**
apps/web/features/logo/**
apps/web/features/vi/**
apps/web/features/ip/**
apps/web/features/materials/**
apps/web/features/review/**
apps/web/features/proposal/**
apps/web/components/workbench/**
```

### 近期任务

1. 阶段导航
   - 未解锁
   - 生成中
   - 待用户处理
   - 已确认
   - 已过期

2. 每阶段结果展示
   - Directions 展示 3 个方向
   - Logo 展示 3 个方案，产品已确认不改 4 个
   - VI 展示色板、字体、Logo 规则
   - IP 展示角色设定和预览
   - Materials 展示物料场景
   - Review 展示通过/风险
   - Proposal 展示最终方案

3. 按钮对接
   - 选择方向
   - 选择 Logo
   - 确认 VI
   - 生成 IP
   - 跳过 IP
   - 确认 IP
   - 确认物料
   - 确认审稿
   - 完成项目

4. 导出入口
   - 下载 Markdown
   - 下载 ZIP
   - 等后端补 PDF 后接 PDF

### 前端 2 验收标准

- 用户从方向选择开始能一路点到项目完成。
- 每个按钮只在正确阶段出现。
- 点击后按钮进入 loading 或 disabled 状态。
- 后端返回失败时能展示错误。

## 后端 1 任务

后端 1 负责业务 API、状态机、按钮动作。

### 负责文件范围建议

```text
apps/api/app/routers/**
backend/application/projects.py
backend/application/stage_runs.py
backend/application/stages.py
backend/infrastructure/database/**
tests/api/**
```

### 已有能力

- 项目创建
- 项目列表
- 项目详情
- 项目 state
- 阶段选择
- 阶段确认
- IP generate / skip
- Proposal 完成项目
- `Intake` 和 `Directions` redo

### 近期必须补

1. 全阶段 redo

项目经理图里每一步都有“不满意，刷新”。当前只支持：

```text
INTAKE redo
DIRECTIONS redo
```

需要补：

```text
LOGO redo
VI redo
IP redo
MATERIALS redo
REVIEW redo
PROPOSAL redo
```

注意：

- redo 需要 `source_version_id`
- redo 后下游版本要标记 `STALE`
- redo 后项目回到对应阶段
- 本轮按当前规则处理：项目完成后不允许 redo，避免完成态被再次打散。

2. 反馈字段

重新生成时建议允许用户传：

```json
{
  "source_version_id": "version-id",
  "reason": "颜色太商务，希望更年轻"
}
```

后端保存到 Decision payload 或 StageRun input，后端 2 可以用于 prompt。

3. 导出 API 扩展

需要新增或扩展：

```http
GET /api/v1/projects/{project_id}/exports/proposal.pdf
GET /api/v1/projects/{project_id}/exports/full-package.zip
GET /api/v1/projects/{project_id}/assets
GET /api/v1/projects/{project_id}/assets/{asset_id}/download
```

接口名字可以调整，但要先定下来。

### 后端 1 验收标准

- 每个前端按钮都有稳定接口。
- 重复点击不会创建重复任务。
- 错误返回清楚：404、409、422。
- `/state` 能让前端完整恢复页面。

## 后端 2 任务

后端 2 负责 Agent、Prompt、模型 provider、真实大模型接入。

### 负责文件范围建议

```text
backend/agents/**
backend/providers/**
tests/backend/agents/**
```

### 已有能力

- Fake text provider
- Fake image provider
- SiliconFlow provider 雏形
- LangGraph 工作流
- Intake -> Proposal 全阶段推进
- 模型输出 schema 校验
- 模型输出修复尝试
- model invocation 记录

### 近期必须补

1. 生成数量

产品已确认 Logo 数量使用当前 3 个，不改 4 个：

| 项 | 当前 | 产品确认 |
|---|---|---|
| 品牌方向 | 3 个 | 3 个 |
| Logo | 3 个 | 3 个 |
| 物料场景 | 2 个 | 暂按 2 个继续，后续如加场景再扩展 |

所以本轮不需要改 Logo schema、fake provider、prompt、测试和前端展示数量。

2. 接真实模型前的检查

接真实模型前必须确认：

- 文本模型用哪家
- 图片模型用哪家
- API Key 谁提供
- 每次生成成本是否可接受
- 图片生成是否支持参考图
- 图片 URL 是否能下载入库

3. Prompt 加用户反馈

redo 时需要把用户 reason 带给模型：

```text
上一版问题：颜色太商务，希望更年轻。
请重新生成同阶段方案，并保持已确认的上游决策不变。
```

4. Review 真实规则

审稿不只是生成摘要，需要检查：

- Logo 和 VI 是否一致
- 物料是否使用了正确资产
- 是否缺少关键资产
- 是否有明显品牌不一致
- 是否可交付

### 后端 2 验收标准

- fake 模式仍然稳定。
- 真实模型模式可以切换。
- 真实模型输出不符合 schema 时有错误处理。
- redo 能根据用户反馈生成新版本。

## 后端 3 / 导出归属说明

现在团队说是两后端，但项目里之前有后端 3 的资产/导出职责。因为现在只有两后端，建议把它拆开：

- 后端 1 接 API 和数据库状态。
- 后端 2 接导出渲染、资产打包和模型。

如果后端 2 忙不过来，可以把“导出包”单独拉一张任务卡给后端 1 或新增同学。

### 导出正式目标

最终下载至少要包含：

```text
proposal.pdf
proposal.md
proposal-manifest.json
assets/
  directions/
  logo/
  ip/
  materials/
```

ZIP 内部建议结构：

```text
brand-package.zip
  proposal.pdf
  proposal.md
  proposal-manifest.json
  assets/
    direction-01.png
    logo-01.png
    ip-primary.png
    material-cover.png
    material-packaging.png
```

## API 对接总表

### 当前已有 API

| 功能 | 方法和路径 |
|---|---|
| 创建项目 | `POST /api/v1/projects` |
| 项目列表 | `GET /api/v1/projects` |
| 项目详情 | `GET /api/v1/projects/{project_id}` |
| 项目完整状态 | `GET /api/v1/projects/{project_id}/state` |
| 查询某阶段版本 | `GET /api/v1/projects/{project_id}/stages/{stage_key}/versions` |
| 提交 Intake 答案 | `POST /api/v1/stage-runs/{run_id}/intake-answers` |
| 查询任务 | `GET /api/v1/stage-runs/{run_id}` |
| 阶段选择/确认 | `POST /api/v1/projects/{project_id}/stages/{stage_key}/decisions` |
| 阶段 redo | `POST /api/v1/projects/{project_id}/stages/{stage_key}/redo` |
| IP 生成 | `POST /api/v1/projects/{project_id}/stages/ip/generate` |
| IP 跳过 | `POST /api/v1/projects/{project_id}/stages/ip/skip` |
| 导出清单 | `GET /api/v1/projects/{project_id}/exports/proposal-manifest` |
| 下载 Markdown | `GET /api/v1/projects/{project_id}/exports/proposal.md` |
| 下载 ZIP | `GET /api/v1/projects/{project_id}/exports/proposal.zip` |
| 健康检查 | `GET /api/v1/health/ready` |

### 需要新增或增强的 API

| 功能 | 建议接口 | 负责人 |
|---|---|---|
| 全阶段 redo | 扩展现有 redo | 后端 1 |
| redo 用户反馈 | 扩展 redo request | 后端 1 + 后端 2 |
| PDF 下载 | `GET /exports/proposal.pdf` | 后端 2 |
| 完整素材 ZIP | `GET /exports/full-package.zip` | 后端 2 |
| 资产列表 | `GET /projects/{id}/assets` | 后端 1 |
| 单资产下载 | `GET /projects/{id}/assets/{asset_id}/download` | 后端 1 |
| 资产预览 URL | `GET /projects/{id}/assets/{asset_id}/url` 或放入 assets 列表 | 后端 1 |

## 按钮逻辑表

| 用户看到的按钮 | 当前可接接口 | 状态 |
|---|---|---|
| 新建项目 | `POST /projects` | 已有 |
| 提交需求 | `POST /stage-runs/{id}/intake-answers` | 已有 |
| 选择品牌方向 | `POST /stages/directions/decisions` | 已有 |
| 重新生成品牌方向 | `POST /stages/directions/redo` | 已有 |
| 选择 Logo | `POST /stages/logo/decisions` | 已有 |
| 重新生成 Logo | `POST /stages/logo/redo` | 待补 |
| 确认 VI | `POST /stages/vi/decisions` | 已有 |
| 重新生成 VI | `POST /stages/vi/redo` | 待补 |
| 生成 IP | `POST /stages/ip/generate` | 已有 |
| 跳过 IP | `POST /stages/ip/skip` | 已有 |
| 确认 IP | `POST /stages/ip/decisions` | 已有 |
| 重新生成 IP | `POST /stages/ip/redo` | 待补 |
| 确认物料 | `POST /stages/materials/decisions` | 已有 |
| 重新生成物料 | `POST /stages/materials/redo` | 待补 |
| 确认审稿 | `POST /stages/review/decisions` | 已有 |
| 重新审稿 | `POST /stages/review/redo` | 待补 |
| 完成项目 | `POST /stages/proposal/decisions` | 已有 |
| 下载 Markdown | `GET /exports/proposal.md` | 已有 |
| 下载 ZIP | `GET /exports/proposal.zip` | 半成品 |
| 下载 PDF | `GET /exports/proposal.pdf` | 待补 |

## 分支和协作规则

### 推荐分支

不要直接改 `main`。

当前可以从集成分支继续拉任务：

```bash
git checkout codex/integration-full-flow
git pull
git checkout -b feat/你的任务名
```

如果团队统一要求中文分支，也可以用：

```bash
git checkout -b feat/frontend-home-history
git checkout -b feat/backend-redo-all-stages
git checkout -b feat/export-full-package
```

### 分支归属建议

| 人 | 分支建议 |
|---|---|
| 前端 1 | `feat/frontend-project-home-intake` |
| 前端 2 | `feat/frontend-workbench-deliverables` |
| 后端 1 | `feat/backend-redo-state-api` |
| 后端 2 | `feat/backend-model-export-package` |
| UI | 不一定需要代码分支，交付 Figma/图片/说明即可 |

### 冲突规则

- 前端 1 尽量不要改 `features/workbench/**`。
- 前端 2 尽量不要改 `features/projects/project-workspace.tsx` 的 API 主逻辑，除非和前端 1 同步。
- 后端 1 改 API 时要同步告诉前端字段。
- 后端 2 改 schema 时必须同步前端 2。
- UI 改文案和布局前，先确定按钮状态，不要只给静态图。

## 开发顺序建议

### 第 1 轮：补齐项目经理流程缺口

目标：让流程图里每个分支都能落到按钮和接口。

任务：

1. 后端 1：补全 `LOGO / VI / IP / MATERIALS / REVIEW / PROPOSAL` redo。
2. 后端 2：redo 时接收用户反馈并进入 prompt。
3. 前端 2：所有阶段加“不满意，重新生成”按钮。
4. UI：设计每阶段“不满意”的弹窗或输入框。
5. 前端 1：历史记录和首页状态补齐。

验收：

```text
每个阶段用户都可以：
看结果 -> 满意确认 -> 不满意输入原因重新生成
```

### 第 2 轮：补齐交付下载

目标：最终项目完成后能交付给用户。

任务：

1. 后端：PDF 导出。
2. 后端：完整 ZIP，包含提案和图片资产。
3. 后端：资产列表和资产下载。
4. 前端：最终提案页展示下载按钮。
5. UI：下载区设计。

验收：

```text
用户完成 Proposal 后，能下载 PDF 和完整 ZIP。
ZIP 解压后能看到 proposal.md / proposal.pdf / manifest / assets。
```

### 第 3 轮：接真实大模型

目标：让 fake 模型变成真实模型。

任务：

1. 后端 2：确认 provider。
2. 后端 2：配置真实 API Key。
3. 后端 2：跑真实文本输出。
4. 后端 2：跑真实图片输出。
5. 后端 1：错误码和超时处理。
6. 前端：生成时间变长后的 loading 和失败重试。

验收：

```text
同一条完整链路使用真实模型跑通。
失败时前端能看到可理解错误。
```

### 第 4 轮：体验和稳定性

目标：接近可演示版本。

任务：

1. UI 完整统一视觉。
2. 前端做移动端和宽屏适配。
3. 后端补更多测试。
4. 补 CI。
5. 补演示数据和操作手册。

## 每日协作方式

每天同步时只问 5 个问题：

1. 昨天完成了哪个按钮或接口？
2. 今天准备完成哪个按钮或接口？
3. 有没有改 API 字段？
4. 有没有需要别人配合？
5. 本地有没有跑通最小验收？

不要只说“我在优化页面”。要说：

```text
我今天完成了 Logo 重新生成按钮，调用 /stages/logo/redo，能拿到新的 LOGO run。
```

## 每个人提交前必须做

前端：

```bash
npm run typecheck:web
npm run lint:web
npm run test:web
```

后端：

```bash
UV_CACHE_DIR=/private/tmp/aline-uv-cache uv run ruff check .
UV_CACHE_DIR=/private/tmp/aline-uv-cache uv run pytest
```

全栈联调：

```bash
./scripts/verify-stack.sh
```

当前 `lint:web` 有一个老 warning：

```text
apps/web/features/logo/logo-result.tsx 使用 <img>
```

这是非阻塞 warning，不影响通过。

## 产品需要尽快确认的问题

这些问题会影响工程师开发范围。已确认的直接写结果，未确认的继续等产品补充：

1. Logo 到底生成 3 个还是 4 个？已确认：3 个。
2. 物料场景固定几个？暂按当前 2 个继续：社交媒体封面、基础包装。
3. 用户完成项目后，是否还能回到中间阶段重做？本轮建议仍按当前规则：完成后不允许重做，避免状态复杂。
4. 最终交付必须有 PDF 吗？本轮按“需要 PDF”推进。
5. ZIP 里必须包含哪些文件？建议本轮包含 `proposal.pdf`、`proposal.md`、`proposal-manifest.json`、`assets/` 图片素材；如产品另有清单再调整。
6. 是否需要用户上传参考图？
7. 历史记录是否需要搜索、筛选、删除？
8. 大模型用哪家？谁提供 key？

## 推荐给项目经理的一句话

可以这样汇报：

```text
当前品牌生成主流程已经跑通，可以从需求输入一路到最终提案完成。
接下来不是重做项目，而是补齐正式版能力：全阶段重新生成、完整 PDF/ZIP 交付包、真实大模型接入、首页历史记录和 UI 状态。
我们建议两前端、两后端、UI 并行推进，先用一轮把项目经理流程图里的缺口补齐。
```

## 下一步建议

最推荐马上开 4 张任务卡：

1. 后端 1：全阶段 redo 接口。
2. 后端 2：完整导出包 + PDF。
3. 前端 1：首页 / 历史记录 / 项目入口。
4. 前端 2：工作台重新生成按钮 + 下载区。

UI 同步给所有页面的线框和按钮状态。

这 4 张做完后，项目经理图里的功能就基本能对上。
