import type { VersionItemSelection } from "@/features/workbench/types";

import type { LogoConcept, LogoOutput } from "./types";
import styles from "./logo-result.module.css";

type LogoResultProps = {
  assetUrls?: Record<string, string>;
  isLocked?: boolean;
  output: LogoOutput;
  selectedLogoId?: string | null;
  versionId: string;
  onSelect: (selection: VersionItemSelection) => void;
};

export function LogoResult({
  assetUrls = {},
  isLocked = false,
  output,
  selectedLogoId,
  versionId,
  onSelect,
}: LogoResultProps) {
  const concepts = output.concepts ?? [];

  return (
    <section className={styles.section}>
      {concepts.length > 0 ? (
        <div className={styles.grid}>
          {concepts.map((concept, index) => {
            const conceptId = concept.id ?? "";
            const previewAssetId = concept.preview_asset_id ?? "";

            return (
              <LogoCard
                assetUrl={previewAssetId ? assetUrls[previewAssetId] : undefined}
                concept={concept}
                isLocked={isLocked}
                isSelected={Boolean(conceptId && selectedLogoId === conceptId)}
                key={conceptId || `logo-${index}`}
                onSelect={() => {
                  if (!conceptId) {
                    return;
                  }
                  onSelect({
                    stage: "LOGO",
                    version_id: versionId,
                    item_id: conceptId,
                  });
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>暂无可选择的 Logo 方案。</div>
      )}
    </section>
  );
}

function LogoCard({
  assetUrl,
  concept,
  isLocked,
  isSelected,
  onSelect,
}: {
  assetUrl?: string;
  concept: LogoConcept;
  isLocked: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const conceptId = concept.id ?? "";
  const previewAssetId = concept.preview_asset_id ?? "";

  return (
    <article className={`${styles.card} ${isSelected ? styles.selected : ""}`}>
      <div className={styles.preview}>
        {assetUrl ? (
          <img alt={formatText(concept.name, "Logo 预览")} src={assetUrl} />
        ) : (
          <span className={styles.assetFallback}>{formatText(previewAssetId, "暂无预览图")}</span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.title}>
          <h3>{formatText(concept.name, "未命名 Logo")}</h3>
          <small>{formatText(conceptId, "缺少 Logo ID")}</small>
        </div>
        <MetaBlock label="设计理由" value={concept.rationale} />
        <MetaBlock label="符号含义" value={concept.symbolism} />
        <MetaBlock label="造型语言" value={concept.shape_language} />
        <MetaBlock label="色彩策略" value={concept.color_strategy} />
      </div>

      <div className={styles.actions}>
        <button
          className={styles.button}
          disabled={!conceptId || isSelected || isLocked}
          onClick={onSelect}
          type="button"
        >
          {isSelected ? "已选择" : isLocked ? "已锁定" : conceptId ? "选择 Logo" : "缺少 ID"}
        </button>
      </div>
    </article>
  );
}

function MetaBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div className={styles.metaBlock}>
      <span>{label}</span>
      <p>{formatText(value)}</p>
    </div>
  );
}

function formatText(value: string | undefined, fallback = "未提供") {
  return value && value.trim().length > 0 ? value : fallback;
}
