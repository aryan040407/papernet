import { create } from "zustand";
import { api } from "../api/client";

export type Op = { op_id: string; op_type: string; payload: any; rationale: string; status: string };
export type NodeT = {
  id: string; type: string; label: string; properties: Record<string, unknown>;
  position: { x: number; y: number }; source_bbox: number[] | null;
  confidence: number; epistemic_status: string; research_findings: any[];
};
export type EdgeT = { id: string; source: string; target: string; label: string; confidence: number; epistemic_status: string };
export type GraphModel = { nodes: NodeT[]; edges: EdgeT[] };
export type Issue = { id: string; severity: string; rule_code: string; affected_ids: string[]; explanation: string; proposed_fix_op: Op | null };
export type Analysis = { graph: GraphModel; issues: Issue[] };

export const applyOp = (g: GraphModel, op: Op): GraphModel => {
  const p = op.payload;
  switch (op.op_type) {
    case "ADD_NODE":
      return { ...g, nodes: [...g.nodes, { properties: {}, position: { x: 0, y: 0 }, source_bbox: null, confidence: 1, epistemic_status: "user_confirmed", research_findings: [], type: "process", label: "", ...p }] };
    case "UPDATE_NODE":
      return { ...g, nodes: g.nodes.map((n) => (n.id === p.id ? { ...n, ...p } : n)) };
    case "DELETE_NODE":
      return { nodes: g.nodes.filter((n) => n.id !== p.id), edges: g.edges.filter((e) => e.source !== p.id && e.target !== p.id) };
    case "ADD_EDGE":
      return { ...g, edges: [...g.edges, { label: "", confidence: 1, epistemic_status: "user_confirmed", ...p }] };
    case "DELETE_EDGE":
      return { ...g, edges: g.edges.filter((e) => e.id !== p.id) };
    default:
      return g;
  }
};

type S = {
  graph: GraphModel; sketch: GraphModel | null; photo: string | null; issues: Issue[]; ops: Op[];
  selected: string | null; hover: string | null; busy: boolean; err: string | null; loadId: number;
  past: GraphModel[]; future: GraphModel[];
  load: (preset?: string, image?: string) => Promise<void>;
  edit: (id: string, patch: Partial<NodeT>) => Promise<void>;
  move: (id: string, x: number, y: number) => void;
  connect: (a: string, b: string) => Promise<void>;
  select: (id: string | null) => void;
  setHover: (id: string | null) => void;
  propose: (cmd: string) => Promise<void>;
  stage: (op: Op) => void;
  resolve: (id: string, ok: boolean) => Promise<void>;
  research: (id: string) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
};

export const useGraphStore = create<S>((set, get) => {
  const check = async (graph: GraphModel) => {
    try { set({ issues: await api.check(graph) }); } catch (e) { set({ err: String(e) }); }
  };
  const commit = async (graph: GraphModel) => {
    set((s) => ({ graph, past: [...s.past.slice(-49), s.graph], future: [], err: null }));
    await check(graph);
  };
  const jump = async (back: boolean) => {
    const { past, future, graph } = get();
    if (!(back ? past : future).length) return;
    const next = back ? past[past.length - 1] : future[0];
    set(back ? { graph: next, past: past.slice(0, -1), future: [graph, ...future] }
             : { graph: next, future: future.slice(1), past: [...past, graph] });
    await check(next);
  };
  return {
    graph: { nodes: [], edges: [] }, sketch: null, photo: null, issues: [], ops: [],
    selected: null, hover: null, busy: false, err: null, loadId: 0, past: [], future: [],
    load: async (preset, image) => {
      set({ busy: true });
      try {
        const a = await api.analyze(preset, image);
        set((s) => ({ graph: a.graph, sketch: a.graph, issues: a.issues, photo: image ?? null, ops: [], past: [], future: [], selected: null, err: null, loadId: s.loadId + 1 }));
      } catch (e) { set({ err: "Backend unreachable: " + String(e) }); }
      set({ busy: false });
    },
    edit: (id, patch) => commit({ ...get().graph, nodes: get().graph.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }),
    move: (id, x, y) => set((s) => ({ graph: { ...s.graph, nodes: s.graph.nodes.map((n) => (n.id === id ? { ...n, position: { x, y } } : n)) } })),
    connect: (a, b) => commit(applyOp(get().graph, { op_id: "", op_type: "ADD_EDGE", rationale: "", status: "approved", payload: { id: `e_${a}_${b}`, source: a, target: b } })),
    select: (selected) => set({ selected }),
    setHover: (hover) => set({ hover }),
    propose: async (cmd) => {
      set({ busy: true });
      try {
        const o = await api.command(cmd, get().graph);
        set((s) => ({ ops: [...s.ops, ...o], err: o.length ? null : "No operation understood. Try: add database Cache after API Gateway" }));
      } catch (e) { set({ err: String(e) }); }
      set({ busy: false });
    },
    stage: (op) => set((s) => ({ ops: [...s.ops.filter((o) => o.op_id !== op.op_id), { ...op, status: "pending_review" }] })),
    resolve: async (id, ok) => {
      const op = get().ops.find((o) => o.op_id === id);
      if (!op) return;
      set((s) => ({ ops: s.ops.map((o) => (o.op_id === id ? { ...o, status: ok ? "approved" : "rejected" } : o)) }));
      if (ok) await commit(applyOp(get().graph, op));
    },
    research: async (id) => {
      const n = get().graph.nodes.find((n) => n.id === id);
      if (!n) return;
      set({ busy: true });
      try { await get().edit(id, { research_findings: [await api.research(n.label, n.type)] }); }
      catch (e) { set({ err: String(e) }); }
      set({ busy: false });
    },
    undo: () => jump(true),
    redo: () => jump(false),
  };
});
