# API de Zém Tarif

L’application fonctionne sans ce serveur : les prix signalés restent alors
sur l’appareil, puis sont renvoyés dès que le réseau est disponible.

En production, l’API est en ligne à
[https://zem-tarif-api.onrender.com](https://zem-tarif-api.onrender.com)
(service Render gratuit, région Francfort), devant une base PostgreSQL
également hébergée sur Render.

## Lancer en local

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Sans `DATABASE_URL`, une base SQLite locale est utilisée
(`backend/signalements.db`). Avec `DATABASE_URL`, c’est PostgreSQL.

À la racine de l’application :

```bash
echo "EXPO_PUBLIC_API_URL=http://localhost:8000" > ../.env
```

## Points d’entrée

- `GET /sante` (également `/` et `/api/sante`)
- `POST /signalements` — trajet, km, prix payé, heure, pluie, pseudo facultatif
- `GET /signalements`
- `GET /stats` — médiane, minimum et maximum par trajet, filtre `?zone=`
- `DELETE /signalements/{id}` — uniquement pour l’appareil qui a envoyé l’avis
  (`X-Device-Id`)

Les chemins préfixés par `/api/` restent acceptés.

## Garde-fous

- 8 signalements par heure et 20 par jour, par identifiant d’appareil
- Prix compris entre 50 F et 20 000 F, distance entre 0 et 80 km
- CORS ouvert pour la démo web `https://zem-tarif.onrender.com`

Le fichier `schema.sql` reprend la même structure pour un hébergement
externe (Supabase, Neon, etc.).
