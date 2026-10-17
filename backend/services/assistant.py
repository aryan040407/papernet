import re
import uuid
from models.schema import GraphModel, GraphOperation

TYPES = "process|decision|database|client|external_service"


def command(text: str, g: GraphModel) -> list[GraphOperation]:
    """Rule-based natural-language -> GraphOperation[]; every op stays pending_review."""
    t, ops = text.strip(), []

    def add(kind, payload, why):
        ops.append(GraphOperation(op_id=uuid.uuid4().hex[:8], op_type=kind, payload=payload, rationale=why))

    def find(s):
        s = s.strip(" '\"").lower()
        return next((n for n in g.nodes if n.label.lower() == s), None) or next(
            (n for n in g.nodes if s in n.label.lower()), None)

    if m := re.match(r"(?:connect|link)\s+(.+?)\s+to\s+(.+?)(?:\s+(?:as|labell?ed)\s+(.+))?$", t, re.I):
        a, b = find(m[1]), find(m[2])
        if a and b:
            add("ADD_EDGE", {"id": f"e_{a.id}_{b.id}", "source": a.id, "target": b.id,
                             "label": (m[3] or "").strip(" '\"")}, f"Connect {a.label} -> {b.label}")
    elif m := re.match(r"rename\s+(.+?)\s+to\s+(.+)$", t, re.I):
        if n := find(m[1]):
            add("UPDATE_NODE", {"id": n.id, "label": m[2].strip(" '\""), "confidence": 1.0,
                                "epistemic_status": "user_confirmed"}, f"Rename {n.label}")
    elif m := re.match(rf"(?:make|set)\s+(.+?)\s+(?:a|an|as)\s+({TYPES})$", t, re.I):
        if n := find(m[1]):
            add("UPDATE_NODE", {"id": n.id, "type": m[2].lower()}, f"Retype {n.label} as {m[2].lower()}")
    elif m := re.match(r"(?:delete|remove)\s+(.+)$", t, re.I):
        if n := find(m[1]):
            add("DELETE_NODE", {"id": n.id}, f"Remove {n.label} and its edges")
    elif m := re.match(rf"(?:add|insert)\s+(?:an?\s+)?(?:({TYPES})\s+)?(.+?)(?:\s+after\s+(.+?))?(?:\s+before\s+(.+?))?$", t, re.I):
        ty, name, a, b = m.groups()
        a, b = a and find(a), b and find(b)
        name, nid = name.strip(" '\""), "n" + uuid.uuid4().hex[:5]
        pos = {"x": a.position["x"] + 220, "y": a.position["y"] + 40} if a else {"x": 60.0, "y": 60.0}
        add("ADD_NODE", {"id": nid, "type": (ty or "process").lower(), "label": name, "position": pos,
                         "epistemic_status": "user_confirmed"}, f"Create '{name}'")
        if a:
            add("ADD_EDGE", {"id": f"e_{a.id}_{nid}", "source": a.id, "target": nid}, f"Link {a.label} -> {name}")
        if b:
            add("ADD_EDGE", {"id": f"e_{nid}_{b.id}", "source": nid, "target": b.id}, f"Link {name} -> {b.label}")
    return ops
