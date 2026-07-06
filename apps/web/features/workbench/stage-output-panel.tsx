import { IPResult } from "@/features/ip/ip-result";
import { MaterialsResult } from "@/features/materials/materials-result";
import { ProposalResult } from "@/features/proposal/proposal-result";
import { ReviewResult } from "@/features/review/review-result";
import { VIResult } from "@/features/vi/vi-result";
import { formatStageLabel, formatVersionBadge } from "@/features/workbench/stage-copy";

import type { ConfirmableStageOutput, VersionConfirmation } from "./types";
import styles from "./stage-output-panel.module.css";

type StageOutputPanelProps = {
  assetUrls?: Record<string, string>;
  isSubmitting: boolean;
  item: ConfirmableStageOutput;
  onConfirm: (confirmation: VersionConfirmation) => void;
  projectId?: string | null;
};

export function StageOutputPanel({
  assetUrls = {},
  isSubmitting,
  item,
  onConfirm,
  projectId,
}: StageOutputPanelProps) {
  const canConfirm = item.status === "GENERATED" && !item.confirmed;
  const outputContent = (
    <>
      {item.stage === "VI" ? <VIResult output={item.output} /> : null}
      {item.stage === "IP" ? <IPResult assetUrls={assetUrls} output={item.output} /> : null}
      {item.stage === "MATERIALS" ? (
        <MaterialsResult assetUrls={assetUrls} output={item.output} />
      ) : null}
      {item.stage === "REVIEW" ? <ReviewResult output={item.output} /> : null}
      {item.stage === "PROPOSAL" ? (
        <ProposalResult
          isDownloadReady={item.confirmed}
          output={item.output}
          projectId={projectId}
        />
      ) : null}
    </>
  );

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2>{formatStageLabel(item.stage)}</h2>
          <span title={item.version_id}>{formatVersionBadge(item.version_id)}</span>
        </div>
        <button
          className={styles.button}
          disabled={!canConfirm || isSubmitting}
          onClick={() => onConfirm({ stage: item.stage, version_id: item.version_id })}
          type="button"
        >
          {getConfirmLabel(item, isSubmitting)}
        </button>
      </div>

      {item.confirmed && item.stage !== "PROPOSAL" ? (
        <details className={styles.details}>
          <summary>已确认，点这里回看结果</summary>
          <div className={styles.detailsBody}>{outputContent}</div>
        </details>
      ) : (
        outputContent
      )}
    </section>
  );
}

function getConfirmLabel(item: ConfirmableStageOutput, isSubmitting: boolean) {
  if (item.confirmed) {
    return item.stage === "PROPOSAL" ? "已完成" : "已确认";
  }
  if (isSubmitting) {
    return "正在提交";
  }
  if (item.status === "STALE") {
    return "版本已过期";
  }
  if (item.status !== "GENERATED") {
    return "等待生成";
  }

  const labels: Record<ConfirmableStageOutput["stage"], string> = {
    VI: "确认视觉规范并继续",
    IP: "确认品牌 IP 并继续",
    MATERIALS: "确认物料并继续",
    REVIEW: "确认审稿并继续",
    PROPOSAL: "完成项目",
  };

  return labels[item.stage];
}
