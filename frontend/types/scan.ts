export type RiskLabel = "HIGH" | "MEDIUM" | "LOW"
export type ScanStatus = "pending" | "processing" | "completed" | "failed"
export type Ecosystem = "npm" | "python" | "go" | "rust" | "java" | "ruby" | "php"

export interface ScanSummary {
  total_packages: number
  high_risk: number
  medium_risk: number
  low_risk: number
  avg_bus_factor: number
  avg_scorecard: number
}

export interface Scan {
  id: string
  filename: string
  ecosystem: Ecosystem
  status: ScanStatus
  created_at: string
  completed_at: string | null
  summary: ScanSummary
  package_names: string[]
}

export interface PackageMaintainer {
  login: string
  commits_90d: number
  last_commit: string | null
}

export interface PackageRisk {
  name: string
  ecosystem: string
  weekly_downloads: number
  bus_factor: number
  risk_score: number
  risk_label: RiskLabel
  last_release_months_ago: number | null
  last_commit_at: string | null
  open_issues: number | null
  scorecard_score: number | null
  maintainers: PackageMaintainer[]
  hops_from_root: number | null
}

export interface GraphNode {
  id: string
  labels: string[]
  properties: Record<string, unknown>
}

export interface GraphRelationship {
  id: string
  type: string
  startNodeId: string
  endNodeId: string
  properties: Record<string, unknown>
}

export interface GraphData {
  nodes: GraphNode[]
  relationships: GraphRelationship[]
}
