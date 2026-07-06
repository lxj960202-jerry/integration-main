import type { WorkbenchStage, WorkbenchStageSummary } from "@/features/workbench/types";
import {
  formatStageLabel,
  formatStageStep,
  formatVersionBadge,
} from "@/features/workbench/stage-copy";

import styles from "./stage-navigation.module.css";

const statusLabels: Record<WorkbenchStageSummary["status"], string> = {
  LOCKED: "未解锁",
  GENERATING: "生成中",
  AWAITING_DECISION: "待你处理",
  CONFIRMED: "已确认",
  STALE: "需更新",
};

const statusClassNames: Record<WorkbenchStageSummary["status"], string> = {
  LOCKED: styles.locked,
  GENERATING: styles.generating,
  AWAITING_DECISION: styles.awaitingDecision,
  CONFIRMED: styles.confirmed,
  STALE: styles.stale,
};

type StageNavigationProps = {
  stages: WorkbenchStageSummary[];
};

export function StageNavigation({ stages }: StageNavigationProps) {
  return (
    <nav aria-label="品牌生成阶段" className={styles.nav}>
      {stages.map((stage) => (
        <div
          className={`${styles.item} ${statusClassNames[stage.status]}`}
          key={stage.stage}
        >
          <span className={styles.dot} />
          <span className={styles.body}>
            <strong className={styles.name}>{formatStageLabel(stage.stage)}</strong>
            <span className={styles.meta}>
              {formatStageStep(stage.stage)} · {formatVersionBadge(stage.version_id)}
            </span>
          </span>
          <span className={styles.badge}>{statusLabels[stage.status]}</span>
        </div>
      ))}
    </nav>
  );
}
