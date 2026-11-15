-- Schéma prêt pour Supabase (PostgreSQL).
-- Les avis d'exemple ne doivent jamais être mélangés aux avis d'usagers
-- côté application (filtre source = 'utilisateur').

create table if not exists signalements (
  id text primary key,
  origin_lat double precision not null,
  origin_lon double precision not null,
  dest_lat double precision not null,
  dest_lon double precision not null,
  origin_label text not null,
  dest_label text not null,
  distance_m double precision not null check (distance_m >= 0),
  prix_paye_fcfa integer not null check (prix_paye_fcfa >= 50 and prix_paye_fcfa <= 20000),
  nuit boolean not null default false,
  pluie boolean not null default false,
  enregistre_le timestamptz not null default now(),
  source text not null default 'utilisateur' check (source in ('utilisateur', 'exemple'))
);

create index if not exists idx_signalements_geo
  on signalements (origin_lat, origin_lon, dest_lat, dest_lon);

create index if not exists idx_signalements_source_date
  on signalements (source, enregistre_le desc);

alter table signalements enable row level security;

-- Lecture publique des avis d'usagers uniquement.
create policy "lecture des avis utilisateurs"
  on signalements for select
  using (source = 'utilisateur');

-- Insertion anonyme, limitée aux avis d'usagers.
-- À durcir (captcha, quota) avant une mise en production réelle.
create policy "depot anonyme d'un avis"
  on signalements for insert
  with check (source = 'utilisateur');
