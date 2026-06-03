# OSS Sentinel — Architecture & Project Details

---

## What It Does

OSS Sentinel is a graph-backed AI agent that maps a project's dependency tree onto its human
maintainers and scores each package by **abandonment and succession risk**.

Users upload a dependency file (`package.json`, `requirements.txt`, `go.mod`, etc.), the system
fetches live maintainer data from GitHub and deps.dev, loads it into a Neo4j knowledge graph,
computes risk scores, and exposes a natural-language chat interface powered by a Neo4j Aura Agent.

---

## Motivation

The xz-utils backdoor (2024) and Log4Shell (2021) shared a root cause: critical infrastructure
maintained by burned-out individuals with no succession plan. CVE scanners catch known
vulnerabilities. Nothing catches the **human risk** — the maintainer who hasn't committed in
14 months, the package downloaded 3M times per week owned by one GitHub account.

OSS Sentinel adds the missing layer: a graph connecting packages to the people behind them,
scored across the full transitive dependency tree, queryable in natural language.

**Why graph, not LLM:** The path `your-app → express → finalhandler → sole maintainer: inactive`
requires live GitHub contributor data traversed across a transitive dependency graph. That is a
graph problem. An LLM cannot answer it.

**Why this is different from DepGraph Agent (already submitted to hackathon):**
DepGraph tracks CVE vulnerabilities (security risk). OSS Sentinel tracks maintainer activity
and succession patterns (sustainability risk). Different data, graph model, and risk model entirely.

---

## Build Status

```
Legend:  ✅ Done   🔧 In Progress   ⬜ Not Started
```

### Backend
| Layer | File(s) | Status | Notes |
|---|---|---|---|
| App entry point | `app/main.py` | ✅ Done | FastAPI app, CORS, lifespan, MongoDB indexes |
| Config | `app/core/config.py` | ✅ Done | pydantic-settings, all env vars |
| Security | `app/core/security.py` | ✅ Done | JWT create/decode, bcrypt hash/verify |
| MongoDB client | `app/db/mongodb.py` | ✅ Done | Motor async singleton, collection accessors |
| Neo4j client | `app/db/neo4j.py` | ✅ Done | Async driver singleton, run_query helper |
| User model | `app/models/user.py` | ✅ Done | Pydantic document for MongoDB |
| Scan model | `app/models/scan.py` | ✅ Done | Pydantic document with ScanSummary |
| Message model | `app/models/message.py` | ✅ Done | Chat message document |
| Auth schemas | `app/schemas/auth.py` | ✅ Done | Register/Login/Token/Refresh request+response |
| Scan schemas | `app/schemas/scan.py` | ✅ Done | ScanResponse, PackageRisk shapes |
| Chat schemas | `app/schemas/chat.py` | ✅ Done | MessageRequest/Response, ChatHistory |
| Auth dependency | `app/api/deps.py` | ✅ Done | get_current_user from Bearer JWT |
| Auth routes | `app/api/routes/auth.py` | ✅ Done | register, login, refresh, me |
| Scan routes | `app/api/routes/scan.py` | ⬜ Not Started | upload, parse, analyze, get results |
| History routes | `app/api/routes/history.py` | ⬜ Not Started | list scans, delete scan |
| Chat routes | `app/api/routes/chat.py` | ⬜ Not Started | send message → Aura Agent, get history |
| Graph routes | `app/api/routes/graph.py` | ⬜ Not Started | Cypher → NVL-shaped JSON |
| npm parser | `app/services/parsers/npm.py` | ⬜ Not Started | package.json, pnpm-lock.yaml, yarn.lock |
| Python parser | `app/services/parsers/python.py` | ⬜ Not Started | requirements.txt, pyproject.toml, uv.lock |
| Go parser | `app/services/parsers/go.py` | ⬜ Not Started | go.mod |
| Rust parser | `app/services/parsers/rust.py` | ⬜ Not Started | Cargo.toml |
| Java parser | `app/services/parsers/java.py` | ⬜ Not Started | pom.xml |
| Ruby parser | `app/services/parsers/ruby.py` | ⬜ Not Started | Gemfile |
| PHP parser | `app/services/parsers/php.py` | ⬜ Not Started | composer.json |
| Parser router | `app/services/parsers/__init__.py` | ⬜ Not Started | detect_ecosystem(filename) → correct parser |
| deps.dev fetcher | `app/services/fetchers/depsdev.py` | ⬜ Not Started | dependency tree + OpenSSF Scorecard |
| GitHub fetcher | `app/services/fetchers/github.py` | ⬜ Not Started | contributor stats, last commit, commit freq |
| Registry fetcher | `app/services/fetchers/registries.py` | ⬜ Not Started | npm + PyPI weekly download counts |
| Risk scoring | `app/services/risk.py` | ⬜ Not Started | composite risk_score + label (HIGH/MED/LOW) |
| Graph loader | `app/services/graph_loader.py` | ⬜ Not Started | write Package/Repo/Contributor nodes to AuraDB |
| Aura Agent proxy | `app/services/aura_agent.py` | ⬜ Not Started | OAuth token cache + POST to agent endpoint |
| Seed script 1 | `scripts/seed/01_fetch_top_packages.py` | ⬜ Not Started | Top 300 npm packages by downloads |
| Seed script 2 | `scripts/seed/02_fetch_deps.py` | ⬜ Not Started | Dep trees via deps.dev for each package |
| Seed script 3 | `scripts/seed/03_fetch_github.py` | ⬜ Not Started | Contributor stats from GitHub API |
| Seed script 4 | `scripts/seed/04_load_graph.py` | ⬜ Not Started | Compute risk scores + write to AuraDB |

### Frontend
| Layer | File(s) | Status | Notes |
|---|---|---|---|
| Project setup | `package.json`, `tsconfig.json`, `next.config.ts` | ✅ Done | Next.js 16, TypeScript, Tailwind v4 |
| Global styles | `app/globals.css` | ✅ Done | Tailwind v4 dark theme, risk color palette |
| Root layout | `app/layout.tsx` | ✅ Done | Geist font, dark mode, metadata |
| UI components | `components/ui/` | ✅ Done | shadcn: button, card, badge, input, table, chart, etc. |
| Types | `types/user.ts`, `types/scan.ts`, `types/chat.ts` | ✅ Done | Full TypeScript interfaces for all API shapes |
| API client | `lib/api.ts` | ✅ Done | axios + JWT interceptor + silent refresh on 401 |
| Token store | `lib/auth.ts` | ✅ Done | localStorage access/refresh token helpers |
| Utility | `lib/utils.ts` | ✅ Done | cn() helper for Tailwind class merging |
| Auth hook | `hooks/useAuth.ts` | ✅ Done | login, register, logout, user state |
| Scan hook | `hooks/useScan.ts` | ✅ Done | fetch scan + packages, polls every 3s while processing |
| Protected layout | `app/(app)/layout.tsx` | ✅ Done | auth guard redirects to /login if no token |
| Landing page | `app/(marketing)/page.tsx` | ✅ Done | Hero + ProblemSection + SupportedFormats |
| Login page | `app/(auth)/login/page.tsx` | ✅ Done | LoginForm wired to /auth/login |
| Register page | `app/(auth)/register/page.tsx` | ✅ Done | RegisterForm wired to /auth/register |
| Dashboard page | `app/(app)/dashboard/page.tsx` | ✅ Done | UploadZone + ScanHistory layout |
| Scan results page | `app/(app)/scan/[id]/page.tsx` | ✅ Done | All panels composed, layout correct |
| Navbar | `components/shared/Navbar.tsx` | ✅ Done | Logo, username, sign out |
| RiskBadge | `components/shared/RiskBadge.tsx` | ✅ Done | HIGH/MEDIUM/LOW colored chip |
| LoginForm | `components/auth/LoginForm.tsx` | ✅ Done | Controlled form, error handling |
| RegisterForm | `components/auth/RegisterForm.tsx` | ✅ Done | Controlled form, API error surfacing |
| Hero | `components/landing/Hero.tsx` | ✅ Done | Headline, CTA, problem framing |
| ProblemSection | `components/landing/ProblemSection.tsx` | ✅ Done | xz-utils, Log4Shell case study cards |
| SupportedFormats | `components/landing/SupportedFormats.tsx` | ✅ Done | All 11 file formats shown |
| UploadZone | `components/dashboard/UploadZone.tsx` | ✅ Done | react-dropzone, file validation, POST /scan/upload |
| ScanHistory | `components/dashboard/ScanHistory.tsx` | ✅ Done | GET /history, links to scan pages |
| SummaryCards | `components/scan/SummaryCards.tsx` | ✅ Done | 4 stat cards from scan summary |
| RiskDonut | `components/scan/RiskDonut.tsx` | ✅ Done | Recharts PieChart, HIGH/MED/LOW split |
| RiskBarChart | `components/scan/RiskBarChart.tsx` | ✅ Done | Top 10 riskiest packages bar chart |
| RiskTable | `components/scan/RiskTable.tsx` | ✅ Done | Sortable table: name, risk, bus factor, downloads, last commit |
| GraphCanvas | `components/scan/GraphCanvas.tsx` | ✅ Done | NVL lazy-loaded, nodes colored by risk, size by downloads |
| ChatPanel | `components/scan/ChatPanel.tsx` | ✅ Done | Chat UI, preset questions, POST /chat/{id} |
| ScatterPlot | `components/scan/ScatterPlot.tsx` | ⬜ Not Started | downloads vs inactivity scatter (nice-to-have) |
| Frontend Dockerfile | `frontend/Dockerfile` | ⬜ Not Started | Production container |

### Infrastructure
| Layer | Status | Notes |
|---|---|---|
| AuraDB instance | ⬜ Not Started | Create free instance, note URI + password |
| Aura Agent | ⬜ Not Started | Create agent, configure 4 tools, get endpoint URL |
| MongoDB Atlas | ⬜ Not Started | Create free cluster, get connection string |
| Backend Dockerfile | ✅ Done | `backend/Dockerfile` ready |
| docker-compose.yml | ✅ Done | MongoDB + backend + frontend orchestration |
| Vercel deploy | ⬜ Not Started | Connect frontend repo, set NEXT_PUBLIC_API_URL |
| Railway/Render deploy | ⬜ Not Started | Deploy backend container, set all env vars |

---

## What To Build Next (Priority Order)

### 1. File Parsers  `app/services/parsers/`
Each parser receives raw file content (string) and returns `list[str]` — a flat list of package names.

```python
# Interface every parser must implement
def parse(content: str) -> list[str]: ...
```

| Parser | Input | Key logic |
|---|---|---|
| npm | `package.json` | `json.loads` → merge `dependencies + devDependencies` keys |
| Python | `requirements.txt` | line-by-line, strip `==`, `>=`, `[extras]` |
| Python | `pyproject.toml` | `tomllib.loads` → `project.dependencies` list |
| Python | `uv.lock` | `tomllib.loads` → `[[package]]` array, extract `name` |
| Go | `go.mod` | regex `^require` block, strip version |
| Rust | `Cargo.toml` | `tomllib.loads` → `[dependencies]` keys |
| Java | `pom.xml` | `xml.etree` → `//dependency/artifactId` nodes |
| Ruby | `Gemfile` | regex `gem ['"]name['"]` lines |
| PHP | `composer.json` | `json.loads` → `require + require-dev` keys |

The `parsers/__init__.py` router maps filename → parser function:
```python
PARSERS = {
    "package.json": npm.parse,
    "requirements.txt": python.parse_requirements,
    "pyproject.toml": python.parse_pyproject,
    ...
}
def detect_and_parse(filename: str, content: str) -> tuple[str, list[str]]:
    # returns (ecosystem, package_names)
```

### 2. Data Fetchers  `app/services/fetchers/`

**`depsdev.py`** — for each package name:
- `GET https://api.deps.dev/v3/systems/NPM/packages/{name}/versions` → get latest version
- `GET https://api.deps.dev/v3/systems/NPM/packages/{name}/versions/{version}/dependencies` → transitive dep tree
- `GET https://api.deps.dev/v3/projects/{owner}/{repo}` → OpenSSF Scorecard score

**`github.py`** — for each package's GitHub repo URL:
- `GET /repos/{owner}/{repo}/contributors?per_page=10` → contributor logins + commit counts
- `GET /repos/{owner}/{repo}/commits?per_page=1` → last commit date
- Rate limit: use `asyncio.Semaphore(10)` to cap concurrent requests

**`registries.py`** — weekly download counts:
- npm: `GET https://api.npmjs.org/downloads/point/last-week/{name}`
- PyPI: `GET https://pypistats.org/api/packages/{name}/recent`

### 3. Risk Scoring  `app/services/risk.py`

```python
def compute_risk(
    bus_factor: int,
    inactivity_months: float,
    open_issues: int,
    scorecard_score: float,
) -> tuple[float, str]:
    score = (
        (1 / max(bus_factor, 1)) * 40
        + min(inactivity_months / 18, 1.0) * 30
        + min(open_issues / 500, 1.0) * 15
        + ((10 - scorecard_score) / 10) * 15
    )
    label = "HIGH" if score > 65 else "MEDIUM" if score > 35 else "LOW"
    return round(score, 1), label
```

### 4. Graph Loader  `app/services/graph_loader.py`

Writes everything to AuraDB using `MERGE` (idempotent — safe to re-run):

```cypher
-- Package node (shared across users)
MERGE (p:Package {name: $name, ecosystem: $ecosystem})
SET p.weekly_downloads = $downloads, p.bus_factor = $bus_factor,
    p.risk_score = $risk_score, p.last_release_months_ago = $months_ago

-- Repository node
MERGE (r:Repository {url: $url})
SET r.stars = $stars, r.open_issues = $issues,
    r.last_commit_at = $last_commit, r.scorecard_score = $score

-- Contributor node
MERGE (c:Contributor {login: $login})
SET c.commits_last_90d = $commits, c.last_commit_date = $last_date,
    c.is_sole_maintainer = $is_sole

-- Relationships
MERGE (p)-[:HOSTED_AT]->(r)
MERGE (r)-[:MAINTAINED_BY {commits_last_90d: $commits}]->(c)
MERGE (dep1)-[:DEPENDS_ON {depth: $depth}]->(dep2)

-- Scan node (user-specific)
MERGE (s:Scan {id: $scan_id})
MERGE (s)-[:INCLUDES {is_direct: $direct}]->(p)
```

### 5. Scan Route  `app/api/routes/scan.py`

```
POST /scan/upload
  1. Receive multipart file
  2. Create Scan doc in MongoDB (status=pending)
  3. Return {id, status} immediately
  4. Kick off background task:
       a. parse file → package names
       b. fetch dep tree + GitHub stats (concurrent, rate-limited)
       c. compute risk scores
       d. write to AuraDB
       e. update MongoDB scan status=completed + summary

GET /scan/{id}          → return Scan doc from MongoDB
GET /scan/{id}/packages → query AuraDB for PackageRisk list
GET /scan/{id}/graph    → Cypher path query → NVL-shaped {nodes, relationships}
```

### 6. History Route  `app/api/routes/history.py`

```
GET    /history       → MongoDB scans where user_id == current user, newest first
DELETE /history/{id}  → delete scan from MongoDB (and optionally Scan node from AuraDB)
```

### 7. Chat Route  `app/api/routes/chat.py`

```
POST /chat/{scan_id}
  1. Validate scan belongs to current user
  2. Save user message to MongoDB messages collection
  3. POST to Aura Agent endpoint with {input: message}
  4. Save assistant reply to MongoDB
  5. Return assistant MessageResponse

GET /chat/{scan_id}
  → return all messages for this scan, sorted by created_at
```

### 8. Aura Agent  `app/services/aura_agent.py`

```python
# OAuth2 client_credentials flow
async def get_bearer_token() -> str:
    # POST https://api.neo4j.io/oauth2/token
    # cache token until expiry

async def query_agent(question: str) -> str:
    token = await get_bearer_token()
    resp = await httpx.post(
        settings.aura_agent_endpoint,
        headers={"Authorization": f"Bearer {token}"},
        json={"input": question},
    )
    return resp.json()["output"]
```

### 9. Graph Route  `app/api/routes/graph.py`

Returns NVL-compatible `{nodes, relationships}` for the GraphCanvas component:

```cypher
MATCH (s:Scan {id: $scan_id})-[:INCLUDES]->(p:Package)
OPTIONAL MATCH (p)-[:DEPENDS_ON]->(dep:Package)
OPTIONAL MATCH (p)-[:HOSTED_AT]->(r:Repository)-[:MAINTAINED_BY]->(c:Contributor)
RETURN p, dep, r, c
LIMIT 200
```

Response shape:
```json
{
  "nodes": [{"id": "...", "labels": ["Package"], "properties": {...}}],
  "relationships": [{"id": "...", "type": "DEPENDS_ON", "startNodeId": "...", "endNodeId": "..."}]
}
```

### 10. Aura Agent Configuration (in Aura Console)

Must be done manually in the Neo4j Aura Console UI:

- Create AuraDB Free instance
- Create Aura Agent in External mode
- Add Tool 1: `package_risk_profile` (Cypher Template)
- Add Tool 2: `risky_deps_in_tree` (Cypher Template)
- Add Tool 3: `find_critical_singles` (Cypher Template)
- Add Tool 4: `ad_hoc` (Text2Cypher)
- Copy endpoint URL + client credentials to `backend/.env`

### 11. Seed Scripts (run once)

Pre-populates AuraDB with top 300 npm packages so the graph has data before any user uploads.

```
01_fetch_top_packages.py  → hits npm registry, saves top 300 by weekly downloads to .cache/
02_fetch_deps.py          → calls deps.dev for each, saves dep trees to .cache/
03_fetch_github.py        → calls GitHub API for each repo, saves contributor data to .cache/
04_load_graph.py          → reads .cache/, computes risk scores, writes to AuraDB via run_query()
```

### 12. Deploy

```
Frontend  → Vercel (connect GitHub repo, set NEXT_PUBLIC_API_URL)
Backend   → Railway or Render (Docker deploy, set all .env vars)
MongoDB   → Atlas free tier (M0, 512MB)
AuraDB    → Neo4j AuraDB Free (already provisioned with seed data)
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser  (Next.js 16 — App Router, no server-side secrets)  │
│                                                               │
│   /              Landing (Hero, Problem, SupportedFormats)   │
│   /login         LoginForm → POST /auth/login                │
│   /register      RegisterForm → POST /auth/register          │
│   /dashboard     UploadZone + ScanHistory                    │
│   /scan/[id]     SummaryCards + Charts + NVL + Chat          │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST + JWT (axios, auto-refresh)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FastAPI backend (Python 3.12)                                │
│                                                               │
│   /auth/*   register · login · refresh · me                  │
│   /scan/*   upload → parse → fetch → score → load → results  │
│   /history  list + delete past scans                         │
│   /chat/*   message → Aura Agent → persist → return reply    │
│   /graph/*  Cypher → NVL-shaped JSON for GraphCanvas         │
└──────┬────────────────────┬──────────────────┬──────────────┘
       │                    │                  │
       ▼                    ▼                  ▼
┌────────────┐   ┌────────────────┐   ┌──────────────────────┐
│  MongoDB    │   │  AuraDB         │   │  Aura Agent           │
│  Atlas      │   │  (Neo4j graph)  │   │  External mode        │
│             │   │                 │   │                       │
│  users      │   │  :Package       │   │  Tool 1 (Template):   │
│  scans      │   │  :Repository    │   │  package_risk_profile │
│  messages   │   │  :Contributor   │   │                       │
│             │   │  :Scan          │   │  Tool 2 (Template):   │
│             │   │                 │   │  risky_deps_in_tree   │
│  stores:    │   │  stores:        │   │                       │
│  auth state │   │  graph + risk   │   │  Tool 3 (Template):   │
│  scan meta  │   │  reasoning      │   │  find_critical_singles│
│  chat msgs  │   │                 │   │                       │
└────────────┘   └────────────────┘   │  Tool 4 (Text2Cypher):│
                                        │  ad_hoc               │
                      ▲                 └──────────────────────┘
                      │ writes during scan
           ┌──────────────────────┐
           │  External APIs        │
           │  deps.dev             │  → dependency tree + Scorecard
           │  GitHub API           │  → contributor stats
           │  npm / PyPI registry  │  → download counts
           └──────────────────────┘
```

---

## Data Flow (single scan end-to-end)

```
User uploads package.json
        │
        ▼
POST /scan/upload
  ├─ parse file → ["express", "lodash", "axios", ...]
  ├─ create Scan in MongoDB (status=pending)
  ├─ return {id} to frontend immediately
  └─ background task starts:
        │
        ├─ for each package:
        │    ├─ deps.dev: get transitive deps + scorecard score
        │    ├─ GitHub API: get contributors + commit history
        │    └─ npm registry: get weekly download count
        │
        ├─ compute bus_factor + risk_score for each package
        │
        ├─ write to AuraDB (MERGE — idempotent):
        │    Package nodes, Repository nodes, Contributor nodes
        │    DEPENDS_ON, HOSTED_AT, MAINTAINED_BY relationships
        │    Scan node → INCLUDES → Package nodes
        │
        └─ update MongoDB Scan (status=completed, summary={...})

Frontend polls GET /scan/{id} every 3s
  → status changes to "completed"
  → frontend stops polling, loads full results
```

---

## Neo4j Graph Schema

```cypher
(:Package {
  name,                      // "express"
  ecosystem,                 // "npm" | "python" | "go" | "rust" | "java" | "ruby" | "php"
  weekly_downloads,
  bus_factor,                // computed: active contributors in last 90 days
  risk_score,                // computed: 0–100 composite score
  last_release_months_ago
})

(:Repository {
  url,                       // "github.com/expressjs/express"
  stars,
  open_issues,
  last_commit_at,
  scorecard_score            // OpenSSF 0–10
})

(:Contributor {
  login,                     // GitHub username
  commits_last_90d,
  last_commit_date,
  is_sole_maintainer
})

(:Scan {
  id,                        // UUID, matches MongoDB _id
  created_at
})

(Scan)-[:INCLUDES { is_direct }]->(Package)
(Package)-[:DEPENDS_ON { depth }]->(Package)
(Package)-[:HOSTED_AT]->(Repository)
(Repository)-[:MAINTAINED_BY { commits_last_90d }]->(Contributor)
(Contributor)-[:ALSO_MAINTAINS]->(Package)
```

**Key design decision:** Package, Repository, and Contributor nodes are **shared across all users**.
If two users both scan a project that uses `express`, it maps to the same `:Package` node.
Only `:Scan` nodes are user-specific. This keeps the graph small and makes cross-user queries possible.

---

## Risk Score Formula

```
risk_score (0–100) =
  (1 / max(bus_factor, 1))        × 40   // sole maintainer = max risk
  + clamp(inactivity_months / 18) × 30   // 18+ months inactive = max
  + clamp(open_issues / 500)      × 15   // growing backlog
  + (10 - scorecard_score) / 10   × 15   // poor OpenSSF health

Labels:  HIGH > 65  |  MEDIUM 35–65  |  LOW < 35
```

---

## Aura Agent — Tool Definitions

All four tools must be created manually in the Neo4j Aura Console UI.

### Tool 1 — `package_risk_profile` (Cypher Template)
> Use when the user asks about a specific package's risk, maintainers, or health. Param: package_name.
```cypher
MATCH (p:Package {name: $package_name})-[:HOSTED_AT]->(r:Repository)
OPTIONAL MATCH (r)-[c:MAINTAINED_BY]->(m:Contributor)
RETURN p.name, p.weekly_downloads, p.risk_score, p.bus_factor,
       r.last_commit_at, r.open_issues, r.scorecard_score,
       collect({login: m.login, commits_90d: c.commits_last_90d,
                last_commit: c.last_commit_date}) AS maintainers
```

### Tool 2 — `risky_deps_in_tree` (Cypher Template)
> Use when the user asks which of their dependencies are at risk or wants to audit a package tree. Param: root_package.
```cypher
MATCH (root:Package {name: $root_package})
MATCH path = (root)-[:DEPENDS_ON*1..4]->(dep:Package)
WHERE dep.bus_factor <= 1 OR dep.last_release_months_ago > 12
MATCH (dep)-[:HOSTED_AT]->(r:Repository)
RETURN dep.name, dep.weekly_downloads, dep.bus_factor,
       dep.last_release_months_ago, r.last_commit_at,
       length(path) AS hops_from_root
ORDER BY dep.weekly_downloads DESC LIMIT 20
```

### Tool 3 — `find_critical_singles` (Cypher Template)
> Use when the user asks which widely-used packages globally have only one active maintainer. Param: min_downloads.
```cypher
MATCH (p:Package)-[:HOSTED_AT]->(r:Repository)
WHERE p.weekly_downloads > $min_downloads AND p.bus_factor = 1
MATCH (r)-[:MAINTAINED_BY]->(m:Contributor)
RETURN p.name, p.weekly_downloads, m.login, m.last_commit_date, r.open_issues
ORDER BY p.weekly_downloads DESC LIMIT 15
```

### Tool 4 — `ad_hoc` (Text2Cypher)
> Use for all other questions not covered by Tools 1–3. Fallback for ad-hoc queries.

---

## API Contract

```
# Auth
POST   /auth/register        { email, username, password }   → UserResponse
POST   /auth/login           { email, password }             → { access_token, refresh_token }
POST   /auth/refresh         { refresh_token }               → { access_token, refresh_token }
GET    /auth/me              Bearer token                    → UserResponse

# Scan
POST   /scan/upload          multipart file                  → { id, status }
GET    /scan/{id}                                            → ScanResponse
GET    /scan/{id}/packages                                   → PackageRisk[]
GET    /scan/{id}/graph                                      → { nodes, relationships }

# History
GET    /history                                              → ScanResponse[]
DELETE /history/{id}                                         → 204

# Chat
POST   /chat/{scan_id}       { content }                    → MessageResponse
GET    /chat/{scan_id}                                       → ChatHistoryResponse
```

---

## Tech Stack

### Backend
| Layer | Choice | Reason |
|---|---|---|
| Framework | **FastAPI** | Async, auto OpenAPI docs, Pydantic validation |
| Language | **Python 3.12** | Best ecosystem for parsing TOML, XML, YAML |
| Auth | **Custom JWT** | `python-jose` + `passlib[bcrypt]` — no third party |
| NoSQL | **MongoDB** (Motor) | Document model fits scan history + chat; flexible schema |
| Graph DB | **Neo4j AuraDB** | Knowledge graph for package → maintainer reasoning |
| AI Agent | **Neo4j Aura Agent** | Natural language → Cypher, no external LLM key |
| HTTP | **httpx** | Async HTTP for deps.dev + GitHub + registry APIs |
| Background tasks | **FastAPI BackgroundTasks** | Async scan processing, no Celery needed |

### Frontend
| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 16** (App Router) | File-based routing, easy Vercel deploy |
| Language | **TypeScript** | Shared type safety with FastAPI schemas |
| Styling | **Tailwind v4 + shadcn/ui** | Dark theme, ready-made components |
| Graph viz | **`@neo4j-nvl/react`** | Native Neo4j library, lazy-loaded client-side |
| Charts | **shadcn/ui Charts** (Recharts) | Consistent with shadcn, donut + bar chart |
| File upload | **`react-dropzone`** | Drag-and-drop with file type validation |
| HTTP | **axios** | JWT attach + silent refresh interceptors |

### Infrastructure
| Service | Choice | Tier |
|---|---|---|
| Frontend hosting | Vercel | Free |
| Backend hosting | Railway or Render | Free |
| MongoDB | Atlas | Free (M0, 512 MB) |
| Graph DB | Neo4j AuraDB | Free |

---

## Environment Variables

### `backend/.env`
```bash
APP_NAME=OSS Sentinel
APP_ENV=development
SECRET_KEY=                          # long random string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=oss_sentinel

NEO4J_URI=neo4j+s://<id>.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=

AURA_CLIENT_ID=
AURA_CLIENT_SECRET=
AURA_AGENT_ENDPOINT=https://api.neo4j.io/v1beta/agents/<id>/query

GITHUB_TOKEN=                        # personal access token, public_repo scope

ALLOWED_ORIGINS=http://localhost:3000
```

### `frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Supported Ecosystems

| Language | File(s) |
|---|---|
| JavaScript / TypeScript | `package.json`, `pnpm-lock.yaml`, `yarn.lock` |
| Python | `requirements.txt`, `pyproject.toml`, `uv.lock` |
| Go | `go.mod` |
| Rust | `Cargo.toml` |
| Java | `pom.xml` |
| Ruby | `Gemfile` |
| PHP | `composer.json` |

---

## Known Risks & Mitigations

| Risk | Mitigation |
|---|---|
| GitHub API rate limit (5K req/hr) | `asyncio.Semaphore(10)` on concurrent requests; `.cache/` for seed data |
| AuraDB free tier (200K node cap) | 300 packages × ~10 contributors ≈ 3K nodes — well within limit |
| deps.dev has no maintainer data | GitHub API covers maintainers; deps.dev gives dep tree + Scorecard |
| Text2Cypher Cypher hallucination | Cypher Templates cover 90% of core flows; Text2Cypher is fallback only |
| Non-GitHub repos | Skip GitLab/Bitbucket in seed; show "maintainer data unavailable" gracefully |
| pom.xml / Gemfile parsing edge cases | `xml.etree` for Maven; regex for Gemfile — both standard library |
| Scan takes too long (large dep trees) | Cap transitive depth at 4 hops in deps.dev queries |
