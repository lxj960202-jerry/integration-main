import { Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import type { DirectionOutput } from "@/features/directions/types";
import { IntakeQuestions } from "@/features/intake/intake-questions";
import type { LogoOutput } from "@/features/logo/types";
import { DirectionsLogoWorkbench } from "@/features/workbench";
import { formatStageLabel } from "@/features/workbench/stage-copy";
import type {
  ConfirmableStageOutput,
  IPOutput,
  MaterialOutput,
  ProposalOutput,
  ReviewOutput,
  StageControlSelection,
  VersionItemSelection,
  VersionConfirmation,
  VIOutput,
  WorkbenchStage,
  WorkbenchStageSummary,
} from "@/features/workbench/types";
import type {
  IntakeAnswer,
  IntakeResult,
  JsonValue,
  ProjectDetailResponse,
  ProjectStateResponse,
  StageRunDetailResponse,
  StageRunResponse,
  StageVersionStateResponse,
} from "@/lib/api/types";

import { BRAND_SPEC_FIELDS } from "./fields";

type ProjectDetailProps = {
  activeRun: StageRunDetailResponse | null;
  isLoading: boolean;
  isPolling: boolean;
  isSubmittingAnswers: boolean;
  isSubmittingDecision: boolean;
  onRefresh: () => void;
  onConfirmStage: (confirmation: VersionConfirmation) => Promise<void>;
  onControlStage: (selection: StageControlSelection) => Promise<void>;
  onSelectVersionItem: (selection: VersionItemSelection) => Promise<void>;
  onSubmitIntakeAnswers: (intakeRunId: string, answers: IntakeAnswer[]) => Promise<void>;
  project: ProjectDetailResponse | null;
  projectState: ProjectStateResponse | null;
};

const statusLabels: Record<string, string> = {
  QUEUED: "排队中",
  RUNNING: "生成中",
  SUCCEEDED: "已完成",
  FAILED: "失败",
  WAITING_USER: "等待选择",
};

const projectStatusLabels: Record<string, string> = {
  ACTIVE: "进行中",
  COMPLETED: "已完成",
  ARCHIVED: "已归档",
};

const WORKBENCH_STAGES: WorkbenchStage[] = [
  "DIRECTIONS",
  "LOGO",
  "VI",
  "IP",
  "MATERIALS",
  "REVIEW",
  "PROPOSAL",
];

const CONFIRMABLE_STAGES: ConfirmableStageOutput["stage"][] = [
  "VI",
  "IP",
  "MATERIALS",
  "REVIEW",
  "PROPOSAL",
];

function isIntakeResult(result: StageRunDetailResponse["result"]): result is IntakeResult {
  return Boolean(
    result &&
      typeof result === "object" &&
      "ready" in result &&
      "questions" in result &&
      Array.isArray(result.questions),
  );
}

function hasStageOutput(output: Record<string, JsonValue> | undefined) {
  return Boolean(output && typeof output === "object" && !Array.isArray(output));
}

function isDirectionOutput(output: Record<string, JsonValue> | undefined): output is DirectionOutput {
  return hasStageOutput(output);
}

function isLogoOutput(output: Record<string, JsonValue> | undefined): output is LogoOutput {
  return hasStageOutput(output);
}

function isVIOutput(output: Record<string, JsonValue> | undefined): output is VIOutput {
  return hasStageOutput(output);
}

function isIPOutput(output: Record<string, JsonValue> | undefined): output is IPOutput {
  return hasStageOutput(output);
}

function isMaterialOutput(output: Record<string, JsonValue> | undefined): output is MaterialOutput {
  return hasStageOutput(output);
}

function isReviewOutput(output: Record<string, JsonValue> | undefined): output is ReviewOutput {
  return hasStageOutput(output);
}

function isProposalOutput(output: Record<string, JsonValue> | undefined): output is ProposalOutput {
  return hasStageOutput(output);
}

function latestDecisionFor(
  projectState: ProjectStateResponse,
  stage: WorkbenchStage,
  versionId: string,
  actions: string[],
) {
  return [...projectState.decisions]
    .filter(
      (decision) =>
        decision.stage === stage &&
        decision.source_version_id === versionId &&
        actions.includes(decision.action),
    )
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )[0];
}

function latestSelectionFor(
  projectState: ProjectStateResponse,
  stage: WorkbenchStage,
  versionId: string,
) {
  return latestDecisionFor(projectState, stage, versionId, ["SELECT_VERSION"])?.selected_item_id;
}

function latestConfirmationFor(
  projectState: ProjectStateResponse,
  stage: WorkbenchStage,
  versionId: string,
) {
  return latestDecisionFor(projectState, stage, versionId, ["CONFIRM_VERSION"]);
}

function hasIpChoiceDecision(projectState: ProjectStateResponse) {
  return projectState.decisions.some(
    (decision) =>
      decision.stage === "IP" &&
      (decision.action === "SKIP" || decision.action === "GENERATE"),
  );
}

function getStageStatus(
  projectState: ProjectStateResponse,
  stage: WorkbenchStage,
  version: StageVersionStateResponse | undefined,
): WorkbenchStageSummary["status"] {
  const run = projectState.stage_runs[stage];
  const selectedItemId = version ? latestSelectionFor(projectState, stage, version.id) : null;
  const confirmed = version ? latestConfirmationFor(projectState, stage, version.id) : null;

  if (stage === "IP" && hasIpChoiceDecision(projectState) && !version) {
    return "CONFIRMED";
  }
  if (run?.status === "QUEUED" || run?.status === "RUNNING") {
    return "GENERATING";
  }
  if (stage === "IP" && run?.status === "WAITING_USER" && !hasIpChoiceDecision(projectState)) {
    return "AWAITING_DECISION";
  }
  if (version?.status === "STALE") {
    return "STALE";
  }
  if (selectedItemId || confirmed) {
    return "CONFIRMED";
  }
  if (stage === "IP" && run?.status === "WAITING_USER") {
    return "AWAITING_DECISION";
  }
  if (version?.status === "GENERATED" || run?.status === "WAITING_USER") {
    return "AWAITING_DECISION";
  }
  return "LOCKED";
}

function buildWorkbenchStages(projectState: ProjectStateResponse): WorkbenchStageSummary[] {
  return WORKBENCH_STAGES.map((stage) => {
    const version = projectState.versions[stage];
    return {
      stage,
      status: getStageStatus(projectState, stage, version),
      version_id: version?.id ?? null,
      selected_item_id: version ? latestSelectionFor(projectState, stage, version.id) ?? null : null,
    };
  });
}

function buildConfirmableStageOutput(
  projectState: ProjectStateResponse,
  stage: ConfirmableStageOutput["stage"],
): ConfirmableStageOutput | null {
  const version = projectState.versions[stage];
  if (!version) {
    return null;
  }

  const confirmed = Boolean(latestConfirmationFor(projectState, stage, version.id));
  const base = {
    version_id: version.id,
    confirmed,
    status: version.status,
  };

  if (stage === "VI" && isVIOutput(version.output)) {
    return {
      ...base,
      stage,
      output: version.output,
    };
  }
  if (stage === "IP" && isIPOutput(version.output)) {
    return {
      ...base,
      stage,
      output: version.output,
    };
  }
  if (stage === "MATERIALS" && isMaterialOutput(version.output)) {
    return {
      ...base,
      stage,
      output: version.output,
    };
  }
  if (stage === "REVIEW" && isReviewOutput(version.output)) {
    return {
      ...base,
      stage,
      output: version.output,
    };
  }
  if (stage === "PROPOSAL" && isProposalOutput(version.output)) {
    return {
      ...base,
      stage,
      output: version.output,
    };
  }

  return null;
}

function buildWorkbenchProps(projectState: ProjectStateResponse | null) {
  if (!projectState) {
    return null;
  }

  const directionsVersion = projectState.versions.DIRECTIONS;
  const logoVersion = projectState.versions.LOGO;
  const directionsOutput = isDirectionOutput(directionsVersion?.output)
    ? directionsVersion.output
    : null;
  const logoOutput = isLogoOutput(logoVersion?.output) ? logoVersion.output : null;
  const confirmableOutputs = CONFIRMABLE_STAGES.map((stage) =>
    buildConfirmableStageOutput(projectState, stage),
  ).filter((item): item is ConfirmableStageOutput => item !== null);
  const ipChoicePending =
    projectState.stage_runs.IP?.status === "WAITING_USER" && !hasIpChoiceDecision(projectState);

  if (!directionsOutput && !logoOutput && confirmableOutputs.length === 0 && !ipChoicePending) {
    return null;
  }

  return {
    directions:
      directionsVersion && directionsOutput
        ? {
            output: directionsOutput,
            version_id: directionsVersion.id,
            selected_item_id: latestSelectionFor(
              projectState,
              "DIRECTIONS",
              directionsVersion.id,
            ),
          }
        : null,
    logo:
      logoVersion && logoOutput
        ? {
            output: logoOutput,
            version_id: logoVersion.id,
            selected_item_id: latestSelectionFor(projectState, "LOGO", logoVersion.id),
          }
        : null,
    confirmableOutputs,
    ipChoicePending,
    stages: buildWorkbenchStages(projectState),
  };
}

function formatJsonValue(value: JsonValue | undefined) {
  if (value === undefined || value === null || value === "") {
    return "未填写";
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join("、") : "未填写";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

type UserActionCopy = {
  description: string;
  title: string;
  tone: "active" | "danger" | "success" | "waiting";
};

function formatProjectStatus(status: string) {
  return projectStatusLabels[status] ?? status;
}

function getStageActionCopy(stage: WorkbenchStage, status: WorkbenchStageSummary["status"]) {
  if (status === "STALE") {
    return {
      title: `${formatStageLabel(stage)}需要重新处理`,
      description: "前面的选择已经变化，这一步结果需要重新生成或重新确认后才能继续。",
      tone: "waiting",
    } satisfies UserActionCopy;
  }

  const copies: Record<WorkbenchStage, UserActionCopy> = {
    DIRECTIONS: {
      title: "选择一个品牌方向",
      description: "在下面几套方向里选最符合业务的一套，选完后系统会继续生成 Logo。",
      tone: "active",
    },
    LOGO: {
      title: "选择一个 Logo 方案",
      description: "从 Logo 方案里选一套作为后续视觉规范的基础。",
      tone: "active",
    },
    VI: {
      title: "确认视觉规范",
      description: "检查颜色、字体和 Logo 使用规则，没问题就确认进入下一步。",
      tone: "active",
    },
    IP: {
      title: "决定是否需要品牌 IP",
      description: "需要品牌角色就生成 IP；暂时不需要可以跳过，流程会继续做物料。",
      tone: "active",
    },
    MATERIALS: {
      title: "确认应用物料",
      description: "检查社交封面、包装等应用场景，确认后进入审稿检查。",
      tone: "active",
    },
    REVIEW: {
      title: "确认审稿结果",
      description: "查看系统检查出的风险和建议，确认后会生成最终提案。",
      tone: "active",
    },
    PROPOSAL: {
      title: "完成最终提案",
      description: "最终提案已经生成，确认后这个项目就会标记为已完成。",
      tone: "active",
    },
  };

  return copies[stage];
}

function buildUserActionCopy(
  project: ProjectDetailResponse,
  activeRun: StageRunDetailResponse | null,
  workbench: ReturnType<typeof buildWorkbenchProps>,
): UserActionCopy {
  if (activeRun?.status === "FAILED") {
    return {
      title: `${formatStageLabel(activeRun.stage)}失败`,
      description: "先查看失败原因，修复后再刷新状态或重新提交。",
      tone: "danger",
    };
  }

  if (activeRun?.status === "QUEUED" || activeRun?.status === "RUNNING") {
    return {
      title: `正在生成${formatStageLabel(activeRun.stage)}`,
      description: "不用重复点击，生成完成后页面会自动同步下一步。",
      tone: "waiting",
    };
  }

  if (activeRun?.stage === "INTAKE" && isIntakeResult(activeRun.result)) {
    if (!activeRun.result.ready) {
      return {
        title: "先补充品牌信息",
        description: "把下面的问题填完，系统才能判断是否可以开始生成。",
        tone: "active",
      };
    }

    return {
      title: "进入品牌方向生成",
      description: "基础信息已经够用了，点击下方按钮开始生成品牌方向。",
      tone: "active",
    };
  }

  const generatingStage = workbench?.stages.find((stage) => stage.status === "GENERATING");
  if (generatingStage) {
    return {
      title: `正在生成${formatStageLabel(generatingStage.stage)}`,
      description: "稍等片刻，结果出来后这里会切换成可操作的下一步。",
      tone: "waiting",
    };
  }

  const nextStage = workbench?.stages.find(
    (stage) => stage.status === "AWAITING_DECISION" || stage.status === "STALE",
  );
  if (nextStage) {
    return getStageActionCopy(nextStage.stage, nextStage.status);
  }

  if (project.status === "COMPLETED") {
    return {
      title: "项目已完成",
      description: "可以在最终提案区域查看结果，后续要改网页或接大模型时可以基于这个版本继续。",
      tone: "success",
    };
  }

  return {
    title: "等待下一步",
    description: "当前没有需要点击的按钮，可以刷新状态确认是否有新的生成结果。",
    tone: "waiting",
  };
}

function UserActionPanel({ action }: { action: UserActionCopy }) {
  return (
    <section aria-live="polite" className={`user-action user-action--${action.tone}`}>
      <span>当前操作</span>
      <h2>{action.title}</h2>
      <p>{action.description}</p>
    </section>
  );
}

function StageRunTimeline({ runs }: { runs: StageRunResponse[] }) {
  if (runs.length === 0) {
    return <EmptyState title="暂无任务">创建项目后会出现 Intake Run。</EmptyState>;
  }

  return (
    <ol className="run-list">
      {runs.map((run) => (
        <li key={run.id}>
          <span>
            <strong>{formatStageLabel(run.stage)}</strong>
            <small>任务 {run.id.slice(0, 8)}</small>
          </span>
          <em className={`run-status run-status--${run.status.toLowerCase()}`}>
            {statusLabels[run.status] ?? run.status}
          </em>
        </li>
      ))}
    </ol>
  );
}

function ActiveRunPanel({
  activeRun,
  isPolling,
  isSubmittingAnswers,
  onSubmitIntakeAnswers,
}: Pick<
  ProjectDetailProps,
  "activeRun" | "isPolling" | "isSubmittingAnswers" | "onSubmitIntakeAnswers"
>) {
  if (!activeRun) {
    return <EmptyState title="暂无当前任务">请选择项目或创建新项目。</EmptyState>;
  }

  if (activeRun.status === "QUEUED" || activeRun.status === "RUNNING") {
    return (
      <LoadingState
        title={`${formatStageLabel(activeRun.stage)} ${
          statusLabels[activeRun.status] ?? activeRun.status
        }`}
      />
    );
  }

  if (activeRun.status === "FAILED") {
    return (
      <ErrorState title={`${formatStageLabel(activeRun.stage)}任务失败`}>
        {activeRun.error_message ?? activeRun.error_code ?? "后端未返回错误信息。"}
      </ErrorState>
    );
  }

  if (activeRun.stage === "INTAKE" && isIntakeResult(activeRun.result)) {
    if (!activeRun.result.ready) {
      return (
        <IntakeQuestions
          key={`${activeRun.id}:${activeRun.result.questions
            .map((question) => question.id)
            .join("|")}`}
          intakeRunId={activeRun.id}
          isSubmitting={isSubmittingAnswers}
          onSubmit={onSubmitIntakeAnswers}
          result={activeRun.result}
        />
      );
    }

    return (
      <div className="success-panel">
        <span className="step-pill">信息整理完成</span>
        <h2>品牌信息已满足生成条件</h2>
        <p>基础信息已经确认完成，下一步会进入品牌方向生成。</p>
        <div className="inline-actions">
          <Button
            disabled={isSubmittingAnswers}
            onClick={() => {
              void onSubmitIntakeAnswers(activeRun.id, []);
            }}
          >
            {isSubmittingAnswers ? "正在进入品牌方向" : "进入品牌方向"}
          </Button>
        </div>
      </div>
    );
  }

  if (activeRun.stage === "DIRECTIONS" && activeRun.status === "SUCCEEDED") {
    return (
      <div className="success-panel">
        <span className="step-pill">品牌方向</span>
        <h2>品牌方向已生成</h2>
        <p>下一步在工作台中选择一个方向，系统会继续生成 Logo。</p>
      </div>
    );
  }

  if (activeRun.status === "WAITING_USER") {
    return (
      <div className="success-panel">
        <span className="step-pill">{formatStageLabel(activeRun.stage)}</span>
        <h2>等待你选择</h2>
        <p>当前阶段已生成到人工决策点，请在工作台中继续选择或确认。</p>
      </div>
    );
  }

  return (
    <div className="success-panel">
      <span className="step-pill">{formatStageLabel(activeRun.stage)}</span>
      <h2>{statusLabels[activeRun.status] ?? activeRun.status}</h2>
      {isPolling ? <p>正在同步最新状态。</p> : null}
    </div>
  );
}

export function ProjectDetail({
  activeRun,
  isLoading,
  isPolling,
  isSubmittingAnswers,
  isSubmittingDecision,
  onConfirmStage,
  onControlStage,
  onRefresh,
  onSelectVersionItem,
  onSubmitIntakeAnswers,
  project,
  projectState,
}: ProjectDetailProps) {
  if (isLoading) {
    return <LoadingState title="正在读取项目详情" />;
  }

  if (!project) {
    return <EmptyState title="请选择项目">左侧选择已有项目，或创建一个新项目。</EmptyState>;
  }

  const workbench = buildWorkbenchProps(projectState);
  const userAction = buildUserActionCopy(project, activeRun, workbench);

  return (
    <div className="detail-layout">
      <section className="detail-main">
        <header className="project-heading">
          <span className="step-pill">{formatStageLabel(project.current_stage)}</span>
          <h1>{project.name}</h1>
          <p>
            项目状态：{formatProjectStatus(project.status)} · 已保存 {project.version} 次
          </p>
          <Button onClick={onRefresh} variant="secondary">
            刷新状态
          </Button>
        </header>

        <UserActionPanel action={userAction} />

        <ActiveRunPanel
          activeRun={activeRun}
          isPolling={isPolling}
          isSubmittingAnswers={isSubmittingAnswers}
          onSubmitIntakeAnswers={onSubmitIntakeAnswers}
        />

      </section>

      <aside className="detail-side">
        <section className="side-section">
          <h2>品牌信息</h2>
          <dl className="spec-list">
            {BRAND_SPEC_FIELDS.map((field) => (
              <div key={field.key}>
                <dt>{field.label}</dt>
                <dd>{formatJsonValue(project.brand_spec?.[field.key])}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="side-section">
          <h2>生成记录</h2>
          <StageRunTimeline runs={project.stage_runs} />
        </section>
      </aside>

      {workbench ? (
        <section className="workbench-section">
          <header className="section-heading">
            <span className="step-pill">工作台</span>
            <h2>品牌生成工作台</h2>
            {isSubmittingDecision ? <em>正在提交选择</em> : null}
          </header>
          <DirectionsLogoWorkbench
            confirmableOutputs={workbench.confirmableOutputs}
            directions={workbench.directions}
            ipChoicePending={workbench.ipChoicePending}
            isSubmittingDecision={isSubmittingDecision}
            logo={workbench.logo}
            onConfirm={onConfirmStage}
            onControlStage={onControlStage}
            onSelect={onSelectVersionItem}
            projectId={project.id}
            stages={workbench.stages}
          />
        </section>
      ) : null}
    </div>
  );
}
