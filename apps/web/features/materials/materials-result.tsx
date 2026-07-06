import type { MaterialOutput } from "@/features/workbench/types";

import styles from "./materials-result.module.css";

type MaterialsResultProps = {
  assetUrls?: Record<string, string>;
  output?: MaterialOutput | null;
};

export function MaterialsResult({ assetUrls = {}, output }: MaterialsResultProps) {
  if (!output) {
    return <div className={styles.empty}>暂无品牌物料数据。</div>;
  }

  const scenes = output.scenes ?? [];

  if (scenes.length === 0) {
    return <div className={styles.empty}>暂无品牌物料场景。</div>;
  }

  return (
    <div className={styles.grid}>
      {scenes.map((scene, index) => {
        const previewAssetId = scene.preview_asset_id ?? "";
        const previewUrl = previewAssetId ? assetUrls[previewAssetId] : undefined;

        return (
          <article className={styles.card} key={scene.id ?? `scene-${index}`}>
            <div className={styles.preview}>
              {previewUrl ? (
                <div
                  aria-label={formatText(scene.name, "物料预览")}
                  className={styles.previewImage}
                  role="img"
                  style={{ backgroundImage: `url(${JSON.stringify(previewUrl)})` }}
                />
              ) : (
                <span>{formatText(previewAssetId, "暂无预览图")}</span>
              )}
            </div>

            <div className={styles.body}>
              <h3>{formatText(scene.name, "未命名物料")}</h3>
              <TextRow label="场景" value={scene.scenario_id} />
              <p>{formatText(scene.rationale)}</p>
              <TextRow label="预览资产" value={previewAssetId} />
              <ChipList items={scene.used_asset_ids ?? []} />
              <TextRow label="图像提示词" value={scene.image_prompt} />
            </div>
          </article>
        );
      })}
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
    return <span className={styles.emptyInline}>暂无引用资产</span>;
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
