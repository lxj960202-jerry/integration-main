import { EmptyState } from "@/components/ui";
import type { ProjectResponse } from "@/lib/api/types";

type ProjectListProps = {
  onSelect: (projectId: string) => void;
  projects: ProjectResponse[];
  selectedProjectId: string | null;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "更新时间未知";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    ACTIVE: "进行中",
    COMPLETED: "已完成",
    ARCHIVED: "已归档",
  };

  return labels[value] ?? value;
}

export function ProjectList({ onSelect, projects, selectedProjectId }: ProjectListProps) {
  if (projects.length === 0) {
    return <EmptyState title="还没有项目">点击“新建项目”开始第一条品牌生成流程。</EmptyState>;
  }

  return (
    <div className="project-list">
      {projects.map((project) => {
        const isSelected = selectedProjectId === project.id;
        return (
          <button
            aria-current={isSelected ? "true" : undefined}
            className={`project-list-item ${isSelected ? "project-list-item--active" : ""}`}
            key={project.id}
            onClick={() => onSelect(project.id)}
            type="button"
          >
            <span className="project-list-copy">
              <strong>{project.name}</strong>
              <small>{formatDate(project.updated_at)}</small>
            </span>
            <span className="project-list-badges">
              <em>{project.current_stage}</em>
              <small className="project-status">{formatStatus(project.status)}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
