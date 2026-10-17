import { useState } from "react";
import { useGraphStore } from "../store/useGraphStore";

export default function CommandBar() {
  const { ops, propose, resolve, busy } = useGraphStore();
  const [t, setT] = useState("");
  const pend = ops.filter((o) => o.status === "pending_review");
  return (
    <footer className="border-t border-ink bg-panel p-2 font-mono text-xs">
      {pend.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pend.map((o) => (
            <div key={o.op_id} className="flex items-center gap-2 border border-dashed border-cobalt bg-paper px-2 py-1">
              <b className="text-cobalt">{o.op_type}</b>
              <span className="font-sans">{o.rationale}</span>
              <button onClick={() => resolve(o.op_id, true)} className="border border-emerald px-1 text-emerald hover:bg-emerald hover:text-paper">[Approve]</button>
              <button onClick={() => resolve(o.op_id, false)} className="border border-orange px-1 text-orange hover:bg-orange hover:text-paper">[Reject]</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <span className="py-1 text-cobalt">&gt;</span>
        <input value={t} disabled={busy} onChange={(e) => setT(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && t.trim()) { propose(t); setT(""); } }}
          placeholder='add database "Redis Cache" after API Gateway | connect A to B | rename X to Y | delete Z'
          className="flex-1 border border-ink bg-paper px-2 py-1 outline-none focus:border-cobalt" />
      </div>
    </footer>
  );
}
