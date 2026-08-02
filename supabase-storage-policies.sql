-- GinesCloset · autorización de fotografías · versión 2026.08.02-r18
-- Ejecuta este archivo COMPLETO en Supabase > SQL Editor > Run.
-- Antes comprueba en Authentication > Third-Party Auth que Firebase esté
-- conectado con el Project ID: ginescloset-12beb

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-media',
  'catalog-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Solo acepta un token válido del proyecto Firebase de GinesCloset y la
-- cuenta administradora. La comprobación no depende de datos modificables
-- desde el navegador.
create or replace function public.is_ginescloset_storage_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    auth.jwt() ->> 'iss' = 'https://securetoken.google.com/ginescloset-12beb'
    and auth.jwt() ->> 'aud' = 'ginescloset-12beb'
    and lower(auth.jwt() ->> 'email') = 'ginescloset@gmail.com',
    false
  );
$$;

grant execute on function public.is_ginescloset_storage_admin() to anon, authenticated;

-- Retira tanto las reglas antiguas como las actuales para que el archivo se
-- pueda ejecutar más de una vez sin crear duplicados.
drop policy if exists "Public catalog media" on storage.objects;
drop policy if exists "Admins upload catalog media" on storage.objects;
drop policy if exists "Admins update catalog media" on storage.objects;
drop policy if exists "Admins delete catalog media" on storage.objects;
drop policy if exists "GinesCloset admin uploads" on storage.objects;
drop policy if exists "GinesCloset admin updates" on storage.objects;
drop policy if exists "GinesCloset admin deletes" on storage.objects;

create policy "Public catalog media"
on storage.objects for select
to public
using (bucket_id = 'catalog-media');

-- Firebase no añade por defecto el claim role=authenticated, por lo que el
-- token puede llegar con el rol anon. La función anterior sigue verificando
-- de forma estricta el proyecto y el correo del administrador.
create policy "GinesCloset admin uploads"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'catalog-media'
  and (storage.foldername(name))[1] = 'products'
  and public.is_ginescloset_storage_admin()
);

create policy "GinesCloset admin updates"
on storage.objects for update
to anon, authenticated
using (
  bucket_id = 'catalog-media'
  and (storage.foldername(name))[1] = 'products'
  and public.is_ginescloset_storage_admin()
)
with check (
  bucket_id = 'catalog-media'
  and (storage.foldername(name))[1] = 'products'
  and public.is_ginescloset_storage_admin()
);

create policy "GinesCloset admin deletes"
on storage.objects for delete
to anon, authenticated
using (
  bucket_id = 'catalog-media'
  and (storage.foldername(name))[1] = 'products'
  and public.is_ginescloset_storage_admin()
);

-- Comprobación final: deben aparecer el bucket y cuatro reglas.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'catalog-media';

select policyname, roles, cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'Public catalog media',
    'GinesCloset admin uploads',
    'GinesCloset admin updates',
    'GinesCloset admin deletes'
  )
order by policyname;
