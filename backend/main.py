"""API de Zém Tarif : signalements, statistiques, santé.

L'application mobile fonctionne aussi hors ligne : les avis restent
alors sur l'appareil et sont renvoyés plus tard. PostgreSQL est utilisé
dès que DATABASE_URL est définie, sinon une base SQLite locale.
"""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Any, Iterator
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

from fastapi import FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from fiabilite import mediane_ponderee, poids_signalement, score_fiabilite

MAX_PRIX = 20_000
MIN_PRIX = 50
MAX_PAR_HEURE = 8
MAX_PAR_JOUR = 20
PSEUDO_MAX = 32

DATABASE_URL = (os.environ.get("DATABASE_URL") or "").strip()
EST_POSTGRES = DATABASE_URL.startswith("postgres")

ORIGINES = [
    o.strip()
    for o in os.environ.get(
        "CORS_ORIGINS",
        "https://zem-tarif.onrender.com,http://localhost:8081,http://localhost:19006,http://127.0.0.1:8081,http://localhost:4173,http://127.0.0.1:4173",
    ).split(",")
    if o.strip()
]

app = FastAPI(
    title="Zém Tarif",
    description="API des signalements de prix de zémidjan.",
    version="1.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINES + ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def url_postgres() -> str:
    """Préfère l'hôte interne sur Render ; sslmode=require seulement en public."""
    url = DATABASE_URL
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    parsed = urlparse(url)
    host = parsed.hostname or ""
    if (
        os.environ.get("RENDER")
        and host.endswith(".render.com")
        and "-internal" not in host
    ):
        intern = host.split(".")[0]
        user = parsed.username or ""
        mot = parsed.password or ""
        auth = f"{user}:{mot}@" if mot else (f"{user}@" if user else "")
        port = f":{parsed.port}" if parsed.port else ""
        parsed = parsed._replace(netloc=f"{auth}{intern}{port}")
        host = intern
        url = urlunparse(parsed)
    params = parse_qs(parsed.query)
    if "render.com" in host and "-internal" not in host and "sslmode" not in params:
        params["sslmode"] = ["require"]
        url = urlunparse(parsed._replace(query=urlencode(params, doseq=True)))
    return url


@contextmanager
def connexion() -> Iterator[Any]:
    if EST_POSTGRES:
        import psycopg
        from psycopg.rows import dict_row

        cx = psycopg.connect(url_postgres(), row_factory=dict_row)
        try:
            yield cx
            cx.commit()
        except Exception:
            cx.rollback()
            raise
        finally:
            cx.close()
    else:
        from pathlib import Path

        racine = Path(__file__).resolve().parent
        chemin = Path(os.environ.get("ZEM_TARIF_DB", racine / "signalements.db"))
        chemin.parent.mkdir(parents=True, exist_ok=True)
        cx = sqlite3.connect(chemin)
        cx.row_factory = sqlite3.Row
        try:
            yield cx
            cx.commit()
        except Exception:
            cx.rollback()
            raise
        finally:
            cx.close()


def exec_sql(cx: Any, sql: str, params: tuple[Any, ...] = ()) -> Any:
    if EST_POSTGRES:
        sql = sql.replace("?", "%s")
    return cx.execute(sql, params)


DDL_SQLITE = """
CREATE TABLE IF NOT EXISTS signalements (
  id TEXT PRIMARY KEY,
  origin_lat REAL NOT NULL,
  origin_lon REAL NOT NULL,
  dest_lat REAL NOT NULL,
  dest_lon REAL NOT NULL,
  origin_label TEXT NOT NULL,
  dest_label TEXT NOT NULL,
  distance_m REAL NOT NULL,
  prix_paye_fcfa INTEGER NOT NULL,
  nuit INTEGER NOT NULL,
  pluie INTEGER NOT NULL,
  heure INTEGER,
  pseudo TEXT,
  appareil_id TEXT,
  enregistre_le TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('utilisateur', 'exemple'))
);
CREATE INDEX IF NOT EXISTS idx_signalements_geo
  ON signalements (origin_lat, origin_lon, dest_lat, dest_lon);
CREATE INDEX IF NOT EXISTS idx_signalements_appareil
  ON signalements (appareil_id, enregistre_le);
"""

DDL_POSTGRES = """
CREATE TABLE IF NOT EXISTS signalements (
  id TEXT PRIMARY KEY,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lon DOUBLE PRECISION NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lon DOUBLE PRECISION NOT NULL,
  origin_label TEXT NOT NULL,
  dest_label TEXT NOT NULL,
  distance_m DOUBLE PRECISION NOT NULL CHECK (distance_m >= 0),
  prix_paye_fcfa INTEGER NOT NULL CHECK (prix_paye_fcfa >= 50 AND prix_paye_fcfa <= 20000),
  nuit BOOLEAN NOT NULL DEFAULT FALSE,
  pluie BOOLEAN NOT NULL DEFAULT FALSE,
  heure SMALLINT,
  pseudo TEXT,
  appareil_id TEXT,
  enregistre_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'utilisateur' CHECK (source IN ('utilisateur', 'exemple'))
);
CREATE INDEX IF NOT EXISTS idx_signalements_geo
  ON signalements (origin_lat, origin_lon, dest_lat, dest_lon);
CREATE INDEX IF NOT EXISTS idx_signalements_source_date
  ON signalements (source, enregistre_le DESC);
CREATE INDEX IF NOT EXISTS idx_signalements_trajet
  ON signalements (origin_label, dest_label);
CREATE INDEX IF NOT EXISTS idx_signalements_appareil
  ON signalements (appareil_id, enregistre_le DESC);
"""


def assurer_colonnes_sqlite(cx: sqlite3.Connection) -> None:
    existantes = {r[1] for r in cx.execute("PRAGMA table_info(signalements)").fetchall()}
    for nom, typ in (
        ("heure", "INTEGER"),
        ("pseudo", "TEXT"),
        ("appareil_id", "TEXT"),
        ("role", "TEXT"),
        ("bagage", "INTEGER"),
        ("poids", "REAL"),
        ("prix_ref", "INTEGER"),
    ):
        if nom not in existantes:
            cx.execute(f"ALTER TABLE signalements ADD COLUMN {nom} {typ}")


DDL_APPAREILS_SQLITE = """
CREATE TABLE IF NOT EXISTS appareils (
  appareil_id TEXT PRIMARY KEY,
  score INTEGER NOT NULL DEFAULT 0,
  nb INTEGER NOT NULL DEFAULT 0,
  maj TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS suggestions_reperes (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  detail TEXT,
  appareil_id TEXT,
  pseudo TEXT,
  enregistre_le TEXT NOT NULL
);
"""

DDL_APPAREILS_POSTGRES = """
CREATE TABLE IF NOT EXISTS appareils (
  appareil_id TEXT PRIMARY KEY,
  score INTEGER NOT NULL DEFAULT 0,
  nb INTEGER NOT NULL DEFAULT 0,
  maj TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS suggestions_reperes (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  detail TEXT,
  appareil_id TEXT,
  pseudo TEXT,
  enregistre_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

ALTER_POSTGRES = """
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'passager';
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS bagage BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS poids DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE signalements ADD COLUMN IF NOT EXISTS prix_ref INTEGER;
"""


def init_db() -> None:
    with connexion() as cx:
        if EST_POSTGRES:
            cx.execute(DDL_POSTGRES)
            for stmt in ALTER_POSTGRES.strip().split(";"):
                s = stmt.strip()
                if s:
                    cx.execute(s)
            cx.execute(DDL_APPAREILS_POSTGRES)
        else:
            cx.executescript(DDL_SQLITE)
            assurer_colonnes_sqlite(cx)
            cx.executescript(DDL_APPAREILS_SQLITE)


class SignalementIn(BaseModel):
    id: str
    originLat: float
    originLon: float
    destLat: float
    destLon: float
    originLabel: str = Field(min_length=1, max_length=120)
    destLabel: str = Field(min_length=1, max_length=120)
    distanceM: float = Field(ge=0, le=80_000)
    prixPayeFcfa: int = Field(ge=MIN_PRIX, le=MAX_PRIX)
    nuit: bool
    pluie: bool
    heure: int | None = Field(default=None, ge=0, le=23)
    pseudo: str | None = Field(default=None, max_length=PSEUDO_MAX)
    appareilId: str | None = Field(default=None, max_length=80)
    enregistreLe: str
    source: str = "utilisateur"
    role: str = "passager"
    bagage: bool = False
    prixRefFcfa: int | None = Field(default=None, ge=MIN_PRIX, le=MAX_PRIX)

    @field_validator("pseudo")
    @classmethod
    def nettoyer_pseudo(cls, valeur: str | None) -> str | None:
        if valeur is None:
            return None
        texte = " ".join(valeur.split()).strip()
        return texte or None

    @field_validator("originLabel", "destLabel")
    @classmethod
    def nettoyer_label(cls, valeur: str) -> str:
        return " ".join(valeur.split()).strip()

    @field_validator("role")
    @classmethod
    def nettoyer_role(cls, valeur: str) -> str:
        return "conducteur" if valeur == "conducteur" else "passager"


def ligne_vers_json(row: Any) -> dict[str, Any]:
    d = dict(row)
    return {
        "id": d["id"],
        "originLat": d["origin_lat"],
        "originLon": d["origin_lon"],
        "destLat": d["dest_lat"],
        "destLon": d["dest_lon"],
        "originLabel": d["origin_label"],
        "destLabel": d["dest_label"],
        "distanceM": d["distance_m"],
        "prixPayeFcfa": d["prix_paye_fcfa"],
        "nuit": bool(d["nuit"]),
        "pluie": bool(d["pluie"]),
        "heure": d.get("heure") if not isinstance(d, sqlite3.Row) else d["heure"] if "heure" in d.keys() else None,
        "pseudo": d.get("pseudo") if not isinstance(d, sqlite3.Row) else d["pseudo"] if "pseudo" in d.keys() else None,
        "enregistreLe": str(d["enregistre_le"]),
        "source": d["source"],
        "role": d.get("role") or "passager",
        "bagage": bool(d.get("bagage") or False),
        "poids": float(d.get("poids") or 1) if d.get("poids") is not None else 1.0,
        "prixRefFcfa": d.get("prix_ref"),
    }


def val(row: Any, cle: str) -> Any:
    if isinstance(row, sqlite3.Row):
        return row[cle] if cle in row.keys() else None
    return row.get(cle)


@app.on_event("startup")
def au_demarrage() -> None:
    init_db()


def reponse_sante() -> dict[str, str]:
    moteur = "postgres" if EST_POSTGRES else "sqlite"
    try:
        with connexion() as cx:
            exec_sql(cx, "SELECT 1")
        return {"statut": "ok", "base": moteur}
    except Exception:
        return {"statut": "degrade", "base": moteur}


@app.get("/")
@app.get("/sante")
@app.get("/api/sante")
def sante() -> dict[str, str]:
    return reponse_sante()


def lister(source: str) -> list[dict[str, Any]]:
    if source not in {"utilisateur", "exemple", "tous"}:
        raise HTTPException(400, "source inconnue")
    with connexion() as cx:
        if source == "tous":
            rows = exec_sql(
                cx, "SELECT * FROM signalements ORDER BY enregistre_le DESC LIMIT 500"
            ).fetchall()
        else:
            rows = exec_sql(
                cx,
                "SELECT * FROM signalements WHERE source = ? ORDER BY enregistre_le DESC LIMIT 500",
                (source,),
            ).fetchall()
    return [ligne_vers_json(r) for r in rows]


@app.get("/signalements")
@app.get("/api/signalements")
def lister_signalements(
    source: str = Query(default="utilisateur"),
) -> list[dict[str, Any]]:
    return lister(source)


def compter_depuis(cx: Any, appareil: str, depuis: str) -> int:
    row = exec_sql(
        cx,
        "SELECT COUNT(*) AS n FROM signalements WHERE appareil_id = ? AND enregistre_le >= ?",
        (appareil, depuis),
    ).fetchone()
    if row is None:
        return 0
    return int(val(row, "n") if not isinstance(row, tuple) else row[0])


def creer(avis: SignalementIn, appareil_entete: str | None) -> dict[str, Any]:
    if avis.source not in {"utilisateur", "exemple"}:
        raise HTTPException(400, "source inconnue")
    appareil = (avis.appareilId or appareil_entete or "").strip() or None
    maintenant = datetime.now(timezone.utc)
    with connexion() as cx:
        existant = exec_sql(
            cx, "SELECT id FROM signalements WHERE id = ?", (avis.id,)
        ).fetchone()
        if existant:
            raise HTTPException(409, "ce signalement existe déjà")
        if appareil and avis.source == "utilisateur":
            aujourd_hui = (maintenant - timedelta(days=1)).isoformat()
            une_heure = (maintenant - timedelta(hours=1)).isoformat()
            if EST_POSTGRES:
                n_jour = exec_sql(
                    cx,
                    "SELECT COUNT(*) AS n FROM signalements WHERE appareil_id = ? AND enregistre_le >= NOW() - INTERVAL '1 day'",
                    (appareil,),
                ).fetchone()
                n_heure = exec_sql(
                    cx,
                    "SELECT COUNT(*) AS n FROM signalements WHERE appareil_id = ? AND enregistre_le >= NOW() - INTERVAL '1 hour'",
                    (appareil,),
                ).fetchone()
                jour = int(n_jour["n"]) if n_jour else 0
                heure = int(n_heure["n"]) if n_heure else 0
            else:
                jour = compter_depuis(cx, appareil, aujourd_hui)
                heure = compter_depuis(cx, appareil, une_heure)
            if heure >= MAX_PAR_HEURE or jour >= MAX_PAR_JOUR:
                raise HTTPException(
                    429,
                    "Trop de signalements ont été envoyés depuis cet appareil. Réessayez plus tard.",
                )
        poids = poids_signalement(avis.prixPayeFcfa, avis.prixRefFcfa)
        exec_sql(
            cx,
            """
            INSERT INTO signalements (
              id, origin_lat, origin_lon, dest_lat, dest_lon,
              origin_label, dest_label, distance_m, prix_paye_fcfa,
              nuit, pluie, heure, pseudo, appareil_id, enregistre_le, source,
              role, bagage, poids, prix_ref
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                avis.id,
                avis.originLat,
                avis.originLon,
                avis.destLat,
                avis.destLon,
                avis.originLabel,
                avis.destLabel,
                avis.distanceM,
                avis.prixPayeFcfa,
                avis.nuit if EST_POSTGRES else int(avis.nuit),
                avis.pluie if EST_POSTGRES else int(avis.pluie),
                avis.heure,
                avis.pseudo,
                appareil,
                avis.enregistreLe,
                avis.source,
                avis.role,
                avis.bagage if EST_POSTGRES else int(avis.bagage),
                poids,
                avis.prixRefFcfa,
            ),
        )
        if appareil and avis.source == "utilisateur":
            maj_score_appareil(cx, appareil)
    sortie = avis.model_dump()
    sortie["appareilId"] = None
    sortie["poids"] = poids_signalement(avis.prixPayeFcfa, avis.prixRefFcfa)
    return sortie


@app.post("/signalements", status_code=201)
@app.post("/api/signalements", status_code=201)
def creer_signalement(
    avis: SignalementIn,
    request: Request,
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
) -> dict[str, Any]:
    return creer(avis, x_device_id)


def statistiques(zone: str | None) -> list[dict[str, Any]]:
    with connexion() as cx:
        rows = exec_sql(
            cx,
            """
            SELECT origin_label, dest_label,
                   COUNT(*) AS n,
                   AVG(distance_m) AS distance_m,
                   MIN(prix_paye_fcfa) AS min_prix,
                   MAX(prix_paye_fcfa) AS max_prix
            FROM signalements
            WHERE source = 'utilisateur'
            GROUP BY origin_label, dest_label
            HAVING COUNT(*) >= 1
            ORDER BY n DESC, origin_label
            LIMIT 40
            """,
        ).fetchall()
        details: list[dict[str, Any]] = []
        for r in rows:
            origin = val(r, "origin_label")
            dest = val(r, "dest_label")
            if zone:
                z = zone.casefold()
                if z not in origin.casefold() and z not in dest.casefold():
                    continue
            prix_rows = exec_sql(
                cx,
                """
                SELECT prix_paye_fcfa, poids FROM signalements
                WHERE source = 'utilisateur' AND origin_label = ? AND dest_label = ?
                ORDER BY prix_paye_fcfa
                """,
                (origin, dest),
            ).fetchall()
            paires = [
                (int(val(p, "prix_paye_fcfa")), float(val(p, "poids") or 1))
                for p in prix_rows
            ]
            n = len(paires)
            if n == 0:
                continue
            mediane_brute = mediane_ponderee(paires)
            if mediane_brute is None:
                continue
            mediane = int(round(mediane_brute / 50) * 50)
            details.append(
                {
                    "originLabel": origin,
                    "destLabel": dest,
                    "nbAvis": n,
                    "medianeFcfa": mediane,
                    "minFcfa": int(val(r, "min_prix")),
                    "maxFcfa": int(val(r, "max_prix")),
                    "distanceM": float(val(r, "distance_m") or 0),
                }
            )
    return details


@app.get("/stats")
@app.get("/api/stats")
def stats(
    zone: str | None = Query(default=None),
    origin: str | None = Query(default=None),
    dest: str | None = Query(default=None),
) -> dict[str, Any]:
    trajets = statistiques(zone)
    if origin and dest:
        o = origin.casefold()
        d = dest.casefold()
        trajets = [
            t
            for t in trajets
            if t["originLabel"].casefold() == o and t["destLabel"].casefold() == d
        ]
    return {"trajets": trajets, "nbTrajets": len(trajets)}


@app.delete("/signalements/{identifiant}")
@app.delete("/api/signalements/{identifiant}")
def supprimer_signalement(
    identifiant: str,
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
) -> dict[str, str]:
    """Retire un avis envoyé depuis le même appareil (nettoyage, corrections)."""
    if not x_device_id:
        raise HTTPException(401, "en-tête X-Device-Id requis")
    with connexion() as cx:
        row = exec_sql(
            cx, "SELECT appareil_id FROM signalements WHERE id = ?", (identifiant,)
        ).fetchone()
        if not row:
            raise HTTPException(404, "introuvable")
        if (val(row, "appareil_id") or "") != x_device_id:
            raise HTTPException(403, "cet avis n'appartient pas à cet appareil")
        exec_sql(
            cx,
            "DELETE FROM signalements WHERE id = ? AND appareil_id = ?",
            (identifiant, x_device_id),
        )
    return {"statut": "ok"}

def maj_score_appareil(cx: Any, appareil: str) -> dict[str, Any]:
    rows = exec_sql(
        cx,
        """
        SELECT prix_paye_fcfa, prix_ref FROM signalements
        WHERE source = 'utilisateur' AND appareil_id = ?
        ORDER BY enregistre_le
        """,
        (appareil,),
    ).fetchall()
    historique = [(int(val(r, "prix_paye_fcfa")), val(r, "prix_ref")) for r in rows]
    bilan = score_fiabilite(historique)
    maintenant = datetime.now(timezone.utc).isoformat()
    if EST_POSTGRES:
        exec_sql(
            cx,
            """
            INSERT INTO appareils (appareil_id, score, nb, maj)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (appareil_id) DO UPDATE SET
              score = EXCLUDED.score, nb = EXCLUDED.nb, maj = EXCLUDED.maj
            """,
            (appareil, bilan["score"], bilan["nb"], maintenant),
        )
    else:
        exec_sql(
            cx,
            """
            INSERT INTO appareils (appareil_id, score, nb, maj)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (appareil_id) DO UPDATE SET
              score = excluded.score, nb = excluded.nb, maj = excluded.maj
            """,
            (appareil, bilan["score"], bilan["nb"], maintenant),
        )
    return bilan


def lire_fiabilite(appareil: str) -> dict[str, Any]:
    with connexion() as cx:
        row = exec_sql(
            cx, "SELECT score, nb FROM appareils WHERE appareil_id = ?", (appareil,)
        ).fetchone()
        if row:
            score = int(val(row, "score"))
            nb = int(val(row, "nb"))
            from fiabilite import libelle_fiabilite

            return {"score": score, "nb": nb, "libelle": libelle_fiabilite(score, nb)}
        # Recalcul au cas où la table n'est pas encore remplie
        return maj_score_appareil(cx, appareil)


@app.get("/fiabilite")
@app.get("/api/fiabilite")
def fiabilite_appareil(
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
) -> dict[str, Any]:
    if not x_device_id:
        raise HTTPException(401, "en-tête X-Device-Id requis")
    return lire_fiabilite(x_device_id.strip())


class SuggestionIn(BaseModel):
    id: str
    nom: str = Field(min_length=2, max_length=120)
    detail: str | None = Field(default=None, max_length=200)
    enregistreLe: str | None = None
    pseudo: str | None = Field(default=None, max_length=PSEUDO_MAX)

    @field_validator("nom", "detail")
    @classmethod
    def nettoyer_texte(cls, valeur: str | None) -> str | None:
        if valeur is None:
            return None
        texte = " ".join(valeur.split()).strip()
        return texte or None


@app.post("/suggestions", status_code=201)
@app.post("/api/suggestions", status_code=201)
def creer_suggestion(
    avis: SuggestionIn,
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
) -> dict[str, Any]:
    if not avis.nom:
        raise HTTPException(400, "nom requis")
    maintenant = avis.enregistreLe or datetime.now(timezone.utc).isoformat()
    with connexion() as cx:
        existant = exec_sql(
            cx, "SELECT id FROM suggestions_reperes WHERE id = ?", (avis.id,)
        ).fetchone()
        if existant:
            raise HTTPException(409, "cette suggestion existe déjà")
        exec_sql(
            cx,
            """
            INSERT INTO suggestions_reperes (id, nom, detail, appareil_id, pseudo, enregistre_le)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (avis.id, avis.nom, avis.detail, x_device_id, avis.pseudo, maintenant),
        )
    return {"statut": "ok", "id": avis.id}


@app.get("/zones-demandees")
@app.get("/api/zones-demandees")
def zones_demandees() -> dict[str, Any]:
    """Agrège les départs récemment signalés. Liste vide s'il n'y a pas assez de données."""
    with connexion() as cx:
        if EST_POSTGRES:
            rows = exec_sql(
                cx,
                """
                SELECT origin_label AS label,
                       AVG(origin_lat) AS lat,
                       AVG(origin_lon) AS lon,
                       COUNT(*) AS n
                FROM signalements
                WHERE source = 'utilisateur'
                  AND enregistre_le >= NOW() - INTERVAL '7 days'
                GROUP BY origin_label
                HAVING COUNT(*) >= 3
                ORDER BY n DESC
                LIMIT 12
                """,
            ).fetchall()
        else:
            depuis = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
            rows = exec_sql(
                cx,
                """
                SELECT origin_label AS label,
                       AVG(origin_lat) AS lat,
                       AVG(origin_lon) AS lon,
                       COUNT(*) AS n
                FROM signalements
                WHERE source = 'utilisateur' AND enregistre_le >= ?
                GROUP BY origin_label
                HAVING COUNT(*) >= 3
                ORDER BY n DESC
                LIMIT 12
                """,
                (depuis,),
            ).fetchall()
    zones = [
        {
            "label": val(r, "label"),
            "lat": float(val(r, "lat") or 0),
            "lon": float(val(r, "lon") or 0),
            "nb": int(val(r, "n")),
        }
        for r in rows
    ]
    return {"zones": zones, "nb": len(zones)}

