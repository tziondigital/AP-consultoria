create table if not exists public.configuracoes_sistema (
  id boolean primary key default true check (id),
  nome_empresa text not null default 'AP Consultoria',
  cnpj text,
  email text,
  responsavel text,
  endereco text,
  idioma text not null default 'pt-BR',
  fuso_horario text not null default 'America/Sao_Paulo',
  formato_data text not null default 'dd/MM/yyyy',
  formato_hora text not null default '24h',
  email_entrevista boolean not null default true,
  indicadores_dashboard boolean not null default true,
  modo_escuro boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.usuarios(id)
);
alter table public.configuracoes_sistema enable row level security;
insert into public.configuracoes_sistema(id) values(true) on conflict(id) do nothing;
create policy configuracoes_select_authenticated on public.configuracoes_sistema for select to authenticated using(true);
create policy configuracoes_admin_update on public.configuracoes_sistema for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
grant select,update on public.configuracoes_sistema to authenticated;

create policy curriculos_insert_recruitment on storage.objects for insert to authenticated
with check(bucket_id='curriculos' and (select private.can_manage_recruitment()));
create policy curriculos_select_access on storage.objects for select to authenticated
using(bucket_id='curriculos' and (select private.can_manage_recruitment()));
create policy curriculos_update_recruitment on storage.objects for update to authenticated
using(bucket_id='curriculos' and (select private.can_manage_recruitment()))
with check(bucket_id='curriculos' and (select private.can_manage_recruitment()));
create policy curriculos_delete_recruitment on storage.objects for delete to authenticated
using(bucket_id='curriculos' and (select private.can_manage_recruitment()));
