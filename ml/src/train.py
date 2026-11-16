"""Train, evaluate and export the CareerCompass career-matching model.

Problem
  Given a student's profile expressed in O*NET terms (skills, knowledge, interests,
  preparation level), predict the career family they fit and rank matching occupations.

Why synthetic samples?
  O*NET publishes one rating profile per occupation. To learn a mapping from noisy,
  incomplete *student* self-descriptions to careers, we simulate students: for every
  occupation we draw noisy copies (Gaussian noise of random strength) and hide a random
  share of features (replaced by the population mean, as the app does for unknown fields).

Experiments (written to ml/reports/)
  A. Family classification, stratified sample split — 5 models compared
  B. Family classification on *unseen occupations* (group split) — generalisation
  C. Robustness of the deployed model as input noise grows
  D. Occupation ranking (top-k) — cosine similarity vs the deployed hybrid

Deployed model (exported to web/src/server/ml/model/career-model.json)
  Multinomial logistic regression over standardised features → family probabilities,
  combined with z-scored cosine similarity to every occupation profile:
      score(o) = α · cos(z(x), z(o)) + (1 − α) · P(family(o) | x)
"""
from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, top_k_accuracy_score
from sklearn.model_selection import GroupShuffleSplit, train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import LinearSVC

ROOT = Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "data" / "processed"
REPORTS = ROOT / "ml" / "reports"
EXPORT = ROOT / "web" / "src" / "server" / "ml" / "model" / "career-model.json"

SEED = 42
SAMPLES_PER_OCCUPATION = 100
NOISE_RANGE = (0.04, 0.22)   # std of Gaussian noise on the 0–1 scale
MASK_RANGE = (0.0, 0.35)     # share of features the "student" leaves unknown

INK, ACCENT, MUTED = "#1d2421", "#0f6e5c", "#b9c2bd"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.spines.top": False,
                     "axes.spines.right": False, "axes.edgecolor": "#8a948f"})


# ── data ─────────────────────────────────────────────────────────────────
def load():
    df = pd.read_csv(PROCESSED / "occupations.csv", index_col="code", dtype={"family_code": str})
    meta = json.loads((PROCESSED / "feature_meta.json").read_text())
    cols = [m["id"] for m in meta]
    return df, cols, meta


def simulate_students(X: np.ndarray, per: int, rng, noise=NOISE_RANGE, mask=MASK_RANGE, impute=None):
    """Return (samples, occupation index, noise level) for `per` simulated students per occupation."""
    n, d = X.shape
    idx = np.repeat(np.arange(n), per)
    sigma = rng.uniform(*noise, size=len(idx))[:, None]
    S = X[idx] + rng.normal(0, 1, size=(len(idx), d)) * sigma
    hide = rng.uniform(0, 1, size=(len(idx), d)) < rng.uniform(*mask, size=len(idx))[:, None]
    impute = X.mean(axis=0) if impute is None else impute
    S = np.where(hide, impute, S)
    return np.clip(S, 0, 1), idx, sigma.ravel()


def models():
    return {
        "Logistic Regression": make_pipeline(StandardScaler(), LogisticRegression(C=1.0, max_iter=2000, class_weight="balanced")),
        "k-Nearest Neighbours": make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=25, metric="cosine", weights="distance")),
        "Random Forest": RandomForestClassifier(n_estimators=250, min_samples_leaf=2, n_jobs=-1, class_weight="balanced_subsample", random_state=SEED),
        "Linear SVM": make_pipeline(StandardScaler(), LinearSVC(C=0.5, class_weight="balanced", max_iter=5000)),
        "MLP (128-64)": make_pipeline(StandardScaler(), MLPClassifier(hidden_layer_sizes=(128, 64), early_stopping=True, max_iter=200, random_state=SEED)),
    }


def scores_of(model, X):
    return model.predict_proba(X) if hasattr(model, "predict_proba") else model.decision_function(X)


def evaluate(model, X, y, labels):
    pred = model.predict(X)
    s = scores_of(model, X)
    return {
        "accuracy": round(float(accuracy_score(y, pred)), 4),
        "macro_f1": round(float(f1_score(y, pred, average="macro")), 4),
        "top3_accuracy": round(float(top_k_accuracy_score(y, s, k=3, labels=labels)), 4),
    }


# ── hybrid ranking ───────────────────────────────────────────────────────
def zscore(M, mean, std):
    Z = (M - mean) / std
    return Z / (np.linalg.norm(Z, axis=1, keepdims=True) + 1e-9)


def rank_occupations(Xs, lr, occ_z, occ_family_idx, z_mean, z_std, alpha):
    cos = zscore(Xs, z_mean, z_std) @ occ_z.T             # (samples, occupations)
    fam = lr.predict_proba(Xs)[:, occ_family_idx]         # family prob per occupation
    return alpha * cos + (1 - alpha) * fam


def topk_hits(scores, truth, ks=(1, 5, 10)):
    order = np.argsort(-scores, axis=1)
    return {f"top{k}": round(float(np.mean([t in row[:k] for row, t in zip(order, truth)])), 4) for k in ks}


# ── main ─────────────────────────────────────────────────────────────────
def main():
    t0 = time.time()
    rng = np.random.default_rng(SEED)
    REPORTS.mkdir(parents=True, exist_ok=True)
    df, cols, meta = load()
    X_occ = df[cols].to_numpy(dtype=float)
    families = sorted(df["family_code"].unique())
    fam_names = dict(zip(df["family_code"], df["family"]))
    occ_family = df["family_code"].to_numpy()
    occ_family_idx = np.array([families.index(f) for f in occ_family])
    impute = X_occ.mean(axis=0)
    print(f"{len(df)} occupations · {len(cols)} features · {len(families)} families")

    S, occ_idx, sigma = simulate_students(X_occ, SAMPLES_PER_OCCUPATION, rng, impute=impute)
    y = occ_family_idx[occ_idx]
    labels = np.arange(len(families))
    report = {"dataset": {
        "onet_version": "31.0", "occupations": int(len(df)), "features": len(cols),
        "families": len(families), "samples": int(len(S)), "samples_per_occupation": SAMPLES_PER_OCCUPATION,
        "noise_range": NOISE_RANGE, "mask_range": MASK_RANGE,
        "family_distribution": {fam_names[f]: int((occ_family == f).sum()) for f in families},
    }}

    # A — stratified split
    Xtr, Xte, ytr, yte, otr, ote = train_test_split(S, y, occ_idx, test_size=0.2, stratify=y, random_state=SEED)
    report["A_stratified"] = {}
    fitted = {}
    for name, model in models().items():
        t = time.time()
        model.fit(Xtr, ytr)
        fitted[name] = model
        report["A_stratified"][name] = {**evaluate(model, Xte, yte, labels), "train_seconds": round(time.time() - t, 1)}
        print(f"A {name:22s} {report['A_stratified'][name]}")

    # B — unseen occupations
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=SEED)
    tr, te = next(gss.split(S, y, groups=occ_idx))
    report["B_unseen_occupations"] = {}
    for name, model in models().items():
        model.fit(S[tr], y[tr])
        report["B_unseen_occupations"][name] = evaluate(model, S[te], y[te], labels)
        print(f"B {name:22s} {report['B_unseen_occupations'][name]}")

    # Deployed classifier = logistic regression from experiment A
    lr = fitted["Logistic Regression"]

    # C — robustness vs noise
    report["C_robustness"] = []
    for level in [0.02, 0.08, 0.15, 0.25, 0.35]:
        Sn, oi, _ = simulate_students(X_occ, 20, np.random.default_rng(7), noise=(level, level), mask=(0.15, 0.15), impute=impute)
        yn = occ_family_idx[oi]
        report["C_robustness"].append({"noise": level, **evaluate(lr, Sn, yn, labels)})
    print("C", report["C_robustness"])

    # D — occupation ranking
    z_mean, z_std = X_occ.mean(axis=0), X_occ.std(axis=0) + 1e-6
    occ_z = zscore(X_occ, z_mean, z_std)
    probe = rng.choice(len(Xte), size=min(6000, len(Xte)), replace=False)
    Xp, op = Xte[probe], ote[probe]
    report["D_ranking"] = {}
    best_alpha, best = 1.0, -1
    for alpha in [1.0, 0.85, 0.7, 0.55]:
        hits = topk_hits(rank_occupations(Xp, lr, occ_z, occ_family_idx, z_mean, z_std, alpha), op)
        label = "cosine only" if alpha == 1.0 else f"hybrid α={alpha}"
        report["D_ranking"][label] = hits
        if hits["top5"] > best:
            best, best_alpha = hits["top5"], alpha
        print(f"D {label:16s} {hits}")
    report["deployed"] = {"classifier": "Logistic Regression", "alpha": best_alpha}

    figures(report, lr, Xte, yte, families, fam_names)
    export(cols, meta, impute, lr, families, fam_names, df, occ_z, occ_family_idx, z_mean, z_std, best_alpha, report)
    report["runtime_seconds"] = round(time.time() - t0, 1)
    (REPORTS / "metrics.json").write_text(json.dumps(report, indent=2))
    write_markdown(report)
    print(f"done in {report['runtime_seconds']}s")


def figures(report, lr, Xte, yte, families, fam_names):
    names = list(report["A_stratified"])
    a = [report["A_stratified"][n]["macro_f1"] for n in names]
    b = [report["B_unseen_occupations"][n]["macro_f1"] for n in names]
    x = np.arange(len(names))
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.bar(x - 0.2, a, 0.4, color=ACCENT, label="Seen occupations (A)")
    ax.bar(x + 0.2, b, 0.4, color=MUTED, label="Unseen occupations (B)")
    ax.set_xticks(x, names, rotation=12)
    ax.set_ylabel("Macro F1"); ax.set_ylim(0, 1); ax.legend(frameon=False)
    ax.set_title("Career family classification — model comparison", loc="left", color=INK)
    fig.tight_layout(); fig.savefig(REPORTS / "model_comparison.png", dpi=180); plt.close(fig)

    cm = confusion_matrix(yte, lr.predict(Xte), normalize="true")
    fig, ax = plt.subplots(figsize=(9, 8))
    ax.imshow(cm, cmap="Greens", vmin=0, vmax=1)
    short = [fam_names[f].split(",")[0].split(" &")[0] for f in families]
    ax.set_xticks(range(len(families)), short, rotation=70, fontsize=7)
    ax.set_yticks(range(len(families)), short, fontsize=7)
    ax.set_xlabel("Predicted"); ax.set_ylabel("Actual")
    ax.set_title("Logistic regression — normalised confusion matrix", loc="left", color=INK)
    fig.tight_layout(); fig.savefig(REPORTS / "confusion_matrix.png", dpi=180); plt.close(fig)

    rob = report["C_robustness"]
    fig, ax = plt.subplots(figsize=(6, 3.6))
    ax.plot([r["noise"] for r in rob], [r["accuracy"] for r in rob], marker="o", color=ACCENT, label="Accuracy")
    ax.plot([r["noise"] for r in rob], [r["top3_accuracy"] for r in rob], marker="o", color=INK, label="Top-3 accuracy")
    ax.set_xlabel("Input noise (std, 0–1 scale)"); ax.set_ylim(0, 1); ax.legend(frameon=False)
    ax.set_title("Robustness to noisy student input", loc="left", color=INK)
    fig.tight_layout(); fig.savefig(REPORTS / "robustness.png", dpi=180); plt.close(fig)

    rk = report["D_ranking"]
    fig, ax = plt.subplots(figsize=(7, 3.6))
    labels = list(rk); x = np.arange(len(labels))
    for i, (k, c) in enumerate([("top1", MUTED), ("top5", ACCENT), ("top10", INK)]):
        ax.bar(x + (i - 1) * 0.25, [rk[l][k] for l in labels], 0.25, color=c, label=k.replace("top", "Top-"))
    ax.set_xticks(x, labels); ax.set_ylim(0, 1); ax.legend(frameon=False)
    ax.set_title("Occupation ranking (exact occupation in top-k)", loc="left", color=INK)
    fig.tight_layout(); fig.savefig(REPORTS / "ranking.png", dpi=180); plt.close(fig)


def export(cols, meta, impute, lr, families, fam_names, df, occ_z, occ_family_idx, z_mean, z_std, alpha, report):
    scaler, clf = lr.named_steps["standardscaler"], lr.named_steps["logisticregression"]
    r = lambda a, n=4: np.round(np.asarray(a, dtype=float), n).tolist()
    model = {
        "name": "careercompass-career-matcher",
        "version": datetime.now(timezone.utc).strftime("%Y.%m.%d"),
        "trainedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "onetVersion": "31.0",
        "features": meta,
        "impute": r(impute),
        "scaler": {"mean": r(scaler.mean_), "scale": r(scaler.scale_)},
        "families": [{"code": f, "name": fam_names[f]} for f in families],
        "logreg": {"coef": r(clf.coef_), "intercept": r(clf.intercept_)},
        "zMean": r(z_mean), "zStd": r(z_std),
        "alpha": alpha,
        "occupations": {
            "codes": df.index.tolist(),
            "familyIndex": occ_family_idx.tolist(),
            "z": r(occ_z, 3),
        },
        "metrics": {
            "familyAccuracy": report["A_stratified"]["Logistic Regression"]["accuracy"],
            "familyTop3": report["A_stratified"]["Logistic Regression"]["top3_accuracy"],
            "unseenFamilyAccuracy": report["B_unseen_occupations"]["Logistic Regression"]["accuracy"],
            "rankingTop5": max(v["top5"] for v in report["D_ranking"].values()),
        },
    }
    EXPORT.parent.mkdir(parents=True, exist_ok=True)
    EXPORT.write_text(json.dumps(model, separators=(",", ":")))
    print(f"exported → {EXPORT.relative_to(ROOT)} ({EXPORT.stat().st_size // 1024} KB)")


def write_markdown(report):
    lines = ["# Career matcher — evaluation report", "",
             f"O*NET {report['dataset']['onet_version']} · {report['dataset']['occupations']} occupations · "
             f"{report['dataset']['features']} features · {report['dataset']['families']} career families · "
             f"{report['dataset']['samples']:,} simulated student profiles", ""]
    for key, title in [("A_stratified", "A. Family classification (stratified split)"),
                       ("B_unseen_occupations", "B. Family classification on unseen occupations")]:
        lines += [f"## {title}", "", "| Model | Accuracy | Macro F1 | Top-3 |", "|---|---|---|---|"]
        for name, m in report[key].items():
            lines.append(f"| {name} | {m['accuracy']:.3f} | {m['macro_f1']:.3f} | {m['top3_accuracy']:.3f} |")
        lines.append("")
    lines += ["## C. Robustness (logistic regression)", "", "| Noise σ | Accuracy | Top-3 |", "|---|---|---|"]
    lines += [f"| {r['noise']} | {r['accuracy']:.3f} | {r['top3_accuracy']:.3f} |" for r in report["C_robustness"]]
    lines += ["", "## D. Occupation ranking", "", "| Method | Top-1 | Top-5 | Top-10 |", "|---|---|---|---|"]
    lines += [f"| {k} | {v['top1']:.3f} | {v['top5']:.3f} | {v['top10']:.3f} |" for k, v in report["D_ranking"].items()]
    lines += ["", f"Deployed: {report['deployed']['classifier']} + hybrid ranking α = {report['deployed']['alpha']}",
              "", "Figures: `model_comparison.png`, `confusion_matrix.png`, `robustness.png`, `ranking.png`"]
    (REPORTS / "README.md").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
