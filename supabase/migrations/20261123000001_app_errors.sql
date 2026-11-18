-- Errores del servidor en producción, para enterarnos aunque nadie avise.
-- Sólo los escribe y los lee el servidor (service role). Nada de datos de clientes:
-- se guarda la ruta, el tipo de error y su mensaje recortado.
create table public.app_errors (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  path        text not null check (char_length(path) <= 300),
  method      text check (char_length(method) <= 10),
  kind        text check (char_length(kind) <= 40),
  message     text check (char_length(message) <= 500),
  digest      text check (char_length(digest) <= 80)
);
create index app_errors_at_idx on public.app_errors (at desc);
alter table public.app_errors enable row level security;
revoke all on public.app_errors from anon, authenticated;
