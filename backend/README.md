# API optionnelle de Zém Tarif

L'application fonctionne sans ce serveur : les prix signalés restent alors
sur l'appareil.

## Lancer en local

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Puis, à la racine de l'application :

```bash
echo "EXPO_PUBLIC_API_URL=http://localhost:8000" > ../.env
```

Points d'entrée :

- `GET /api/sante`
- `GET /api/signalements`
- `POST /api/signalements`

Le fichier `schema.sql` reprend la même structure pour Supabase
(PostgreSQL, avec des politiques de lecture et d'écriture anonymes à
durcir avant une mise en ligne réelle).
