import { useMemo } from "react";
import ReactFlow, { Background, Node, Edge, Position } from "reactflow";
import "reactflow/dist/style.css";
import { StageRecord } from "../api/workflowApi";
import { RoleRecord } from "../../admin/roles/api/rolesApi";

interface Props {
  stages: StageRecord[];
  roles: RoleRecord[];
}

const STAGE_WIDTH = 220;
const STAGE_GAP = 100;

export default function FlowchartView({ stages, roles }: Props) {
  const { nodes, edges } = useMemo(() => {
    const sorted = [...stages].sort((a, b) => a.sequence - b.sequence);

    const nodes: Node[] = sorted.map((stage, i) => {
      const roleName = roles.find((r) => r.id === stage.responsibleRoleId)?.name ?? "Unassigned";
      const badges = [
        stage.approvalRequired ? "Approval" : null,
        stage.checklistRequired ? "Checklist" : null,
        stage.canSkip ? "Skippable" : null,
      ].filter(Boolean).join(" · ");

      return {
        id: stage.id,
        position: { x: i * (STAGE_WIDTH + STAGE_GAP), y: 0 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div style={{ textAlign: "left", padding: 4 }}>
              <div style={{ fontSize: 11, color: "#888" }}>Stage {stage.sequence}</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{stage.name}</div>
              <div style={{ fontSize: 11, color: "#555" }}>{roleName}</div>
              {stage.dueDays != null && <div style={{ fontSize: 11, color: "#888" }}>Due in {stage.dueDays}d</div>}
              {badges && <div style={{ fontSize: 10, color: "#4a90d9", marginTop: 4 }}>{badges}</div>}
            </div>
          ),
        },
        style: {
          width: STAGE_WIDTH,
          border: "1px solid #ccc",
          borderRadius: 8,
          background: "#fff",
          padding: 8,
        },
      };
    });

    const edges: Edge[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      edges.push({
        id: `${sorted[i].id}-${sorted[i + 1].id}`,
        source: sorted[i].id,
        target: sorted[i + 1].id,
        animated: false,
        style: { stroke: "#aaa" },
      });
    }

    return { nodes, edges };
  }, [stages, roles]);

  if (stages.length === 0) {
    return <p style={{ color: "#777", padding: 24 }}>Add stages to see the flowchart.</p>;
  }

  return (
    <div style={{ height: 420, border: "1px solid #eee", borderRadius: 6 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}>
        <Background />
      </ReactFlow>
    </div>
  );
}
