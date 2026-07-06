export type WorkbenchStage =
  | "DIRECTIONS"
  | "LOGO"
  | "VI"
  | "IP"
  | "MATERIALS"
  | "REVIEW"
  | "PROPOSAL";

export type WorkbenchStageStatus =
  | "LOCKED"
  | "GENERATING"
  | "AWAITING_DECISION"
  | "CONFIRMED"
  | "STALE";

export type VersionItemSelection = {
  stage: WorkbenchStage;
  version_id: string;
  item_id: string;
};

export type VersionConfirmation = {
  stage: WorkbenchStage;
  version_id: string;
};

export type StageControlSelection = {
  stage: WorkbenchStage;
  action: "generate" | "skip";
  reason?: string;
};

export type WorkbenchStageSummary = {
  stage: WorkbenchStage;
  status: WorkbenchStageStatus;
  version_id: string | null;
  selected_item_id: string | null;
};

export type PaletteColor = {
  name?: string;
  hex?: string;
  usage?: string;
};

export type VIOutput = {
  schema_version?: number;
  palette?: PaletteColor[];
  typography?: {
    heading_style?: string;
    body_style?: string;
    fallbacks?: string[];
    usage_rules?: string[];
  };
  logo_rules?: {
    clear_space?: string;
    minimum_size?: string;
    background_rules?: string[];
    prohibited_uses?: string[];
  };
  layouts?: Array<{
    name?: string;
    grid?: string;
    spacing?: string;
    example_usage?: string;
  }>;
  source_logo_asset_id?: string;
};

export type IPOutput = {
  schema_version?: number;
  character?: {
    name?: string;
    role?: string;
    personality?: string[];
    appearance?: string;
    brand_connection?: string;
  };
  pose?: {
    name?: string;
    description?: string;
  };
  image_prompt?: string;
  preview_asset_id?: string;
};

export type MaterialOutput = {
  schema_version?: number;
  scenes?: Array<{
    id?: string;
    scenario_id?: string;
    name?: string;
    rationale?: string;
    used_asset_ids?: string[];
    image_prompt?: string;
    preview_asset_id?: string;
  }>;
};

export type ReviewOutput = {
  schema_version?: number;
  pass?: boolean;
  passed?: boolean;
  summary?: string;
  issues?: Array<{
    id?: string;
    severity?: "BLOCKER" | "WARNING" | "INFO" | string;
    category?: string;
    evidence?: string;
    suggestion?: string;
    target_stage?: string;
    target_asset_ids?: string[];
  }>;
};

export type ProposalOutput = {
  schema_version?: number;
  title?: string;
  narrative?: string;
  sections?: Array<{
    type?: string;
    title?: string;
    summary?: string;
    version_id?: string;
    asset_ids?: string[];
  }>;
  asset_refs?: string[];
};

export type ConfirmableStageOutput =
  | {
      stage: "VI";
      output: VIOutput;
      version_id: string;
      confirmed: boolean;
      status: string;
    }
  | {
      stage: "IP";
      output: IPOutput;
      version_id: string;
      confirmed: boolean;
      status: string;
    }
  | {
      stage: "MATERIALS";
      output: MaterialOutput;
      version_id: string;
      confirmed: boolean;
      status: string;
    }
  | {
      stage: "REVIEW";
      output: ReviewOutput;
      version_id: string;
      confirmed: boolean;
      status: string;
    }
  | {
      stage: "PROPOSAL";
      output: ProposalOutput;
      version_id: string;
      confirmed: boolean;
      status: string;
    };
