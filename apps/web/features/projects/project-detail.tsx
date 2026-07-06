import { Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import type { DirectionOutput } from "@/features/directions/types";
import { IntakeQuestions } from "@/features/intake/intake-questions";
import type { LogoOutput } from "@/features/logo/types";
import { DirectionsLogoWorkbench } from "@/features/workbench";
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

function StageRunTimeline({ runs }: { runs: StageRunResponse[] }) {
  if (runs.length === 0) {
    return <EmptyState title="暂无任务">创建项目后会出现 Intake Run。</EmptyState>;
  }

  return (
    <ol className="run-list">
      {runs.map((run) => (
        <li key={run.id}>
          <span>
            <strong>{run.stage}</strong>
            <small>{run.id}</small>
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
        title={`${activeRun.stage} ${statusLabels[activeRun.status] ?? activeRun.status}`}
      />
    );
  }

  if (activeRun.status === "FAILED") {
    return (
      <ErrorState title={`${activeRun.stage} 任务失败`}>
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
        <span className="step-pill">Intake 完成</span>
        <h2>品牌信息已满足生成条件</h2>
        <p>当前 Intake Run 已成功完成，可以继续生成品牌方向。</p>
        <div className="inline-actions">
          <Button
            disabled={isSubmittingAnswers}
            onClick={() => {
              void onSubmitIntakeAnswers(activeRun.id, []);
            }}
          >
            {isSubmittingAnswers ? "正在继续" : "继续生成方向"}
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
        <p>结果版本：{activeRun.result_version_id ?? "后端未返回版本 ID"}</p>
        <p>下一步可以进入品牌方向选择。</p>
      </div>
    );
  }

  if (activeRun.status === "WAITING_USER") {
    return (
      <div className="success-panel">
        <span className="step-pill">{activeRun.stage}</span>
        <h2>等待人工选择</h2>
        <p>当前阶段已生成到人工决策点，请在工作台中继续选择或确认。</p>
      </div>
    );
  }

  return (
    <div className="success-panel">
      <span className="step-pill">{activeRun.stage}</span>
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

  return (
    <div className="detail-layout">
      <section className="detail-main">
        <header className="project-heading">
          <span className="step-pill">{project.current_stage}</span>
          <h1>{project.name}</h1>
          <p>
            项目状态：{project.status} · 版本 {project.version}
          </p>
          <Button onClick={onRefresh} variant="secondary">
            刷新状态
          </Button>
        </header>

        <ActiveRunPanel
          activeRun={activeRun}
          isPolling={isPolling}
          isSubmittingAnswers={isSubmittingAnswers}
          onSubmitIntakeAnswers={onSubmitIntakeAnswers}
        />

      </section>

      <aside className="detail-side">
        <section className="side-section">
          <h2>BrandSpec</h2>
          <dl className="spec-list">
            {BRAND_SPEC_FIELDS.map((field) => (
              <div key={field.key}>
                <dt>{field.label}</dt>
                <dd>{formatJsonValue(project.brand_spec[field.key])}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="side-section">
          <h2>Stage Runs</h2>
          <StageRunTimeline runs={project.stage_runs} />
        </section>
      </aside>

      {workbench ? (
        <section className="workbench-section">
          <header className="section-heading">
            <span className="step-pill">Workbench</span>
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
