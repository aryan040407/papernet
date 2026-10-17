import { useEffect, useState } from "react";
import { useGraphStore } from "./store/useGraphStore";
import TopBar from "./components/TopBar";
import CaptureDrawer from "./components/CaptureDrawer";
import SourceXRay from "./components/SourceXRay";
import CanvasEditor from "./components/CanvasEditor";
import InspectorPanel from "./components/InspectorPanel";
import CommandBar from "./components/CommandBar";

export default function App() {
  const load = useGraphStore((s) => s.load);
  const loadId = useGraphStore((s) => s.loadId);
  const [cap, setCap] = useState(false);
  const [xray, setXray] = useState(true);
  useEffect(() => { load("microservices"); }, [load]);
  return (
    <div className="relative flex h-full flex-col">
      <TopBar onCapture={() => setCap(!cap)} xray={xray} toggleXray={() => setXray(!xray)} />
      {cap && <CaptureDrawer onClose={() => setCap(false)} />}
      <div className="flex min-h-0 flex-1">
        {xray && <div className="w-80 shrink-0"><SourceXRay /></div>}
        <main className="relative min-w-0 flex-1">
          <div className="absolute inset-0"><CanvasEditor key={loadId} /></div>
        </main>
        <div className="w-72 shrink-0"><InspectorPanel /></div>
      </div>
      <CommandBar />
    </div>
  );
}
