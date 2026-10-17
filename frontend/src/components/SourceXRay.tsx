import { useGraphStore } from "../store/useGraphStore";

export default function SourceXRay() {
  const { photo, sketch, graph, hover, selected } = useGraphStore();
  const n = graph.nodes.find((n) => n.id === (hover ?? selected));
  const b = n?.source_bbox;
  const box = (id: string) => sketch?.nodes.find((s) => s.id === id)?.source_bbox;
  return (
    <section className="h-full overflow-y-auto border-r border-ink bg-panel p-2 font-mono text-xs">
      <div className="mb-2 font-bold">Source photo {n && b ? `${n.id} [${b.map((v) => v.toFixed(0)).join(", ")}]` : ""}</div>
      <div className="relative border border-ink bg-paper">
        {photo ? <img src={photo} alt="Uploaded diagram" className="block w-full" /> : (
          <svg viewBox="0 0 100 100" className="block w-full" fill="none" stroke="var(--ink)" strokeWidth=".4">
            {sketch?.edges.map((e) => { const s = box(e.source), t = box(e.target); return s && t ? <line key={e.id} x1={s[0] + 8} y1={s[1] + 4.5} x2={t[0] + 8} y2={t[1] + 4.5} /> : null; })}
            {sketch?.nodes.map((s, i) => { const [x, y, w, h] = s.source_bbox!; return (
              <g key={s.id} transform={`rotate(${((i % 3) - 1) * 0.8} ${x + w / 2} ${y + h / 2})`}>
                <rect x={x} y={y} width={w} height={h} fill="var(--paper)" />
                <text x={x + 1} y={y + h / 2 + 1} fontSize="2.4" fontStyle="italic" fill="var(--ink)" stroke="none">{s.label}</text>
              </g>); })}
          </svg>
        )}
        {b && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" stroke="#0047AB" strokeWidth="1">
            <line x1="0" x2="100" y1={b[1] + b[3] / 2} y2={b[1] + b[3] / 2} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <line y1="0" y2="100" x1={b[0] + b[2] / 2} x2={b[0] + b[2] / 2} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <rect x={b[0]} y={b[1]} width={b[2]} height={b[3]} fill="rgba(0,71,171,.15)" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>
      <p className="mt-2 opacity-60">Hover a node on the canvas to locate it on the original.</p>
    </section>
  );
}
