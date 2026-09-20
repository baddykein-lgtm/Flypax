-- ============================================================
-- FLYPAX — Migración: enlaces sociales y mapa en la página pública
-- ============================================================
-- Añade columnas opcionales a "businesses" para el pie de la página
-- pública (app/[slug]/page.js): mapa (ya usa latitude/longitude, que ya
-- existían) + iconos de WhatsApp / Instagram / Facebook / web.
--
-- Formato esperado (de momento se rellenan a mano en Supabase; el panel
-- para editarlos se conecta en un paso posterior):
--   whatsapp  -> solo dígitos con prefijo de país, ej. "34600000000"
--   instagram -> URL completa, ej. "https://instagram.com/tunegocio"
--   facebook  -> URL completa
--   website   -> URL completa
--
-- Cómo usarlo: pégalo en Supabase → SQL Editor → Run.
-- ============================================================

alter table businesses add column if not exists whatsapp text;
alter table businesses add column if not exists instagram text;
alter table businesses add column if not exists facebook text;
alter table businesses add column if not exists website text;
