import datetime as dt
import httpx

WIKI = "https://en.wikipedia.org/w/api.php"


async def research(label: str, ntype: str) -> dict:
    now = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    facts: list[dict] = []
    unresolved = [f"Which concrete technology or vendor implements '{label}' in this system?"]
    try:
        async with httpx.AsyncClient(timeout=8, headers={"User-Agent": "paperarse/1.0"}) as c:
            r = await c.get(WIKI, params={
                "action": "query", "generator": "search", "gsrsearch": label, "gsrlimit": 1,
                "prop": "extracts|info", "exintro": 1, "explaintext": 1, "exsentences": 2,
                "inprop": "url", "format": "json"})
            for p in r.json().get("query", {}).get("pages", {}).values():
                if p.get("extract"):
                    facts.append({"text": p["extract"].strip(), "url": p.get("fullurl", ""), "retrieved_at": now})
    except Exception as e:  # offline or blocked: degrade to an honest unresolved question
        unresolved.append(f"Live lookup failed ({type(e).__name__}); retry when online.")
    if not facts:
        unresolved.append(f"No public documentation matched '{label}'.")
    return {
        "sourced_facts": facts,
        "interpretations": [f"Treated as a {ntype.replace('_', ' ')} component; its role is inferred from its place in the sketch, not stated in the source."],
        "unresolved_questions": unresolved,
    }
