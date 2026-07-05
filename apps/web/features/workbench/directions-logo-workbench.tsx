"use client";

import { useState } from "react";

import { StageNavigation } from "@/components/workbench/stage-navigation";
import { DirectionsResult } from "@/features/directions/directions-result";
import type { DirectionOutput } from "@/features/directions/types";
import { LogoResult } from "@/features/logo/logo-result";
import type { LogoOutput } from "@/features/logo/types";

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
          <PanelHeader title="Directions" versionId={directions?.version_id} />
          {directions ? (
            <DirectionsResult
              isLocked={Boolean(selectedDirectionId) || isSubmittingDecision}
              onSelect={handleSelect}
              output={directions.output}
              selectedDirectionId={selectedDirectionId}
              versionId={directions.version_id}
            />
          ) : (
            <div className={styles.empty}>暂无 Directions 结果</div>
          )}
        </section>

        <section className={styles.panel}>
          <PanelHeader title="Logo" versionId={logo?.version_id} />
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
            <div className={styles.empty}>暂无 Logo 结果</div>
          )}
        </section>

        {confirmableOutputs.map((item) => (
          <StageOutputPanel
            isSubmitting={isSubmittingDecision}
            item={item}
            key={`${item.stage}-${item.version_id}`}
            onConfirm={onConfirm}
          />
        ))}

        {ipChoicePending ? (
          <section className={styles.panel}>
            <PanelHeader title="IP Choice" />
            <div className={styles.choicePanel}>
              <div>
                <h3>品牌 IP</h3>
                <p>可以生成一个品牌角色，也可以跳过并继续物料阶段。</p>
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
                  跳过 IP
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
                  生成 IP
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
      <span>{versionId ?? "N/A"}</span>
    </div>
  );
}
