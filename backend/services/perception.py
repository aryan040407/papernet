from models.schema import GraphEdge, GraphModel, GraphNode

# nodes: (type, label, x, y, confidence) on a 0-100 photo grid; edges: (src_idx, dst_idx, label)
PRESETS = {
    "microservices": (
        [("client", "Web Client", 4, 42, .97), ("process", "API Gateway", 26, 42, .95),
         ("process", "Auth Service", 50, 18, .92), ("process", "Order Service", 50, 66, .90),
         ("database", "Orders DB", 74, 66, .94), ("database", "Redis Cache", 74, 18, .88),
         ("external_service", "Payments API", 74, 42, .85)],
        [(0, 1, ""), (1, 2, "verify"), (1, 3, "route"), (3, 4, "write"), (3, 6, "charge")],
    ),
    "auth": (
        [("client", "User Login", 4, 40, .96), ("process", "Submit Credentials", 26, 40, .93),
         ("decision", "Valid?", 50, 40, .90), ("process", "Issue Token", 72, 18, .91),
         ("process", "Dashboard", 72, 62, .90)],
        [(0, 1, ""), (1, 2, ""), (2, 3, "yes"), (3, 4, "")],
    ),
    "iot": (
        [("client", "Sensor", 4, 40, .90), ("ambiguous", "Gatewy?", 26, 40, .45),
         ("ambiguous", "M0TT Brkr", 48, 40, .38), ("process", "Stream Proc.", 70, 40, .80),
         ("database", "TSDB", 70, 70, .70), ("client", "Dashboard", 82, 12, .95)],
        [(0, 1, ""), (1, 2, ""), (2, 3, ""), (3, 4, "store"), (3, 5, "")],
    ),
}


def analyze(preset: str | None = None, image: str | None = None) -> GraphModel:
    """Deterministic local fallback so the app runs out-of-the-box.
    Presets resolve by name; uploads map to a preset by payload size.
    Replace this body with a Vision-LLM call when a key is configured."""
    key = preset if preset in PRESETS else list(PRESETS)[len(image or "") % len(PRESETS)]
    nodes, edges = PRESETS[key]
    return GraphModel(
        nodes=[
            GraphNode(id=f"n{i}", type=t, label=l, position={"x": x * 12.0, "y": y * 9.0},
                      source_bbox=[x, y, 16, 9], confidence=c,
                      epistemic_status="observed" if c >= .6 else "inferred")
            for i, (t, l, x, y, c) in enumerate(nodes)
        ],
        edges=[GraphEdge(id=f"e_n{a}_n{b}", source=f"n{a}", target=f"n{b}", label=l) for a, b, l in edges],
    )
