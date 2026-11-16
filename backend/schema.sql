-- Schéma PostgreSQL de Zém Tarif (Render ou Supabase).
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
  heure smallint,
  pseudo text,
  appareil_id text,
  enregistre_le timestamptz not null default now(),
  source text not null default 'utilisateur' check (source in ('utilisateur', 'exemple'))
);

create index if not exists idx_signalements_geo
  on signalements (origin_lat, origin_lon, dest_lat, dest_lon);

create index if not exists idx_signalements_source_date
  on signalements (source, enregistre_le desc);

create index if not exists idx_signalements_trajet
  on signalements (origin_label, dest_label);

create index if not exists idx_signalements_appareil
  on signalements (appareil_id, enregistre_le desc);

alter table signalements add column if not exists role text default 'passager';
alter table signalements add column if not exists bagage boolean not null default false;
alter table signalements add column if not exists poids double precision not null default 1;
alter table signalements add column if not exists prix_ref integer;

create table if not exists appareils (
  appareil_id text primary key,
  score integer not null default 0,
  nb integer not null default 0,
  maj timestamptz not null default now()
);

create table if not exists suggestions_reperes (
  id text primary key,
  nom text not null,
  detail text,
  appareil_id text,
  pseudo text,
  enregistre_le timestamptz not null default now()
);

alter table signalements add column if not exists bagage_niveau text default 'aucun';

create table if not exists trajets_partages (
  jeton text primary key,
  appareil_id text,
  origin_label text,
  dest_label text,
  lat double precision,
  lon double precision,
  commence_le timestamptz not null default now(),
  expire_le timestamptz not null,
  termine boolean not null default false
);
