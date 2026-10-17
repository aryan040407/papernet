import { Camera, Redo2, Undo2 } from "lucide-react";
import { toPng, toSvg } from "html-to-image";
import { api } from "../api/client";
import { useGraphStore, type GraphModel } from "../store/useGraphStore";

const save = (name: string, data: BlobPart) =>
  Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([data])), download: name }).click();

const mermaid = (g: GraphModel) => {
  const q = (s: string) => s.replace(/"/g, "'");
  const shape = (n: GraphModel["nodes"][number]) =>
    n.type === "decision" ? `{"${q(n.label)}"}` : n.type === "database" ? `[("${q(n.label)}")]` : `["${q(n.label)}"]`;
  return ["flowchart LR", ...g.nodes.map((n) => `  ${n.id}${shape(n)}`),
    ...g.edges.map((e) => `  ${e.source} -->${e.label ? `|${e.label}|` : ""} ${e.target}`)].join("\n");
};

const image = async (kind: "png" | "svg") => {
  const el = document.querySelector<HTMLElement>(".react-flow");
  if (!el) return;
  const url = await (kind === "png" ? toPng : toSvg)(el, {
    backgroundColor: "#F4F1EA",
    filter: (n) => !(n as HTMLElement).classList?.contains("react-flow__controls"),
  });
  Object.assign(document.createElement("a"), { href: url, download: `paperarse.${kind}` }).click();
};

type Props = { onCapture: () => void; xray: boolean; toggleXray: () => void };

export default function TopBar({ onCapture, xray, toggleXray }: Props) {
  const { graph, issues, undo, redo, past, future, err } = useGraphStore();
  const errors = issues.filter((i) => i.severity === "error").length;
  const B = "border border-ink px-2 py-1 hover:bg-ink hover:text-paper disabled:opacity-30";
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-ink bg-panel px-3 font-mono text-xs">
      <b className="mr-3 text-sm">PAPERARSE</b>
      <button className={B} onClick={onCapture}><Camera size={12} className="mr-1 inline" />Capture</button>
      <button className={B} onClick={toggleXray}>Source photo {xray ? "on" : "off"}</button>
      <button className={B} onClick={undo} disabled={!past.length} aria-label="Undo"><Undo2 size={12} /></button>
      <button className={B} onClick={redo} disabled={!future.length} aria-label="Redo"><Redo2 size={12} /></button>
      <span className="ml-2 text-orange">{errors} errors</span>
      <span className="text-amber">{issues.length - errors} warnings</span>
      {err && <span className="truncate text-orange">{err}</span>}
      <span className="ml-auto opacity-60">Export</span>
      <button className={B} onClick={() => save("graph.json", JSON.stringify(graph, null, 2))}>JSON</button>
      <button className={B} onClick={() => image("svg")}>SVG</button>
      <button className={B} onClick={() => image("png")}>PNG</button>
      <button className={B} onClick={() => save("graph.mmd", mermaid(graph))}>Mermaid</button>
      <button className={B} onClick={async () => save("audit.md", await api.report(graph))}>Report</button>
    </header>
  );
}
