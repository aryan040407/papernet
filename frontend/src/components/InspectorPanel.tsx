import { useGraphStore } from "../store/useGraphStore";

const TYPES = ["process", "decision", "database", "client", "external_service", "ambiguous"];

export default function InspectorPanel() {
  const { graph, issues, selected, select, edit, research, stage, busy } = useGraphStore();
  const n = graph.nodes.find((n) => n.id === selected);
  const r = n?.research_findings[0];
  return (
    <aside className="h-full overflow-y-auto border-l border-ink bg-panel p-3 font-mono text-xs">
      <h2 className="mb-2 font-bold">Validation ({issues.length})</h2>
      {issues.length === 0 && <p className="text-emerald">Structure valid</p>}
      {issues.map((i) => (
        <div key={i.id} onClick={() => select(i.affected_ids[0])}
          className={`mb-2 cursor-pointer border-l-4 bg-paper p-2 ${i.severity === "error" ? "border-orange" : "border-amber"}`}>
          <b>{i.rule_code}</b>
          <p className="font-sans">{i.explanation}</p>
          {i.proposed_fix_op && (
            <button onClick={(e) => { e.stopPropagation(); stage(i.proposed_fix_op!); }} className="mt-1 border border-ink px-2 py-0.5 hover:bg-grid">Stage fix</button>
          )}
        </div>
      ))}
      {n && (
        <>
          <h2 className="mb-2 mt-4 font-bold">Node {n.id}</h2>
          <input key={n.id + n.label} defaultValue={n.label} className="mb-2 w-full border border-ink bg-paper p-1"
            onBlur={(e) => e.target.value && e.target.value !== n.label && edit(n.id, { label: e.target.value, confidence: 1, epistemic_status: "user_confirmed" })} />
          <select value={n.type} onChange={(e) => edit(n.id, { type: e.target.value })} className="mb-2 w-full border border-ink bg-paper p-1">
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <p>confidence {n.confidence.toFixed(2)}, {n.epistemic_status}</p>
          <p>bbox {JSON.stringify(n.source_bbox)}</p>
          <button onClick={() => research(n.id)} disabled={busy} className="my-2 w-full border border-cobalt p-1 text-cobalt hover:bg-cobalt hover:text-paper">
            {busy ? "Querying..." : "Research component"}
          </button>
          {r && (
            <div className="font-sans">
              <h3 className="font-mono font-bold text-cobalt">Sourced facts</h3>
              {r.sourced_facts.length === 0 && <p className="opacity-60">None found.</p>}
              {r.sourced_facts.map((f: any, i: number) => (
                <p key={i} className="mb-1">{f.text}<br /><a className="text-cobalt underline" href={f.url} target="_blank" rel="noreferrer">{f.url}</a> <span className="font-mono opacity-60">{f.retrieved_at}</span></p>
              ))}
              <h3 className="mt-2 font-mono font-bold">Interpretations</h3>
              {r.interpretations.map((t: string, i: number) => <p key={i} className="mb-1">{t}</p>)}
              <h3 className="mt-2 font-mono font-bold text-amber">Unresolved questions</h3>
              {r.unresolved_questions.map((t: string, i: number) => <p key={i} className="mb-1">{t}</p>)}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
