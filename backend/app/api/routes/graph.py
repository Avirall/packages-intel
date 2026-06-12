import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.api.utils import get_owned_scan
from app.db.neo4j import run_query

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/graph", tags=["graph"])

_GRAPH_NODE_LIMIT = 300


class GraphNode(BaseModel):
    id: str
    labels: list[str]
    properties: dict


class GraphRelationship(BaseModel):
    id: str
    type: str
    startNodeId: str
    endNodeId: str
    properties: dict


class GraphData(BaseModel):
    nodes: list[GraphNode]
    relationships: list[GraphRelationship]
    truncated: bool = False


@router.get("/scan/{scan_id}", response_model=GraphData)
async def get_scan_graph(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
):
    doc = await get_owned_scan(scan_id, current_user)

    neo4j_id = doc.get("neo4j_scan_id")
    if not neo4j_id:
        return GraphData(nodes=[], relationships=[])

    try:
        rows = await run_query(
            """
            MATCH (s:Scan {id: $scan_id})-[:INCLUDES]->(p:Package)
            OPTIONAL MATCH (p)-[dep:DEPENDS_ON]->(p2:Package)
            OPTIONAL MATCH (p)-[:HOSTED_AT]->(r:Repository)
            OPTIONAL MATCH (r)-[mb:MAINTAINED_BY]->(c:Contributor)
            RETURN
              p, p2, r, c, dep, mb,
              id(p)   AS pid,  id(p2) AS p2id,
              id(r)   AS rid,  id(c)  AS cid,
              id(dep) AS dep_id, id(mb) AS mb_id
            LIMIT $limit
            """,
            {"scan_id": neo4j_id, "limit": _GRAPH_NODE_LIMIT + 1},
        )
    except Exception:
        logger.exception("Graph query failed for scan %s", scan_id)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Graph database query failed")

    truncated = len(rows) > _GRAPH_NODE_LIMIT
    rows = rows[:_GRAPH_NODE_LIMIT]

    nodes: dict[str, GraphNode] = {}
    rels: dict[str, GraphRelationship] = {}

    for row in rows:
        _add_node(nodes, row.get("p"),  row.get("pid"),  ["Package"])
        _add_node(nodes, row.get("p2"), row.get("p2id"), ["Package"])
        _add_node(nodes, row.get("r"),  row.get("rid"),  ["Repository"])
        _add_node(nodes, row.get("c"),  row.get("cid"),  ["Contributor"])

        if row.get("dep") is not None and row.get("dep_id") and row.get("pid") and row.get("p2id"):
            _add_rel(rels, row["dep_id"], "DEPENDS_ON",
                     str(row["pid"]), str(row["p2id"]), _to_props(row["dep"]))

        if row.get("mb") is not None and row.get("mb_id") and row.get("rid") and row.get("cid"):
            _add_rel(rels, row["mb_id"], "MAINTAINED_BY",
                     str(row["rid"]), str(row["cid"]), _to_props(row["mb"]))

    return GraphData(
        nodes=list(nodes.values()),
        relationships=list(rels.values()),
        truncated=truncated,
    )


# ── helpers ───────────────────────────────────────────────────────────────────

def _to_props(obj) -> dict:
    if obj is None:
        return {}
    if isinstance(obj, dict):
        return obj
    if hasattr(obj, "items"):
        return dict(obj.items())
    return {}


def _add_node(store: dict, node_data, node_id, labels: list[str]) -> None:
    if node_data is None or node_id is None:
        return
    key = str(node_id)
    if key not in store:
        store[key] = GraphNode(id=key, labels=labels, properties=_to_props(node_data))


def _add_rel(
    store: dict, rel_id, rel_type: str, start: str, end: str, props: dict
) -> None:
    key = str(rel_id)
    if key not in store:
        store[key] = GraphRelationship(
            id=key, type=rel_type, startNodeId=start, endNodeId=end, properties=props
        )
