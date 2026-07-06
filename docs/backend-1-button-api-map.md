# 后端 1 按钮接口对接表

更新时间：2026-07-06  
角色边界：后端 1 负责“每点一个按钮，项目进入哪一步”。

如果是第一次接手，建议先读小白版总览：

```text
docs/backend-1-final-handoff.md
```

## 联调地址

统一 API 前缀：

```text
/api/v1
```

当前本机为了避开旧目录容器，建议使用：

```text
Web      http://127.0.0.1:13000
Gateway  http://127.0.0.1:18080
API Docs http://127.0.0.1:18000/api/docs
```

浏览器侧优先走 Gateway：

```text
http://127.0.0.1:18080/api/v1
```

## 通用规则

- 前端只调用 HTTP API，不读数据库、Redis、Celery、checkpoint 或容器日志。
- 创建项目后保存 `project.id` 和当前 `stage_run.id`。
- 每次产生新的 `stage_run.id` 后，用 `GET /stage-runs/{stage_run_id}` 轮询。
- 建议每 1-2 秒轮询一次，遇到 `SUCCEEDED`、`FAILED` 或 `WAITING_USER` 停止。
- `FAILED` 时展示 `error_code` 和 `error_message`。
- 页面刷新后调用 `GET /projects/{project_id}/state` 恢复当前阶段。
- 所有选择/确认按钮允许重复点击；同一选择重复提交会返回原结果，不应创建重复任务。
- 项目进入 `COMPLETED` 后，只允许读取状态和导出，不再允许继续选择、确认、redo、skip、generate。

## 按钮主流程

| 用户动作 | 调用接口 | 请求关键字段 | 成功后下一步 |
|---|---|---|---|
| 创建项目 | `POST /projects` | `name`、`requirement_text`、`structured_fields`、`reference_artifact_ids` | 返回 `INTAKE` run，轮询该 run |
| 提交 Intake 答案 | `POST /stage-runs/{intake_run_id}/intake-answers` | `answers` | 返回 `DIRECTIONS` run，轮询该 run |
| Intake 已 ready，继续 | `POST /stage-runs/{intake_run_id}/intake-answers` | `answers: []` | 返回 `DIRECTIONS` run，轮询该 run |
| 选择 Directions | `POST /projects/{project_id}/stages/directions/decisions` | `version_id`、`selected_item_id`、`action: "SELECT_VERSION"` | 返回 `LOGO` run，轮询该 run |
| 选择 Logo | `POST /projects/{project_id}/stages/logo/decisions` | `version_id`、`selected_item_id`、`action: "SELECT_VERSION"` | 返回 `VI` run，轮询该 run |
| 确认 VI | `POST /projects/{project_id}/stages/vi/decisions` | `version_id`、`action: "CONFIRM_VERSION"`、`confirmed: true` | 返回 `IP` run，轮询到 `WAITING_USER` |
| 生成 IP | `POST /projects/{project_id}/stages/ip/generate` | 可空，或 `reason` | 调 `/state` 取最新 `IP` run，轮询到 `SUCCEEDED` |
| 确认 IP | `POST /projects/{project_id}/stages/ip/decisions` | `version_id`、`action: "CONFIRM_VERSION"`、`confirmed: true` | 返回 `MATERIALS` run，轮询该 run |
| 跳过 IP | `POST /projects/{project_id}/stages/ip/skip` | 可空，或 `reason` | 调 `/state` 取最新 `MATERIALS` run，轮询该 run |
| 确认 Materials | `POST /projects/{project_id}/stages/materials/decisions` | `version_id`、`action: "CONFIRM_VERSION"`、`confirmed: true` | 返回 `REVIEW` run，轮询该 run |
| 确认 Review | `POST /projects/{project_id}/stages/review/decisions` | `version_id`、`action: "CONFIRM_VERSION"`、`confirmed: true` | 返回 `PROPOSAL` run，轮询该 run |
| 确认 Proposal | `POST /projects/{project_id}/stages/proposal/decisions` | `version_id`、`action: "CONFIRM_VERSION"`、`confirmed: true` | 项目变为 `COMPLETED`，不用派发 worker |

## 轮询接口

```http
GET /api/v1/stage-runs/{stage_run_id}
```

前端主要读取：

```json
{
  "id": "stage-run-id",
  "project_id": "project-id",
  "stage": "DIRECTIONS",
  "status": "SUCCEEDED",
  "error_code": null,
  "error_message": null,
  "result_version_id": "stage-version-id",
  "result": {}
}
```

状态含义：

| status | 前端行为 |
|---|---|
| `QUEUED` | 显示排队中，继续轮询 |
| `RUNNING` | 显示生成中，继续轮询 |
| `SUCCEEDED` | 停止轮询，使用 `result` 和 `result_version_id` |
| `WAITING_USER` | 停止轮询，展示用户选择按钮；当前主要用于 IP 生成/跳过选择 |
| `FAILED` | 停止轮询，展示 `error_code` / `error_message` |

## 每阶段结果怎么取 ID

| 阶段 | 前端展示列表 | 后续按钮使用的 ID |
|---|---|---|
| `DIRECTIONS` | `result.directions[]` | `directions[i].id` 作为 `selected_item_id` |
| `LOGO` | `result.concepts[]` | `concepts[i].id` 作为 `selected_item_id` |
| `VI` | `result` | `result_version_id` 用于确认 VI |
| `IP` | `result` | `result_version_id` 用于确认 IP；跳过 IP 时没有 IP version |
| `MATERIALS` | `result.scenes[]` | `result_version_id` 用于确认 Materials |
| `REVIEW` | `result` | `result_version_id` 用于确认 Review |
| `PROPOSAL` | `result` | `result_version_id` 用于最终确认 Proposal |

## 请求示例

选择方向：

```json
{
  "version_id": "directions-version-id",
  "selected_item_id": "direction-clear",
  "action": "SELECT_VERSION"
}
```

确认阶段：

```json
{
  "version_id": "vi-version-id",
  "action": "CONFIRM_VERSION",
  "confirmed": true
}
```

跳过 IP：

```json
{
  "reason": "no mascot needed"
}
```

生成 IP：

```json
{
  "reason": "need a brand character"
}
```

## 页面刷新恢复

```http
GET /api/v1/projects/{project_id}/state
```

返回里最重要的字段：

```json
{
  "project": {
    "id": "project-id",
    "current_stage": "LOGO",
    "status": "ACTIVE"
  },
  "current_stage": "LOGO",
  "stage_runs": {
    "LOGO": {
      "id": "logo-run-id",
      "status": "QUEUED"
    }
  },
  "versions": {
    "DIRECTIONS": {
      "id": "directions-version-id",
      "status": "GENERATED",
      "output": {}
    }
  },
  "decisions": []
}
```

恢复规则：

| 场景 | 前端动作 |
|---|---|
| 当前阶段最新 run 是 `QUEUED` / `RUNNING` | 继续轮询该 run |
| 当前阶段最新 run 是 `SUCCEEDED` | 展示该阶段结果和下一步按钮 |
| 当前阶段最新 run 是 `WAITING_USER` | 展示等待用户选择的按钮，例如 IP 生成/跳过 |
| 当前阶段最新 run 是 `FAILED` | 展示失败信息和可用的重试/redo 入口 |
| `project.status` 是 `COMPLETED` | 展示完成态和导出入口，不再显示修改按钮 |

## Redo 按钮

当前真实支持：

| 用户动作 | 调用接口 | 请求关键字段 | 成功后下一步 |
|---|---|---|---|
| 重做 Intake | `POST /projects/{project_id}/stages/intake/redo` | `source_version_id`、可选 `reason` | 调 `/state` 取最新 `INTAKE` run，轮询该 run |
| 重做 Directions | `POST /projects/{project_id}/stages/directions/redo` | `source_version_id`、可选 `reason` | 调 `/state` 取最新 `DIRECTIONS` run，轮询该 run |

请求示例：

```json
{
  "source_version_id": "stage-version-id",
  "reason": "try another direction"
}
```

其他阶段 redo 当前返回 `409`，前端不要先做成可点击主入口。

## 导出按钮

项目完成后可用：

| 用户动作 | 调用接口 | 返回 |
|---|---|---|
| 查看 Proposal 导出清单 | `GET /projects/{project_id}/exports/proposal-manifest` | JSON manifest |
| 下载 Markdown 提案 | `GET /projects/{project_id}/exports/proposal.md` | `text/markdown` 文件 |
| 下载 ZIP 交付包 | `GET /projects/{project_id}/exports/proposal.zip` | `application/zip` 文件 |

项目未完成时这些接口返回 `409`。

## 常见错误处理

| HTTP 状态 | 典型原因 | 前端处理 |
|---|---|---|
| `404` | 项目、run 或 version 不存在 | 提示资源不存在，停止当前操作 |
| `409` | 阶段状态冲突、版本已过期、项目已完成、重复选择冲突 | 展示后端 `detail`，刷新 `/state` |
| `422` | 请求字段缺失、stage key 非法、payload 形状错误 | 标出表单或按钮调用问题 |
| run `FAILED` | 模型或 workflow 执行失败 | 展示 `error_code` / `error_message`，保留恢复入口 |

## 后端 1 当前验收状态

已在本地用 fake 模型跑通：

```text
INTAKE
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

真实联调项目：

```text
24e9a817-6b87-4ed0-8085-ce5e3209bfea
```
