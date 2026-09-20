-- ============================================================
-- FLYPAX — Migración: enlazar pago (Stripe) con acceso al panel
-- ============================================================
-- Por qué: en /suscribirse el negocio todavía no existe (se crea después,
-- en /onboarding), así que el webhook de Stripe no podía guardar business_id
-- al confirmar el pago. subscriptions.business_id era NOT NULL, así que esa
-- escritura fallaba en silencio y el acceso al panel nunca comprobaba nada
-- de esto — cualquiera que completara el onboarding tenía panel gratis.
--
-- Cómo usarlo: pégalo en Supabase → SQL Editor → Run. Es seguro de ejecutar
-- aunque ya tengas filas en subscriptions.
-- ============================================================

alter table subscriptions alter column business_id drop not null;
alter table subscriptions drop constraint if exists subscriptions_business_id_key;
alter table subscriptions add column if not exists customer_email text;
alter table subscriptions add constraint subscriptions_stripe_customer_id_key unique (stripe_customer_id);

create unique index if not exists subscriptions_business_idx on subscriptions(business_id) where business_id is not null;
create index if not exists subscriptions_email_idx on subscriptions(customer_email);
