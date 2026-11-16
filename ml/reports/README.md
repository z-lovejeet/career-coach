# Career matcher — evaluation report

O*NET 31.0 · 910 occupations · 75 features · 22 career families · 91,000 simulated student profiles

## A. Family classification (stratified split)

| Model | Accuracy | Macro F1 | Top-3 |
|---|---|---|---|
| Logistic Regression | 0.709 | 0.674 | 0.928 |
| k-Nearest Neighbours | 0.906 | 0.898 | 0.985 |
| Random Forest | 0.783 | 0.751 | 0.960 |
| Linear SVM | 0.703 | 0.658 | 0.913 |
| MLP (128-64) | 0.835 | 0.813 | 0.973 |

## B. Family classification on unseen occupations

| Model | Accuracy | Macro F1 | Top-3 |
|---|---|---|---|
| Logistic Regression | 0.609 | 0.535 | 0.873 |
| k-Nearest Neighbours | 0.580 | 0.501 | 0.826 |
| Random Forest | 0.606 | 0.528 | 0.867 |
| Linear SVM | 0.601 | 0.523 | 0.852 |
| MLP (128-64) | 0.596 | 0.520 | 0.856 |

## C. Robustness (logistic regression)

| Noise σ | Accuracy | Top-3 |
|---|---|---|
| 0.02 | 0.820 | 0.976 |
| 0.08 | 0.785 | 0.966 |
| 0.15 | 0.706 | 0.933 |
| 0.25 | 0.560 | 0.846 |
| 0.35 | 0.423 | 0.727 |

## D. Occupation ranking

| Method | Top-1 | Top-5 | Top-10 |
|---|---|---|---|
| cosine only | 0.842 | 0.956 | 0.978 |
| hybrid α=0.85 | 0.785 | 0.917 | 0.957 |
| hybrid α=0.7 | 0.721 | 0.842 | 0.885 |
| hybrid α=0.55 | 0.684 | 0.780 | 0.822 |

Deployed: Logistic Regression + hybrid ranking α = 1.0

Figures: `model_comparison.png`, `confusion_matrix.png`, `robustness.png`, `ranking.png`
