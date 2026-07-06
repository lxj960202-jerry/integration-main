import type { VersionItemSelection } from "@/features/workbench/types";

import type { DirectionItem, DirectionOutput } from "./types";
import styles from "./directions-result.module.css";

type DirectionsResultProps = {
  isLocked?: boolean;
  output: DirectionOutput;
  versionId: string;
  selectedDirectionId?: string | null;
  onSelect: (selection: VersionItemSelection) => void;
};

export function DirectionsResult({
  isLocked = false,
  output,
  selectedDirectionId,
  versionId,
  onSelect,
}: DirectionsResultProps) {
  const brief = output.brief ?? {};
  const directions = output.directions ?? [];

  return (
    <section className={styles.section}>
      <div className={styles.brief}>
        <BriefItem label="定位" value={brief.positioning} />
        <BriefItem label="受众洞察" value={brief.audience_insight} />
        <BriefItem label="品牌承诺" value={brief.brand_promise} />
        <BriefItem label="语气" value={brief.tone} />
      </div>

      {directions.length > 0 ? (
        <div className={styles.grid}>
          {directions.map((direction, index) => {
            const directionId = direction.id ?? "";

            return (
              <DirectionCard
                direction={direction}
                isLocked={isLocked}
                isSelected={Boolean(directionId && selectedDirectionId === directionId)}
                key={directionId || `direction-${index}`}
                onSelect={() => {
                  if (!directionId) {
                    return;
                  }
                  onSelect({
                    stage: "DIRECTIONS",
                    version_id: versionId,
                    item_id: directionId,
                  });
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>暂无可选择的品牌方向。</div>
      )}
    </section>
  );
}

function BriefItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className={styles.briefItem}>
      <span>{label}</span>
      <strong>{formatText(value)}</strong>
    </div>
  );
}

function DirectionCard({
  direction,
  isLocked,
  isSelected,
  onSelect,
}: {
  direction: DirectionItem;
  isLocked: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const directionId = direction.id ?? "";
  const keywords = direction.keywords ?? [];
  const palette = direction.palette ?? [];
  const risks = direction.risks ?? [];

  return (
    <article className={`${styles.card} ${isSelected ? styles.selected : ""}`}>
      <div className={styles.header}>
        <div className={styles.title}>
          <h3>{formatText(direction.name, "未命名方向")}</h3>
          <small>{formatText(directionId, "缺少方向 ID")}</small>
        </div>
      </div>

      <p className={styles.copy}>{formatText(direction.concept)}</p>

      <div className={styles.keywords}>
        {keywords.map((keyword) => (
          <span className={styles.keyword} key={keyword}>
            {keyword}
          </span>
        ))}
        {keywords.length === 0 ? <span className={styles.emptyInline}>暂无关键词</span> : null}
      </div>

      {palette.length > 0 ? (
        <div className={styles.palette}>
          {palette.map((color, index) => (
            <span className={styles.color} key={`${directionId || "direction"}-${color.hex ?? index}`}>
              <span className={styles.swatch} style={{ backgroundColor: color.hex ?? "#e2e8f0" }} />
              <span>{formatText(color.name, "未命名颜色")}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className={styles.emptyInline}>暂无色板</div>
      )}

      {risks.length > 0 ? (
        <div className={styles.risks}>
          <span className={styles.metaLabel}>风险提示</span>
          {risks.map((risk) => (
            <span key={risk}>{risk}</span>
          ))}
        </div>
      ) : (
        <div className={styles.risks}>
          <span className={styles.metaLabel}>风险提示</span>
          <span>暂无风险提示</span>
        </div>
      )}

      <div className={styles.meta}>
        <MetaBlock label="标题字体" value={direction.typography?.heading_style} />
        <MetaBlock label="正文字体" value={direction.typography?.body_style} />
        <MetaBlock label="构图" value={direction.composition} />
        <MetaBlock label="理由" value={direction.rationale} />
      </div>

      <div className={styles.actions}>
        <button
          className={styles.button}
          disabled={!directionId || isSelected || isLocked}
          onClick={onSelect}
          type="button"
        >
          {isSelected ? "已选择" : isLocked ? "已锁定" : directionId ? "选择方向" : "缺少 ID"}
        </button>
      </div>
    </article>
  );
}

function MetaBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div className={styles.metaBlock}>
      <span className={styles.metaLabel}>{label}</span>
      <p>{formatText(value)}</p>
    </div>
  );
}

function formatText(value: string | undefined, fallback = "未提供") {
  return value && value.trim().length > 0 ? value : fallback;
}
