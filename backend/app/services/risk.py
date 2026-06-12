from typing import Literal

RiskLabel = Literal["HIGH", "MEDIUM", "LOW"]


def compute_risk(
    bus_factor: int,
    inactivity_months: float,
    open_issues: int,
    scorecard_score: float,
) -> tuple[float, RiskLabel]:
    """
    Returns (risk_score 0–100, label).

    Weights:
      40% — bus factor   (sole maintainer = max risk)
      30% — inactivity   (≥18 months inactive = max)
      15% — open issues  (≥500 open = max)
      15% — OpenSSF      (score 0 = max risk, score 10 = no contribution)
    """
    w_bus      = (1.0 / max(bus_factor, 1)) * 40.0
    w_inactive = min(inactivity_months / 18.0, 1.0) * 30.0
    w_issues   = min(open_issues / 500.0, 1.0) * 15.0
    w_scorecard = ((10.0 - max(min(scorecard_score, 10.0), 0.0)) / 10.0) * 15.0

    score = round(w_bus + w_inactive + w_issues + w_scorecard, 1)

    if score > 65:
        label: RiskLabel = "HIGH"
    elif score > 35:
        label = "MEDIUM"
    else:
        label = "LOW"

    return score, label
