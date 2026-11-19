-- Un solo recordatorio a quien se registró y no terminó de configurar Cobra+.
alter table public.organizations add column onboarding_nudged_at timestamptz;
