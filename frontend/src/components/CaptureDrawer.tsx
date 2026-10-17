import { useGraphStore } from "../store/useGraphStore";

const PRESETS = [
  ["microservices", "Microservices flow, disconnected cache"],
  ["auth", "Auth flowchart, missing branch"],
  ["iot", "IoT pipeline, ambiguous labels"],
];

export default function CaptureDrawer({ onClose }: { onClose: () => void }) {
  const load = useGraphStore((s) => s.load);
  const run = (preset?: string, image?: string) => { load(preset, image); onClose(); };
  const upload = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => run(undefined, r.result as string);
    r.readAsDataURL(f);
  };
  return (
    <aside className="absolute left-3 top-14 z-20 w-80 border border-ink bg-panel p-3 font-mono text-xs">
      <h2 className="mb-3 font-bold">Capture a diagram</h2>
      <label className="mb-3 block cursor-pointer border border-dashed border-ink p-3 text-center hover:bg-grid">
        Upload a photo
        <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      </label>
      <p className="mb-1 opacity-60">Demo sketches</p>
      {PRESETS.map(([id, name]) => (
        <button key={id} onClick={() => run(id)} className="mb-1 block w-full border border-ink p-2 text-left hover:bg-grid">{name}</button>
      ))}
    </aside>
  );
}
