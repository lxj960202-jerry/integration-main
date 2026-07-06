import type { ReviewOutput } from "@/features/workbench/types";

import styles from "./review-result.module.css";

type ReviewResultProps = {
  output?: ReviewOutput | null;
};

export function ReviewResult({ output }: ReviewResultProps) {
  if (!output) {
    return <div className={styles.empty}>暂无审稿结果数据。</div>;
  }

  const passed = output.pass ?? output.passed ?? false;
  const issues = output.issues ?? [];

  return (
    <div className={styles.stack}>
      <div className={passed ? styles.passBanner : styles.warningBanner}>
        {passed ? "审稿通过" : "审稿需关注"}
      </div>
      <p className={styles.lead}>{formatText(output.summary, "暂无审稿摘要。")}</p>

      {issues.length > 0 ? (
        <div className={styles.grid}>
          {issues.map((issue, index) => (
            <article className={styles.card} key={issue.id ?? `issue-${index}`}>
              <h3>{formatText(issue.id, `问题 ${index + 1}`)}</h3>
              <div className={styles.chips}>
                <span>{formatText(issue.severity, "INFO")}</span>
                <span>{formatText(issue.category, "未分类")}</span>
                <span>{formatText(issue.target_stage, "未指定阶段")}</span>
              </div>
              <TextRow label="证据" value={issue.evidence} />
              <TextRow label="建议" value={issue.suggestion} />
              <ChipList items={issue.target_asset_ids ?? []} />
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>暂无审稿问题。</div>
      )}
    </div>
  );
}

function TextRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className={styles.textRow}>
      <span>{label}</span>
      <strong>{formatText(value)}</strong>
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className={styles.emptyInline}>暂无相关资产</span>;
  }

  return (
    <div className={styles.chips}>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function formatText(value: string | undefined, fallback = "未提供") {
  return value && value.trim().length > 0 ? value : fallback;
}
