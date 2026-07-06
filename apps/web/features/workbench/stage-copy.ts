import type { WorkbenchStage } from "./types";

const stageLabels: Record<string, string> = {
  INTAKE: "信息整理",
  DIRECTIONS: "品牌方向",
  LOGO: "Logo 方案",
  VI: "视觉规范",
  IP: "品牌 IP",
  MATERIALS: "应用物料",
  REVIEW: "审稿检查",
  PROPOSAL: "最终提案",
};

const stageSteps: Record<WorkbenchStage, string> = {
  DIRECTIONS: "第 1 步",
  LOGO: "第 2 步",
  VI: "第 3 步",
  IP: "第 4 步",
  MATERIALS: "第 5 步",
  REVIEW: "第 6 步",
  PROPOSAL: "第 7 步",
};

export function formatStageLabel(stage: string | null | undefined) {
  if (!stage) {
    return "未开始";
  }

  return stageLabels[stage] ?? stage;
}

export function formatStageStep(stage: WorkbenchStage) {
  return stageSteps[stage];
}

export function formatVersionBadge(versionId: string | null | undefined) {
  if (!versionId) {
    return "等待生成";
  }

  return `版本 ${versionId.slice(0, 8)}`;
}
