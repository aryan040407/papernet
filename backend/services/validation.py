import networkx as nx
from models.schema import GraphModel, GraphOperation, ValidationIssue


def validate(g: GraphModel) -> list[ValidationIssue]:
    G = nx.DiGraph()
    G.add_nodes_from(n.id for n in g.nodes)
    G.add_edges_from((e.source, e.target) for e in g.edges if e.source in G and e.target in G)
    entries = [n.id for n in g.nodes if n.type == "client"] or [
        n for n in G if G.in_degree(n) == 0 and G.out_degree(n) > 0
    ]
    reach = set(entries)
    for s in entries:
        reach |= nx.descendants(G, s)
    out: list[ValidationIssue] = []

    def add(sev, code, n, why, fix=None):
        out.append(ValidationIssue(id=f"v{len(out) + 1}", severity=sev, rule_code=code,
                                   affected_ids=[n.id], explanation=why, proposed_fix_op=fix))

    for n in g.nodes:
        if G.degree(n.id) == 0:
            add("error", "DISCONNECTED_NODE", n, f"'{n.label}' has no edges; it is orphaned from the flow.",
                GraphOperation(op_id=f"fix_{n.id}", op_type="DELETE_NODE", payload={"id": n.id},
                               rationale=f"Remove orphan '{n.label}'"))
        elif n.id not in reach:
            add("error", "UNREACHABLE_STEP", n, f"'{n.label}' cannot be reached from any entry point.")
        if n.type == "decision" and G.out_degree(n.id) < 2:
            add("error", "DECISION_MISSING_BRANCH", n,
                f"Decision '{n.label}' has {G.out_degree(n.id)} outgoing branch(es); it needs at least 2.")
        if n.type == "ambiguous" or n.confidence < 0.6:
            add("warning", "AMBIGUOUS_LABEL", n,
                f"Label '{n.label}' is low-confidence ({n.confidence:.0%}); verify it against the source photo.")
    return out
