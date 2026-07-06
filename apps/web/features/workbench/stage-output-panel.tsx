import { IPResult } from "@/features/ip/ip-result";
import { MaterialsResult } from "@/features/materials/materials-result";
import { ProposalResult } from "@/features/proposal/proposal-result";
import { ReviewResult } from "@/features/review/review-result";
import { VIResult } from "@/features/vi/vi-result";

import type { ConfirmableStageOutput, VersionConfirmation } from "./types";
import styles from "./stage-output-panel.module.css";

const stageLabels: Record<ConfirmableStageOutput["stage"], string> = {
  VI: "VI",
  IP: "IP",
  MATERIALS: "Materials",
  REVIEW: "Review",
  PROPOSAL: "Proposal",
};

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

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2>{stageLabels[item.stage]}</h2>
          <span>{item.version_id}</span>
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
  return "确认并继续";
}
