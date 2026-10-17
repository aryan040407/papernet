import datetime as dt
import json
import pathlib

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from models.schema import GraphModel, GraphOperation, ValidationIssue
from services import assistant, perception, research, validation

app = FastAPI(title="PAPERARSE")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class Analysis(BaseModel):
    graph: GraphModel
    issues: list[ValidationIssue]


class AnalyzeReq(BaseModel):
    preset: str | None = None
    image: str | None = None


class GraphReq(BaseModel):
    graph: GraphModel


class NodeReq(BaseModel):
    label: str
    type: str = "process"


class CmdReq(GraphReq):
    command: str


# Emit the canonical JSON schema from the Pydantic models on startup.
_schemas = pathlib.Path(__file__).resolve().parent.parent / "schemas"
_schemas.mkdir(exist_ok=True)
(_schemas / "graph.schema.json").write_text(json.dumps(Analysis.model_json_schema(), indent=2))


@app.post("/api/perception/analyze", response_model=Analysis)
def analyze(r: AnalyzeReq):
    g = perception.analyze(r.preset, r.image)
    return Analysis(graph=g, issues=validation.validate(g))


@app.post("/api/validation/check", response_model=list[ValidationIssue])
def check(r: GraphReq):
    return validation.validate(r.graph)


@app.post("/api/research/node")
async def research_node(r: NodeReq):
    return await research.research(r.label, r.type)


@app.post("/api/assistant/command", response_model=list[GraphOperation])
def command(r: CmdReq):
    return assistant.command(r.command, r.graph)


@app.post("/api/export/report", response_class=PlainTextResponse)
def report(r: GraphReq):
    g, issues = r.graph, validation.validate(r.graph)
    L = ["# PAPERARSE Validation & Provenance Audit",
         f"_Generated {dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')}_", "",
         f"{len(g.nodes)} nodes, {len(g.edges)} edges, {len(issues)} issues", "", "## Validation"]
    L += [f"- **{i.severity.upper()}** `{i.rule_code}` [{', '.join(i.affected_ids)}]: {i.explanation}"
          for i in issues] or ["- All structural checks passed."]
    L += ["", "## Node Provenance", "", "| ID | Label | Type | Conf. | Status | Source bbox |", "|---|---|---|---|---|---|"]
    L += [f"| {n.id} | {n.label} | {n.type} | {n.confidence:.2f} | {n.epistemic_status} | {n.source_bbox} |"
          for n in g.nodes]
    for n in g.nodes:
        for f in n.research_findings:
            L += ["", f"### Research: {n.label}", "**Sourced facts**"]
            L += [f"- {s['text']} ([source]({s['url']}), retrieved {s['retrieved_at']})"
                  for s in f.get("sourced_facts", [])] or ["- none"]
            L += ["**Interpretations**"] + [f"- {t}" for t in f.get("interpretations", [])]
            L += ["**Unresolved questions**"] + [f"- {t}" for t in f.get("unresolved_questions", [])]
    return "\n".join(L)
