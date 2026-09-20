-- ============================================================
-- FLYPAX — Migración: fotos y etiquetas en productos de la carta
-- ============================================================
-- Añade image_url/tags a "products" y crea el bucket de Storage "products"
-- (público en lectura, subida/borrado solo para el dueño del negocio).
--
-- Cómo usarlo: pégalo en Supabase → SQL Editor → Run.
-- ============================================================

alter table products add column if not exists image_url text;
alter table products add column if not exists tags text[] default '{}';

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects
  for select
  using (bucket_id = 'products');

drop policy if exists "Owners upload product images" on storage.objects;
create policy "Owners upload product images" on storage.objects
  for insert
  with check (
    bucket_id = 'products'
    and exists (
      select 1 from businesses b
      where b.id::text = (storage.foldername(name))[1]
      and b.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners delete product images" on storage.objects;
create policy "Owners delete product images" on storage.objects
  for delete
  using (
    bucket_id = 'products'
    and exists (
      select 1 from businesses b
      where b.id::text = (storage.foldername(name))[1]
      and b.owner_id = auth.uid()
    )
  );
