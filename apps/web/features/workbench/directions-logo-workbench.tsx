"use client";

import { useState } from "react";

import { StageNavigation } from "@/components/workbench/stage-navigation";
import { DirectionsResult } from "@/features/directions/directions-result";
import type { DirectionOutput } from "@/features/directions/types";
import { LogoResult } from "@/features/logo/logo-result";
import type { LogoOutput } from "@/features/logo/types";
import { formatVersionBadge } from "@/features/workbench/stage-copy";

import { StageOutputPanel } from "./stage-output-panel";
import type {
  ConfirmableStageOutput,
  StageControlSelection,
  VersionConfirmation,
  VersionItemSelection,
  WorkbenchStageSummary,
} from "./types";
import styles from "./directions-logo-workbench.module.css";

type DirectionsLogoWorkbenchProps = {
  assetUrls?: Record<string, string>;
  directions?: {
    output: DirectionOutput;
    version_id: string;
    selected_item_id?: string | null;
  } | null;
  logo?: {
    output: LogoOutput;
    version_id: string;
    selected_item_id?: string | null;
  } | null;
  confirmableOutputs?: ConfirmableStageOutput[];
  ipChoicePending?: boolean;
  isSubmittingDecision?: boolean;
  projectId?: string | null;
  stages: WorkbenchStageSummary[];
  onConfirm: (confirmation: VersionConfirmation) => void;
  onControlStage: (selection: StageControlSelection) => void;
  onSelect: (selection: VersionItemSelection) => void;
};

export function DirectionsLogoWorkbench({
  assetUrls = {},
  confirmableOutputs = [],
  directions,
  ipChoicePending = false,
  isSubmittingDecision = false,
  logo,
  onConfirm,
  onControlStage,
  projectId,
  stages,
  onSelect,
}: DirectionsLogoWorkbenchProps) {
  const [pendingSelection, setPendingSelection] = useState<VersionItemSelection | null>(null);

  function handleSelect(selection: VersionItemSelection) {
    setPendingSelection(selection);
    onSelect(selection);
  }

  const selectedDirectionId =
    pendingSelection?.stage === "DIRECTIONS"
      ? pendingSelection.item_id
      : directions?.selected_item_id;
  const selectedLogoId =
    pendingSelection?.stage === "LOGO" ? pendingSelection.item_id : logo?.selected_item_id;

  return (
    <section className={styles.shell}>
      <aside className={styles.sidebar}>
        <StageNavigation stages={stages} />
      </aside>

      <div className={styles.content}>
        <section className={styles.panel}>
          <PanelHeader title="品牌方向" versionId={directions?.version_id} />
          {directions ? (
            <DirectionsResult
              isLocked={Boolean(selectedDirectionId) || isSubmittingDecision}
              onSelect={handleSelect}
              output={directions.output}
              selectedDirectionId={selectedDirectionId}
              versionId={directions.version_id}
            />
          ) : (
            <div className={styles.empty}>方向生成完成后会显示在这里。</div>
          )}
        </section>

        <section className={styles.panel}>
          <PanelHeader title="Logo 方案" versionId={logo?.version_id} />
          {logo ? (
            <LogoResult
              assetUrls={assetUrls}
              isLocked={Boolean(selectedLogoId) || isSubmittingDecision}
              onSelect={handleSelect}
              output={logo.output}
              selectedLogoId={selectedLogoId}
              versionId={logo.version_id}
            />
          ) : (
            <div className={styles.empty}>选择品牌方向后，Logo 方案会显示在这里。</div>
          )}
        </section>

        {confirmableOutputs.map((item) => (
          <StageOutputPanel
            assetUrls={assetUrls}
            isSubmitting={isSubmittingDecision}
            item={item}
            key={`${item.stage}-${item.version_id}`}
            onConfirm={onConfirm}
            projectId={projectId}
          />
        ))}

        {ipChoicePending ? (
          <section className={styles.panel}>
            <PanelHeader title="品牌 IP" />
            <div className={styles.choicePanel}>
              <div>
                <h3>这一步由你决定要不要做品牌角色</h3>
                <p>需要吉祥物或虚拟形象就生成 IP；暂时只做视觉和物料，可以直接跳过。</p>
              </div>
              <div className={styles.choiceActions}>
                <button
                  className={styles.secondaryButton}
                  disabled={isSubmittingDecision}
                  onClick={() =>
                    onControlStage({
                      stage: "IP",
                      action: "skip",
                      reason: "No brand character needed for this round",
                    })
                  }
                  type="button"
                >
                  {isSubmittingDecision ? "处理中" : "跳过 IP"}
                </button>
                <button
                  className={styles.primaryButton}
                  disabled={isSubmittingDecision}
                  onClick={() =>
                    onControlStage({
                      stage: "IP",
                      action: "generate",
                      reason: "Generate a brand character for applications",
                    })
                  }
                  type="button"
                >
                  {isSubmittingDecision ? "生成中" : "生成 IP"}
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

function PanelHeader({ title, versionId }: { title: string; versionId?: string }) {
  return (
    <div className={styles.header}>
      <h2>{title}</h2>
      <span title={versionId}>{formatVersionBadge(versionId)}</span>
    </div>
  );
}
