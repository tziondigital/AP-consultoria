-- Initial RH schema
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
do $$ begin create type public.perfil_usuario as enum ('admin','cliente','operador'); exception when duplicate_object then null; end $$;
do $$ begin create type public.status_vaga as enum ('rascunho','em_andamento','congelada','completada','cancelada'); exception when duplicate_object then null; end $$;
do $$ begin create type public.status_candidatura as enum ('novo','triagem','entrevista','aprovado','reprovado','desistiu','contratado'); exception when duplicate_object then null; end $$;
do $$ begin create type public.status_entrevista as enum ('agendada','confirmada','realizada','cancelada','nao_compareceu'); exception when duplicate_object then null; end $$;
do $$ begin create type public.status_pagamento as enum ('pendente','parcial','pago','vencido','cancelado'); exception when duplicate_object then null; end $$;

create table public.empresas(id uuid primary key default gen_random_uuid(),nome text not null,razao_social text,cnpj text unique,contato text,email text,telefone text,ativo boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.usuarios(id uuid primary key references auth.users(id) on delete cascade,nome text,email text,perfil public.perfil_usuario not null default 'cliente',ativo boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.usuario_empresas(usuario_id uuid not null references public.usuarios(id) on delete cascade,empresa_id uuid not null references public.empresas(id) on delete cascade,created_at timestamptz not null default now(),primary key(usuario_id,empresa_id));
create table public.vagas(id uuid primary key default gen_random_uuid(),empresa_id uuid not null references public.empresas(id) on delete restrict,cargo text not null,area text,local text,estado char(2),salario numeric(12,2),tipo_contrato text,status public.status_vaga not null default 'em_andamento',data_requisicao date not null default current_date,gestor text,confidencial boolean not null default false,pcd boolean not null default false,observacoes text,requisitos text,responsabilidades text,quantidade integer not null default 1 check(quantidade>0),prazo_fechamento date,encerrada_em timestamptz,criado_por uuid references public.usuarios(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.candidatos(id uuid primary key default gen_random_uuid(),nome text not null,telefone text,email text,cidade text,estado char(2),linkedin_url text,curriculo_path text,observacoes text,criado_por uuid references public.usuarios(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.candidaturas(id uuid primary key default gen_random_uuid(),candidato_id uuid not null references public.candidatos(id) on delete cascade,vaga_id uuid not null references public.vagas(id) on delete cascade,status public.status_candidatura not null default 'novo',parecer text,resultado text,origem text,inscrito_em timestamptz not null default now(),atualizado_por uuid references public.usuarios(id),updated_at timestamptz not null default now(),unique(candidato_id,vaga_id));
create table public.entrevistas(id uuid primary key default gen_random_uuid(),candidatura_id uuid not null references public.candidaturas(id) on delete cascade,candidato_id uuid not null references public.candidatos(id) on delete cascade,vaga_id uuid not null references public.vagas(id) on delete cascade,data timestamptz not null,duracao_minutos integer not null default 45 check(duracao_minutos between 10 and 480),link text,email_enviado boolean not null default false,email_enviado_em timestamptz,status public.status_entrevista not null default 'agendada',observacoes text,criado_por uuid references public.usuarios(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.financeiro(id uuid primary key default gen_random_uuid(),vaga_id uuid not null references public.vagas(id) on delete restrict,valor numeric(12,2) not null default 0 check(valor>=0),percentual numeric(5,2) not null default 0 check(percentual between 0 and 100),valor_comissao numeric(12,2) generated always as (round(valor*percentual/100,2)) stored,status public.status_pagamento not null default 'pendente',pago boolean not null default false,data_vencimento date,data_pagamento date,nota_emitida boolean not null default false,numero_nota text,observacoes text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.notificacoes(id uuid primary key default gen_random_uuid(),usuario_id uuid references public.usuarios(id) on delete cascade,empresa_id uuid references public.empresas(id) on delete cascade,titulo text not null,mensagem text not null,tipo text not null default 'sistema',lida boolean not null default false,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create table public.audit_logs(id bigint generated always as identity primary key,usuario_id uuid,acao text not null,tabela text not null,registro_id text,dados_anteriores jsonb,dados_novos jsonb,ip inet,user_agent text,created_at timestamptz not null default now());

create or replace function private.current_user_role() returns public.perfil_usuario language sql stable security definer set search_path=public,auth as $$ select u.perfil from public.usuarios u where u.id=auth.uid() and u.ativo=true limit 1 $$;
create or replace function private.is_admin() returns boolean language sql stable security definer set search_path=public,auth as $$ select coalesce(private.current_user_role()='admin',false) $$;
create or replace function private.can_manage_recruitment() returns boolean language sql stable security definer set search_path=public,auth as $$ select coalesce(private.current_user_role() in ('admin','operador'),false) $$;
create or replace function private.has_company_access(p_empresa_id uuid) returns boolean language sql stable security definer set search_path=public,auth as $$ select private.can_manage_recruitment() or exists(select 1 from public.usuario_empresas ue where ue.usuario_id=auth.uid() and ue.empresa_id=p_empresa_id) $$;
revoke all on function private.current_user_role() from public,anon;
revoke all on function private.is_admin() from public,anon;
revoke all on function private.can_manage_recruitment() from public,anon;
revoke all on function private.has_company_access(uuid) from public,anon;
grant execute on function private.current_user_role(), private.is_admin(), private.can_manage_recruitment(), private.has_company_access(uuid) to authenticated;

alter table public.empresas enable row level security;
alter table public.usuarios enable row level security;
alter table public.usuario_empresas enable row level security;
alter table public.vagas enable row level security;
alter table public.candidatos enable row level security;
alter table public.candidaturas enable row level security;
alter table public.entrevistas enable row level security;
alter table public.financeiro enable row level security;
alter table public.notificacoes enable row level security;
alter table public.audit_logs enable row level security;

create policy "empresas_select_access" on public.empresas for select to authenticated using(private.is_admin() or private.can_manage_recruitment() or private.has_company_access(id));
create policy "empresas_admin_write" on public.empresas for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy "usuarios_select_self_or_admin" on public.usuarios for select to authenticated using(id=(select auth.uid()) or private.is_admin());
create policy "usuarios_admin_write" on public.usuarios for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy "usuario_empresas_select" on public.usuario_empresas for select to authenticated using(usuario_id=(select auth.uid()) or private.is_admin());
create policy "usuario_empresas_admin_write" on public.usuario_empresas for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy "vagas_select_access" on public.vagas for select to authenticated using(private.has_company_access(empresa_id));
create policy "vagas_insert_access" on public.vagas for insert to authenticated with check(private.has_company_access(empresa_id));
create policy "vagas_update_access" on public.vagas for update to authenticated using(private.has_company_access(empresa_id)) with check(private.has_company_access(empresa_id));
create policy "vagas_delete_admin" on public.vagas for delete to authenticated using(private.is_admin());
create policy "candidatos_select_access" on public.candidatos for select to authenticated using(private.can_manage_recruitment() or exists(select 1 from public.candidaturas ca join public.vagas v on v.id=ca.vaga_id where ca.candidato_id=candidatos.id and private.has_company_access(v.empresa_id)));
create policy "candidatos_manage_recruitment" on public.candidatos for all to authenticated using(private.can_manage_recruitment()) with check(private.can_manage_recruitment());
create policy "candidaturas_select_access" on public.candidaturas for select to authenticated using(exists(select 1 from public.vagas v where v.id=vaga_id and private.has_company_access(v.empresa_id)));
create policy "candidaturas_manage_recruitment" on public.candidaturas for all to authenticated using(private.can_manage_recruitment()) with check(private.can_manage_recruitment());
create policy "entrevistas_select_access" on public.entrevistas for select to authenticated using(exists(select 1 from public.vagas v where v.id=vaga_id and private.has_company_access(v.empresa_id)));
create policy "entrevistas_manage_recruitment" on public.entrevistas for all to authenticated using(private.can_manage_recruitment()) with check(private.can_manage_recruitment());
create policy "financeiro_admin_only" on public.financeiro for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy "notificacoes_select_own_or_admin" on public.notificacoes for select to authenticated using(private.is_admin() or usuario_id=(select auth.uid()) or (empresa_id is not null and private.has_company_access(empresa_id)));
create policy "audit_admin_select" on public.audit_logs for select to authenticated using(private.is_admin());

insert into storage.buckets(id,name,public) values('curriculos','curriculos',false),('relatorios','relatorios',false) on conflict(id) do nothing;