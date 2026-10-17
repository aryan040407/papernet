from typing import Literal, Optional
from pydantic import BaseModel, Field

NodeType = Literal["process", "decision", "database", "client", "external_service", "ambiguous"]
Epistemic = Literal["observed", "inferred", "user_confirmed"]


class GraphNode(BaseModel):
    id: str
    type: NodeType = "process"
    label: str
    properties: dict = Field(default_factory=dict)
    position: dict[str, float] = Field(default_factory=lambda: {"x": 0.0, "y": 0.0})
    source_bbox: Optional[list[float]] = None  # [x, y, w, h] normalized 0-100 on the original photo
    confidence: float = Field(1.0, ge=0, le=1)
    epistemic_status: Epistemic = "observed"
    research_findings: list[dict] = Field(default_factory=list)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str = ""
    confidence: float = Field(1.0, ge=0, le=1)
    epistemic_status: Epistemic = "observed"


class GraphModel(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)


class GraphOperation(BaseModel):
    op_id: str
    op_type: Literal["ADD_NODE", "UPDATE_NODE", "DELETE_NODE", "ADD_EDGE", "DELETE_EDGE"]
    payload: dict
    rationale: str = ""
    status: Literal["pending_review", "approved", "rejected"] = "pending_review"


class ValidationIssue(BaseModel):
    id: str
    severity: Literal["error", "warning"]
    rule_code: Literal["DISCONNECTED_NODE", "UNREACHABLE_STEP", "DECISION_MISSING_BRANCH", "AMBIGUOUS_LABEL"]
    affected_ids: list[str]
    explanation: str
    proposed_fix_op: Optional[GraphOperation] = None
