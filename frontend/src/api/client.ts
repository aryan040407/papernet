import type { Analysis, GraphModel, Issue, Op } from "../store/useGraphStore";

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${url} returned ${r.status}`);
  return (r.headers.get("content-type")?.includes("json") ? r.json() : r.text()) as Promise<T>;
}

export const api = {
  analyze: (preset?: string, image?: string) => post<Analysis>("/api/perception/analyze", { preset, image }),
  check: (graph: GraphModel) => post<Issue[]>("/api/validation/check", { graph }),
  research: (label: string, type: string) => post<any>("/api/research/node", { label, type }),
  command: (command: string, graph: GraphModel) => post<Op[]>("/api/assistant/command", { command, graph }),
  report: (graph: GraphModel) => post<string>("/api/export/report", { graph }),
};
