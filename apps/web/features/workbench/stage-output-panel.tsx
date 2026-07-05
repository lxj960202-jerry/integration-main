import type { ReactNode } from "react";

import type {
  ConfirmableStageOutput,
  IPOutput,
  MaterialOutput,
  ProposalOutput,
  ReviewOutput,
  VersionConfirmation,
  VIOutput,
} from "./types";
import styles from "./stage-output-panel.module.css";

const stageLabels: Record<ConfirmableStageOutput["stage"], string> = {
  VI: "VI",
  IP: "IP",
  MATERIALS: "Materials",
  REVIEW: "Review",
  PROPOSAL: "Proposal",
};

type StageOutputPanelProps = {
  isSubmitting: boolean;
  item: ConfirmableStageOutput;
  onConfirm: (confirmation: VersionConfirmation) => void;
};

export function StageOutputPanel({ isSubmitting, item, onConfirm }: StageOutputPanelProps) {
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
          {item.confirmed ? "已确认" : isSubmitting ? "正在提交" : "确认并继续"}
        </button>
      </div>

      {item.stage === "VI" ? <VIResult output={item.output} /> : null}
      {item.stage === "IP" ? <IPResult output={item.output} /> : null}
      {item.stage === "MATERIALS" ? <MaterialsResult output={item.output} /> : null}
      {item.stage === "REVIEW" ? <ReviewResult output={item.output} /> : null}
      {item.stage === "PROPOSAL" ? <ProposalResult output={item.output} /> : null}
    </section>
  );
}

function VIResult({ output }: { output: VIOutput }) {
  return (
    <div className={styles.stack}>
      <div className={styles.palette}>
        {output.palette.map((color) => (
          <span className={styles.color} key={`${color.name}-${color.hex}`}>
            <span className={styles.swatch} style={{ backgroundColor: color.hex }} />
            <span>
              <strong>{color.name}</strong>
              <small>{color.usage}</small>
            </span>
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        <InfoCard title="字体系统">
          <TextRow label="标题" value={output.typography.heading_style} />
          <TextRow label="正文" value={output.typography.body_style} />
          <ChipList items={output.typography.fallbacks} />
          <BulletList items={output.typography.usage_rules} />
        </InfoCard>

        <InfoCard title="Logo 规则">
          <TextRow label="安全区" value={output.logo_rules.clear_space} />
          <TextRow label="最小尺寸" value={output.logo_rules.minimum_size} />
          <BulletList items={output.logo_rules.background_rules} />
          <BulletList items={output.logo_rules.prohibited_uses} tone="danger" />
        </InfoCard>
      </div>

      <div className={styles.grid}>
        {output.layouts.map((layout) => (
          <InfoCard key={layout.name} title={layout.name}>
            <TextRow label="网格" value={layout.grid} />
            <TextRow label="间距" value={layout.spacing} />
            <p>{layout.example_usage}</p>
          </InfoCard>
        ))}
      </div>
    </div>
  );
}

function IPResult({ output }: { output: IPOutput }) {
  return (
    <div className={styles.grid}>
      <InfoCard title={output.character.name}>
        <TextRow label="角色" value={output.character.role} />
        <ChipList items={output.character.personality} />
        <p>{output.character.appearance}</p>
        <p>{output.character.brand_connection}</p>
      </InfoCard>
      <InfoCard title={output.pose.name}>
        <p>{output.pose.description}</p>
        <TextRow label="资产" value={output.preview_asset_id} />
        <p>{output.image_prompt}</p>
      </InfoCard>
    </div>
  );
}

function MaterialsResult({ output }: { output: MaterialOutput }) {
  return (
    <div className={styles.grid}>
      {output.scenes.map((scene) => (
        <InfoCard key={scene.id} title={scene.name}>
          <TextRow label="场景" value={scene.scenario_id} />
          <p>{scene.rationale}</p>
          <TextRow label="资产" value={scene.preview_asset_id} />
          <ChipList items={scene.used_asset_ids} />
        </InfoCard>
      ))}
    </div>
  );
}

function ReviewResult({ output }: { output: ReviewOutput }) {
  const passed = output.pass ?? output.passed ?? false;

  return (
    <div className={styles.stack}>
      <div className={passed ? styles.passBanner : styles.warningBanner}>
        {passed ? "审稿通过" : "审稿需关注"}
      </div>
      <p className={styles.lead}>{output.summary}</p>
      {output.issues.length > 0 ? (
        <div className={styles.grid}>
          {output.issues.map((issue) => (
            <InfoCard key={issue.id} title={issue.id}>
              <ChipList items={[issue.severity, issue.category, issue.target_stage]} />
              <p>{issue.evidence}</p>
              <p>{issue.suggestion}</p>
            </InfoCard>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProposalResult({ output }: { output: ProposalOutput }) {
  return (
    <div className={styles.stack}>
      <p className={styles.lead}>{output.narrative}</p>
      <div className={styles.grid}>
        {output.sections.map((section) => (
          <InfoCard key={`${section.type}-${section.version_id}`} title={section.title}>
            <ChipList items={[section.type]} />
            <p>{section.summary}</p>
            <TextRow label="版本" value={section.version_id} />
          </InfoCard>
        ))}
      </div>
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

function TextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.textRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.chips}>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function BulletList({ items, tone }: { items: string[]; tone?: "danger" }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className={tone === "danger" ? styles.dangerList : styles.list}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
