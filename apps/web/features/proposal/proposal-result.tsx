import type { ProposalOutput } from "@/features/workbench/types";

import styles from "./proposal-result.module.css";

type ProposalResultProps = {
  isDownloadReady?: boolean;
  output?: ProposalOutput | null;
  projectId?: string | null;
};

export function ProposalResult({
  isDownloadReady = false,
  output,
  projectId,
}: ProposalResultProps) {
  if (!output) {
    return <div className={styles.empty}>暂无最终提案数据。</div>;
  }

  const sections = output.sections ?? [];
  const assetRefs = output.asset_refs ?? [];
  const encodedProjectId = projectId ? encodeURIComponent(projectId) : "";
  const markdownHref = encodedProjectId
    ? `/api/v1/projects/${encodedProjectId}/exports/proposal.md`
    : "";
  const zipHref = encodedProjectId
    ? `/api/v1/projects/${encodedProjectId}/exports/proposal.zip`
    : "";
  const canDownload = Boolean(projectId && isDownloadReady);

  return (
    <div className={styles.stack}>
      <div className={styles.summary}>
        <h3>{formatText(output.title, "最终品牌提案")}</h3>
        <p>{formatText(output.narrative)}</p>
      </div>

      <div className={styles.downloads}>
        <div>
          <span>交付下载</span>
          <strong>{canDownload ? "已可下载" : "完成最终提案后可下载"}</strong>
        </div>
        <div className={styles.downloadActions}>
          {canDownload ? (
            <>
              <a className={styles.downloadButton} download href={markdownHref}>
                Markdown
              </a>
              <a className={styles.downloadButton} download href={zipHref}>
                ZIP
              </a>
            </>
          ) : (
            <>
              <span className={styles.disabledButton}>Markdown</span>
              <span className={styles.disabledButton}>ZIP</span>
            </>
          )}
        </div>
      </div>

      {sections.length > 0 ? (
        <div className={styles.grid}>
          {sections.map((section, index) => (
            <article className={styles.card} key={`${section.type ?? "section"}-${index}`}>
              <div className={styles.cardHeader}>
                <h3>{formatText(section.title, `章节 ${index + 1}`)}</h3>
                <span>{formatText(section.type, "未分类")}</span>
              </div>
              <p>{formatText(section.summary)}</p>
              <TextRow label="版本" value={section.version_id} />
              <ChipList items={section.asset_ids ?? []} emptyLabel="暂无章节资产" />
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>暂无提案章节。</div>
      )}

      <ChipList items={assetRefs} emptyLabel="暂无全局资产引用" />
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

function ChipList({ emptyLabel, items }: { emptyLabel: string; items: string[] }) {
  if (items.length === 0) {
    return <span className={styles.emptyInline}>{emptyLabel}</span>;
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
