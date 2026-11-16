"""Build the occupation feature matrix and the career catalogue from O*NET 31.0.

Each occupation becomes a 75-dimensional vector in [0, 1]:
  • 10 essential skills      (importance, 1–5)
  • 25 transferable skills   (importance, 1–5)
  • 33 knowledge areas       (importance, 1–5)
  •  6 RIASEC interests      (occupational interest, 1–7)
  •  1 job zone              (preparation level, 1–5)

Labels:
  • occupation  — O*NET-SOC code (910 occupations with ratings)
  • family      — SOC major group (first two digits), e.g. 15 = Computer & Mathematical

Outputs (data/processed/):
  occupations.csv  – features + labels, one row per occupation
  feature_meta.json    – feature names, groups, element ids
  catalogue.json       – compact career catalogue used by the web app
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"

# Standard SOC 2018 major groups (the label space of the family classifier).
SOC_FAMILIES = {
    "11": "Management", "13": "Business & Financial", "15": "Computer & Mathematical",
    "17": "Architecture & Engineering", "19": "Life, Physical & Social Science",
    "21": "Community & Social Service", "23": "Legal", "25": "Education & Library",
    "27": "Arts, Design, Media & Sports", "29": "Healthcare Practitioners",
    "31": "Healthcare Support", "33": "Protective Service", "35": "Food Preparation & Serving",
    "37": "Building & Grounds Maintenance", "39": "Personal Care & Service", "41": "Sales",
    "43": "Office & Administrative Support", "45": "Farming, Fishing & Forestry",
    "47": "Construction & Extraction", "49": "Installation, Maintenance & Repair",
    "51": "Production", "53": "Transportation & Material Moving", "55": "Military",
}

RIASEC_ORDER = ["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"]


def _ratings(name: str, scale: str, group: str, prefix: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    df = pd.read_csv(RAW / f"{name}.csv")
    df = df[df["Scale ID"] == scale]
    wide = df.pivot_table(index="O*NET-SOC Code", columns="Element ID", values="Data Value")
    meta = (df[["Element ID", "Element Name"]].drop_duplicates()
            .assign(group=group).set_index("Element ID").loc[wide.columns])
    wide.columns = [f"{prefix}:{c}" for c in wide.columns]
    meta.index = wide.columns
    return wide, meta


def build() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    occ = pd.read_csv(RAW / "occupation_data.csv").set_index("O*NET-SOC Code")

    blocks, metas = [], []
    for name, group, prefix in [
        ("essential_skills", "Essential skill", "es"),
        ("transferable_skills", "Transferable skill", "ts"),
        ("knowledge", "Knowledge", "kn"),
    ]:
        imp, meta = _ratings(name, "IM", group, prefix)
        blocks.append((imp - 1) / 4)          # importance 1–5 → 0–1
        metas.append(meta)

    # Required level (0–7) for gap analysis in the web app (not a model feature).
    levels = []
    for name, prefix in [("essential_skills", "es"), ("transferable_skills", "ts"), ("knowledge", "kn")]:
        lv, _ = _ratings(name, "LV", "", prefix)
        levels.append(lv / 7)
    level_df = pd.concat(levels, axis=1)

    # RIASEC interests (occupational interest scale "OI", 1–7)
    interests = pd.read_csv(RAW / "career_interest_types.csv")
    interests = interests[interests["Scale ID"] == "OI"]
    riasec = interests.pivot_table(index="O*NET-SOC Code", columns="Element Name", values="Data Value")
    riasec = riasec[[c for c in RIASEC_ORDER if c in riasec.columns]]
    riasec_feat = (riasec - 1) / 6
    riasec_feat.columns = [f"ri:{c}" for c in riasec_feat.columns]
    metas.append(pd.DataFrame({"Element Name": riasec.columns, "group": "Interest"}, index=riasec_feat.columns))
    blocks.append(riasec_feat)

    zones = pd.read_csv(RAW / "job_zones.csv").set_index("O*NET-SOC Code")["Job Zone"]
    blocks.append(((zones - 1) / 4).rename("jz:zone").to_frame())
    metas.append(pd.DataFrame({"Element Name": ["Job zone (preparation level)"], "group": "Preparation"}, index=["jz:zone"]))

    X = pd.concat(blocks, axis=1, join="inner").dropna()
    meta = pd.concat(metas)
    meta = meta.loc[X.columns]

    data = X.copy()
    data["title"] = occ.loc[X.index, "Title"]
    data["family_code"] = [c[:2] for c in X.index]
    data["family"] = data["family_code"].map(SOC_FAMILIES)
    data.index.name = "code"
    data.to_csv(OUT / "occupations.csv")

    feature_meta = [
        {"id": col, "name": meta.loc[col, "Element Name"], "group": meta.loc[col, "group"]}
        for col in X.columns
    ]
    (OUT / "feature_meta.json").write_text(json.dumps(feature_meta, indent=2))

    _catalogue(X, data, level_df, occ, feature_meta)
    print(f"occupations: {len(X)} · features: {X.shape[1]} · families: {data['family'].nunique()}")


def _catalogue(X: pd.DataFrame, data: pd.DataFrame, levels: pd.DataFrame, occ: pd.DataFrame, feature_meta: list) -> None:
    """Compact per-occupation facts for the web app (gap analysis, mentor tools, roadmap)."""
    tasks = pd.read_csv(RAW / "task_statements.csv")
    if "Task Type" in tasks.columns:
        tasks = tasks[tasks["Task Type"].fillna("Core") == "Core"]
    tasks = tasks.groupby("O*NET-SOC Code")["Task"].apply(lambda s: list(s.head(4)))

    software = pd.read_csv(RAW / "software_skills.csv")
    hot_col = next((c for c in software.columns if "Hot" in c), None)
    name_col = "Example" if "Example" in software.columns else software.columns[2]
    if hot_col:
        software = software.sort_values(hot_col, ascending=False)
    tech = software.groupby("O*NET-SOC Code")[name_col].apply(lambda s: list(dict.fromkeys(s))[:10])

    related = pd.read_csv(RAW / "related_occupations.csv")
    rel_col = next(c for c in related.columns if c.startswith("Related") and "Code" in c)
    related = related.groupby("O*NET-SOC Code")[rel_col].apply(lambda s: list(s.head(6)))

    names = {m["id"]: m["name"] for m in feature_meta}
    catalogue = {}
    for code in X.index:
        row = X.loc[code]
        skill_cols = [c for c in X.columns if c[:2] in ("es", "ts", "kn")]
        top = sorted(skill_cols, key=lambda c: row[c], reverse=True)[:10]
        catalogue[code] = {
            "title": data.loc[code, "title"],
            "family": data.loc[code, "family"],
            "description": str(occ.loc[code, "Description"])[:420],
            "jobZone": int(round(row["jz:zone"] * 4 + 1)),
            "riasec": {c[3:]: round(float(row[c]), 3) for c in X.columns if c.startswith("ri:")},
            "requirements": [
                {"id": c, "name": names[c], "importance": round(float(row[c]), 3),
                 "level": round(float(levels.loc[code, c]), 3) if code in levels.index else None}
                for c in top
            ],
            "tasks": tasks.get(code, []),
            "technologies": tech.get(code, []),
            "related": [r for r in related.get(code, []) if r in X.index],
        }
    (OUT / "catalogue.json").write_text(json.dumps(catalogue, separators=(",", ":")))

    # Alternate job titles (e.g. "Machine Learning Engineer" → 15-1221.00) power career search.
    titles = pd.read_csv(RAW / "job_titles.csv")
    titles = titles[titles["O*NET-SOC Code"].isin(X.index)]
    index = titles.groupby("O*NET-SOC Code")["Job Title"].apply(lambda s: sorted(set(s))[:80]).to_dict()
    (OUT / "titles.json").write_text(json.dumps(index, separators=(",", ":")))


if __name__ == "__main__":
    build()
