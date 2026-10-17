import { useEffect, useMemo } from "react";
import { Background, BackgroundVariant, Controls, Handle, MarkerType, Position, ReactFlow, useNodesState, type Edge, type Node } from "@xyflow/react";
import { Cloud, Cpu, Database, GitBranch, HelpCircle, Monitor } from "lucide-react";
import { useGraphStore, type GraphModel, type Issue, type Op } from "../store/useGraphStore";

const ICON: Record<string, any> = { process: Cpu, decision: GitBranch, database: Database, client: Monitor, external_service: Cloud, ambiguous: HelpCircle };
const RING: Record<string, string> = { error: "border-orange", warning: "border-amber", ok: "border-emerald", add: "border-cobalt", del: "border-orange" };

function Block({ data, selected }: any) {
  const { n, sev, ghost } = data;
  const I = ICON[n.type] ?? Cpu;
  const ring = RING[ghost === "add" ? "add" : ghost === "del" ? "del" : sev ?? "ok"];
  return (
    <div className={`min-w-44 border-2 bg-paper px-3 py-2 font-mono text-xs ${ring} ${ghost ? "ghost" : ""} ${selected ? "outline outline-2 outline-offset-2 outline-cobalt" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2"><I size={14} /><b>{n.label}</b></div>
      <div className="mt-1 flex justify-between gap-3 opacity-70"><span>{n.id} {n.type}</span><span>{Math.round(n.confidence * 100)}%</span></div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { block: Block };

function build(g: GraphModel, issues: Issue[], ops: Op[]) {
  const pend = ops.filter((o) => o.status === "pending_review");
  const sev = (id: string) => issues.filter((i) => i.affected_ids.includes(id)).map((i) => i.severity).sort()[0];
  const nodes: Node[] = g.nodes.map((n) => {
    const o = pend.find((o) => o.payload.id === n.id && (o.op_type === "UPDATE_NODE" || o.op_type === "DELETE_NODE"));
    return { id: n.id, type: "block", position: n.position, data: { n, sev: sev(n.id), ghost: o ? (o.op_type === "DELETE_NODE" ? "del" : "upd") : "" } };
  });
  pend.filter((o) => o.op_type === "ADD_NODE").forEach((o) =>
    nodes.push({ id: o.payload.id, type: "block", position: o.payload.position ?? { x: 60, y: 60 }, draggable: false, data: { n: { confidence: 1, type: "process", ...o.payload }, ghost: "add" } }));
  const edges: Edge[] = g.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label, markerEnd: { type: MarkerType.ArrowClosed, color: "var(--ink)" }, style: { stroke: "var(--ink)" } }));
  pend.filter((o) => o.op_type === "ADD_EDGE").forEach((o) =>
    edges.push({ id: o.payload.id, source: o.payload.source, target: o.payload.target, label: o.payload.label, animated: true, style: { strokeDasharray: "5 4", stroke: "#0047AB" } }));
  return { nodes, edges };
}

export default function CanvasEditor() {
  const { graph, issues, ops, move, select, setHover, connect } = useGraphStore();
  const built = useMemo(() => build(graph, issues, ops), [graph, issues, ops]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(built.nodes);
  useEffect(() => setNodes((prev) => built.nodes.map((b) => ({ ...prev.find((p) => p.id === b.id), ...b }))), [built, setNodes]);
  return (
    <ReactFlow
      nodes={nodes} edges={built.edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} fitView
      onNodeDragStop={(_, n) => move(n.id, n.position.x, n.position.y)}
      onConnect={(c) => connect(c.source, c.target)}
      onNodeClick={(_, n) => select(n.id)} onPaneClick={() => select(null)}
      onNodeMouseEnter={(_, n) => setHover(n.id)} onNodeMouseLeave={() => setHover(null)}
      deleteKeyCode={null}>
      <Background variant={BackgroundVariant.Lines} gap={24} lineWidth={1} color="var(--grid)" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
