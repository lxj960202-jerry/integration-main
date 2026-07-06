import type { ReactNode } from "react";

import type { VIOutput } from "@/features/workbench/types";

import styles from "./vi-result.module.css";

type VIResultProps = {
  output?: VIOutput | null;
};

export function VIResult({ output }: VIResultProps) {
  if (!output) {
    return <div className={styles.empty}>暂无 VI 视觉规范数据。</div>;
  }

  const palette = output.palette ?? [];
  const typography = output.typography ?? {};
  const logoRules = output.logo_rules ?? {};
  const layouts = output.layouts ?? [];

  return (
    <div className={styles.stack}>
      {palette.length > 0 ? (
        <div className={styles.palette}>
          {palette.map((color, index) => (
            <span className={styles.color} key={`${color.hex ?? "color"}-${index}`}>
              <span className={styles.swatch} style={{ backgroundColor: color.hex ?? "#e2e8f0" }} />
              <span>
                <strong>{formatText(color.name, "未命名颜色")}</strong>
                <small>{formatText(color.usage)}</small>
              </span>
            </span>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>暂无色板。</div>
      )}

      <div className={styles.grid}>
        <InfoCard title="字体系统">
          <TextRow label="标题" value={typography.heading_style} />
          <TextRow label="正文" value={typography.body_style} />
          <ChipList items={typography.fallbacks ?? []} emptyLabel="暂无备用字体" />
          <BulletList items={typography.usage_rules ?? []} emptyLabel="暂无字体使用规则" />
        </InfoCard>

        <InfoCard title="Logo 规则">
          <TextRow label="安全区" value={logoRules.clear_space} />
          <TextRow label="最小尺寸" value={logoRules.minimum_size} />
          <BulletList items={logoRules.background_rules ?? []} emptyLabel="暂无背景使用规则" />
          <BulletList
            items={logoRules.prohibited_uses ?? []}
            emptyLabel="暂无禁用规则"
            tone="danger"
          />
        </InfoCard>
      </div>

      <div className={styles.grid}>
        {layouts.length > 0 ? (
          layouts.map((layout, index) => (
            <InfoCard key={`${layout.name ?? "layout"}-${index}`} title={formatText(layout.name, "未命名版式")}>
              <TextRow label="网格" value={layout.grid} />
              <TextRow label="间距" value={layout.spacing} />
              <p>{formatText(layout.example_usage)}</p>
            </InfoCard>
          ))
        ) : (
          <div className={styles.empty}>暂无版式规范。</div>
        )}
      </div>

      <TextRow label="源 Logo 资产" value={output.source_logo_asset_id} />
    </div>
  );
}

function InfoCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <article className={styles.card}>
      <h3>{title}</h3>
      {children}
    </article>
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

function BulletList({
  emptyLabel,
  items,
  tone,
}: {
  emptyLabel: string;
  items: string[];
  tone?: "danger";
}) {
  if (items.length === 0) {
    return <span className={styles.emptyInline}>{emptyLabel}</span>;
  }

  return (
    <ul className={tone === "danger" ? styles.dangerList : styles.list}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function formatText(value: string | undefined, fallback = "未提供") {
  return value && value.trim().length > 0 ? value : fallback;
}
