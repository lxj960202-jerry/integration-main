import type { IPOutput } from "@/features/workbench/types";

import styles from "./ip-result.module.css";

type IPResultProps = {
  assetUrls?: Record<string, string>;
  output?: IPOutput | null;
};

export function IPResult({ assetUrls = {}, output }: IPResultProps) {
  if (!output) {
    return <div className={styles.empty}>暂无 IP 形象数据。</div>;
  }

  const character = output.character ?? {};
  const pose = output.pose ?? {};
  const previewAssetId = output.preview_asset_id ?? "";
  const previewUrl = previewAssetId ? assetUrls[previewAssetId] : undefined;

  return (
    <div className={styles.grid}>
      <article className={styles.previewCard}>
        <div className={styles.preview}>
          {previewUrl ? (
            <div
              aria-label={formatText(character.name, "IP 形象预览")}
              className={styles.previewImage}
              role="img"
              style={{ backgroundImage: `url(${JSON.stringify(previewUrl)})` }}
            />
          ) : (
            <span>{formatText(previewAssetId, "暂无预览图")}</span>
          )}
        </div>
        <TextRow label="预览资产" value={previewAssetId} />
      </article>

      <article className={styles.card}>
        <h3>{formatText(character.name, "未命名角色")}</h3>
        <TextRow label="角色定位" value={character.role} />
        <ChipList items={character.personality ?? []} />
        <p>{formatText(character.appearance)}</p>
        <p>{formatText(character.brand_connection)}</p>
      </article>

      <article className={styles.card}>
        <h3>{formatText(pose.name, "未命名姿态")}</h3>
        <p>{formatText(pose.description)}</p>
        <TextRow label="图像提示词" value={output.image_prompt} />
      </article>
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
    return <span className={styles.emptyInline}>暂无性格关键词</span>;
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
