"""Même barème que src/pricing/fiabilite.ts — à garder aligné."""

from __future__ import annotations

POIDS_MIN_ABERRANT = 0.15
ECART_POUR_PLANCHER = 0.6


def poids_signalement(prix_paye: int | float, prix_ref: int | float | None) -> float:
    if prix_ref is None:
        return 0.5
    try:
        ref = float(prix_ref)
    except (TypeError, ValueError):
        return 0.5
    if ref <= 0:
        return 0.5
    ecart = abs(float(prix_paye) - ref) / ref
    return max(POIDS_MIN_ABERRANT, min(1.0, 1.0 - ecart / ECART_POUR_PLANCHER))


def libelle_fiabilite(score: int, nb: int) -> str:
    if nb <= 0:
        return "Pas encore de signalement"
    if score < 40:
        return "À confirmer"
    if score < 70:
        return "En construction"
    return "Contributeur régulier"


def score_fiabilite(historique: list[tuple[int | float, int | float | None]]) -> dict:
    nb = len(historique)
    if nb == 0:
        return {"score": 0, "nb": 0, "libelle": libelle_fiabilite(0, 0), "moyennePoids": 0.0}
    poids = [poids_signalement(p, r) for p, r in historique]
    moyenne = sum(poids) / len(poids)
    facteur = min(1.0, 0.45 + 0.11 * nb)
    score = int(round(100 * moyenne * facteur))
    return {
        "score": score,
        "nb": nb,
        "libelle": libelle_fiabilite(score, nb),
        "moyennePoids": moyenne,
    }


def mediane_ponderee(valeurs: list[tuple[int, float]]) -> int | None:
    vals = [(int(p), float(w)) for p, w in valeurs if w > 0]
    if not vals:
        return None
    vals.sort(key=lambda x: x[0])
    total = sum(w for _, w in vals)
    if total <= 0:
        return None
    acc = 0.0
    for prix, w in vals:
        acc += w
        if acc >= total / 2:
            return prix
    return vals[-1][0]
