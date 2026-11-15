"""Petit serveur optionnel pour rassembler les prix signalés.

L'application mobile fonctionne sans lui : les avis restent alors
sur l'appareil. Ce service sert surtout de base pour une future
mise en commun, ou comme proxy Nominatim/OSRM si besoin.
"""

from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

RACINE = Path(__file__).resolve().parent
CHEMIN_DB = Path(os.environ.get("ZEM_TARIF_DB", RACINE / "signalements.db"))

app = FastAPI(
    title="Zém Tarif",
    description="API optionnelle pour les signalements de prix de zémidjan.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def connexion() -> sqlite3.Connection:
    CHEMIN_DB.parent.mkdir(parents=True, exist_ok=True)
    cx = sqlite3.connect(CHEMIN_DB)
    cx.row_factory = sqlite3.Row
    return cx


def init_db() -> None:
    with connexion() as cx:
        cx.executescript(
            """
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
              enregistre_le TEXT NOT NULL,
              source TEXT NOT NULL CHECK (source IN ('utilisateur', 'exemple'))
            );
            CREATE INDEX IF NOT EXISTS idx_signalements_geo
              ON signalements (origin_lat, origin_lon, dest_lat, dest_lon);
            """
        )


class SignalementIn(BaseModel):
    id: str
    originLat: float
    originLon: float
    destLat: float
    destLon: float
    originLabel: str
    destLabel: str
    distanceM: float = Field(ge=0)
    prixPayeFcfa: int = Field(ge=50, le=20000)
    nuit: bool
    pluie: bool
    enregistreLe: str
    source: str = "utilisateur"


def ligne_vers_json(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "originLat": row["origin_lat"],
        "originLon": row["origin_lon"],
        "destLat": row["dest_lat"],
        "destLon": row["dest_lon"],
        "originLabel": row["origin_label"],
        "destLabel": row["dest_label"],
        "distanceM": row["distance_m"],
        "prixPayeFcfa": row["prix_paye_fcfa"],
        "nuit": bool(row["nuit"]),
        "pluie": bool(row["pluie"]),
        "enregistreLe": row["enregistre_le"],
        "source": row["source"],
    }


@app.on_event("startup")
def au_demarrage() -> None:
    init_db()


@app.get("/api/sante")
def sante() -> dict[str, str]:
    return {"statut": "ok"}


@app.get("/api/signalements")
def lister_signalements(
    source: str = Query(default="utilisateur"),
) -> list[dict[str, Any]]:
    if source not in {"utilisateur", "exemple", "tous"}:
        raise HTTPException(400, "source inconnue")
    with connexion() as cx:
        if source == "tous":
            rows = cx.execute(
                "SELECT * FROM signalements ORDER BY enregistre_le DESC"
            ).fetchall()
        else:
            rows = cx.execute(
                "SELECT * FROM signalements WHERE source = ? ORDER BY enregistre_le DESC",
                (source,),
            ).fetchall()
    return [ligne_vers_json(r) for r in rows]


@app.post("/api/signalements", status_code=201)
def creer_signalement(avis: SignalementIn) -> dict[str, Any]:
    if avis.source not in {"utilisateur", "exemple"}:
        raise HTTPException(400, "source inconnue")
    with connexion() as cx:
        existant = cx.execute(
            "SELECT id FROM signalements WHERE id = ?", (avis.id,)
        ).fetchone()
        if existant:
            raise HTTPException(409, "ce signalement existe déjà")
        cx.execute(
            """
            INSERT INTO signalements (
              id, origin_lat, origin_lon, dest_lat, dest_lon,
              origin_label, dest_label, distance_m, prix_paye_fcfa,
              nuit, pluie, enregistre_le, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                int(avis.nuit),
                int(avis.pluie),
                avis.enregistreLe,
                avis.source,
            ),
        )
    return json.loads(avis.model_dump_json())
