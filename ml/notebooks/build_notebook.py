"""Builds and executes ml/notebooks/career_matcher.ipynb (report companion).

Usage: ml/.venv/bin/python ml/notebooks/build_notebook.py
"""
from pathlib import Path

import nbformat as nbf
from nbconvert.preprocessors import ExecutePreprocessor

HERE = Path(__file__).resolve().parent
nb = nbf.v4.new_notebook()
md, code = nbf.v4.new_markdown_cell, nbf.v4.new_code_cell

nb.cells = [
    md("""# CareerCompass — Career Matcher (Supervised Learning on O*NET 31.0)

**Goal.** Given a student's profile expressed in O*NET terms (skills, knowledge, interests, preparation level), predict the
*career family* they fit and rank matching *occupations*. The ranked careers feed the CareerCompass roadmap agent
(courses → skills → career).

**Pipeline.** `download.py` → `features.py` (75-feature occupation matrix) → `train.py` (simulate students, train 5 models,
evaluate, export) → `career-model.json` used for inference in the web app."""),
    code("""import json, sys
from pathlib import Path
import numpy as np, pandas as pd
ROOT = Path.cwd().parents[1] if Path.cwd().name == "notebooks" else Path.cwd()
sys.path.insert(0, str(ROOT / "ml" / "src"))
occ = pd.read_csv(ROOT / "data/processed/occupations.csv", index_col="code", dtype={"family_code": str})
meta = json.loads((ROOT / "data/processed/feature_meta.json").read_text())
features = [m["id"] for m in meta]
print(f"{len(occ)} occupations × {len(features)} features, {occ['family'].nunique()} career families")
pd.Series([m["group"] for m in meta]).value_counts()"""),
    md("## 1. The data\nEach occupation is a vector in [0, 1]: importance of 10 essential skills, 25 transferable skills, 33 knowledge areas (1–5 scale), 6 RIASEC interest scores (1–7) and the job zone (1–5)."),
    code("""occ[["title", "family"] + features[:4] + ["ri:Investigative", "jz:zone"]].head(8).round(2)"""),
    code("""ax = occ["family"].value_counts().plot.barh(figsize=(7, 6), color="#0f6e5c")
ax.invert_yaxis(); ax.set_xlabel("occupations"); ax.set_title("Occupations per career family (labels)", loc="left");"""),
    md("""## 2. Simulating students
O*NET gives one profile per occupation, which is not enough to learn a mapping from *noisy, incomplete student self-descriptions*.
For each occupation we draw noisy copies: Gaussian noise with a random strength σ ∈ [0.04, 0.22] and a random 0–35 % of features
hidden (replaced by the population mean, exactly as the app does for unknown fields)."""),
    code("""from train import simulate_students
X = occ[features].to_numpy(float)
S, idx, sigma = simulate_students(X, 3, np.random.default_rng(0))
example = pd.DataFrame([X[idx[0]], S[0], S[1], S[2]], columns=features, index=["O*NET profile", "student 1", "student 2", "student 3"])
print("Occupation:", occ.index[idx[0]], occ.iloc[idx[0]]["title"])
example[features[:6]].round(2)"""),
    md("## 3. Results\nFull training (`python ml/src/train.py`, ~2 minutes) writes `ml/reports/metrics.json` and figures. Loaded here:"),
    code("""m = json.loads((ROOT / "ml/reports/metrics.json").read_text())
rows = [{"model": k, "seen acc": v["accuracy"], "seen macro-F1": v["macro_f1"], "seen top-3": v["top3_accuracy"],
         "unseen acc": m["B_unseen_occupations"][k]["accuracy"], "unseen top-3": m["B_unseen_occupations"][k]["top3_accuracy"]}
        for k, v in m["A_stratified"].items()]
pd.DataFrame(rows).set_index("model").round(3)"""),
    md("""**Reading the table.** *Seen* = test samples come from occupations also present in training (stratified split).
*Unseen* = whole occupations are held out (group split) — the honest test of generalisation. k-NN is best on seen occupations because
it memorises near-duplicate neighbours, but it drops the most on unseen ones. **Logistic regression generalises best**, is
interpretable and tiny to export, so it is the deployed family classifier."""),
    code("""from IPython.display import Image, display
for f in ["model_comparison.png", "confusion_matrix.png", "robustness.png", "ranking.png"]:
    display(Image(filename=str(ROOT / "ml/reports" / f), width=640))"""),
    code("""pd.DataFrame(m["C_robustness"]).set_index("noise").round(3)"""),
    code("""pd.DataFrame(m["D_ranking"]).T.round(3)"""),
    md(f"""**Ranking.** Exact-occupation retrieval works best with z-scored cosine similarity alone (top-5 ≈ 0.96); mixing in family
probabilities lowered top-k, so α = 1.0 was selected automatically. Temperature scaling found T = 1.0 optimal on held-out data
(the classifier is already calibrated in-distribution)."""),
    md("## 4. The deployed model in action\nThe exported JSON is what the web app runs (in TypeScript). Re-implementing inference here for a hand-built profile:"),
    code("""model = json.loads((ROOT / "web/src/server/ml/model/career-model.json").read_text())
cat = json.loads((ROOT / "data/processed/catalogue.json").read_text())
skill_idx = [i for i, f in enumerate(features) if f[:2] in ("es", "ts", "kn")]
def align(x):
    # Distribution alignment (same as the web app): keep the student's relative skill profile,
    # re-expressed on each feature's occupation-importance scale.
    v = x[skill_idx]; out = x.copy()
    out[skill_idx] = np.clip(np.array(model["zMean"])[skill_idx] + (v - v.mean()) / (v.std() or 1) * np.array(model["zStd"])[skill_idx], 0, 1)
    return out
def infer(sparse, aligned=True):
    x = np.array([sparse.get(f, model["impute"][i]) for i, f in enumerate(features)])
    if aligned: x = align(x)
    xs = (x - np.array(model["scaler"]["mean"])) / np.array(model["scaler"]["scale"])
    logits = np.array(model["logreg"]["coef"]) @ xs + np.array(model["logreg"]["intercept"])
    p = np.exp(logits - logits.max()); p /= p.sum()
    z = (x - np.array(model["zMean"])) / np.array(model["zStd"]); z /= np.linalg.norm(z)
    cos = np.array(model["occupations"]["z"]) @ z
    top = np.argsort(-cos)[:8]
    fams = sorted(zip([f["name"] for f in model["families"]], p), key=lambda t: -t[1])[:3]
    return fams, [(cat[model["occupations"]["codes"][i]]["title"], round(float((cos[i] + 1) * 50))) for i in top]

name = {m["id"]: m["name"] for m in meta}
pick = lambda *names: {i for i, n in name.items() if n in names}
student = {f: 0.15 for f in features if f[:2] in ("es", "ts", "kn")}
student.update({f: 0.85 for f in pick("Programming", "Mathematics", "Computers and Electronics", "Critical Thinking", "Complex Problem Solving", "Systems Analysis")})
student.update({"ri:Investigative": 0.9, "ri:Conventional": 0.6, "ri:Realistic": 0.4, "ri:Social": 0.2, "ri:Artistic": 0.2, "ri:Enterprising": 0.2, "jz:zone": 0.75})
raw_fams, raw = infer(student, aligned=False)
fams, careers = infer(student)
print("Career families (aligned):", [(f, round(float(p), 2)) for f, p in fams])
pd.DataFrame({"without alignment": [c for c, _ in raw], "with alignment": [f"{c} ({m}%)" for c, m in careers]})"""),
    md("""**Finding — distribution shift.** Students rate *proficiency* and are low on most descriptors, while occupation vectors hold
*importance* ratings. A raw low-everywhere profile therefore looks like a low-skill occupation (left column). Re-expressing the
student's relative profile on the occupation scale (z-score across their own ratings, then map with each feature's mean/std) fixes
the shift (right column). The web app applies this alignment before every prediction."""),
    md("""## 5. Where this sits in the agent
1. **Profile Analyst** (Groq LLM) rates the student 0–5 on the 68 skill/knowledge descriptors from their CV / profile.
2. RIASEC scores come from a 12-item interest quiz; job zone from education.
3. A distribution-alignment step maps self-rated proficiency onto O*NET's importance scale.
4. **This model** returns career families and ranked occupations.
5. The **Gap Analyzer** compares the student with the target occupation's O*NET *level* requirements; the **Curriculum Planner** and
   **Roadmap Composer** (LLMs) turn the gaps into courses, skills and projects; the **Critic** checks coverage and feasibility."""),
]

nb.metadata["kernelspec"] = {"name": "python3", "display_name": "Python 3", "language": "python"}
ExecutePreprocessor(timeout=300, kernel_name="python3").preprocess(nb, {"metadata": {"path": str(HERE)}})
out = HERE / "career_matcher.ipynb"
nbf.write(nb, out)
print("wrote", out)
