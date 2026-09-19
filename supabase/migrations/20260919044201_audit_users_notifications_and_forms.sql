-- Auditoria funcional: perfis completos, correção do administrador principal
-- e notificações reais geradas pelos eventos operacionais do sistema.

alter type public.perfil_usuario add value if not exists 'financeiro';

alter table public.usuarios
  add column if not exists cargo text,
  add column if not exists telefone text,
  add column if not exists ultimo_acesso timestamptz;

update public.usuarios
set perfil = 'admin', updated_at = now()
where lower(email) = 'tziondigital.tz@gmail.com';

create index if not exists idx_notificacoes_usuario_nao_lida
  on public.notificacoes (usuario_id, created_at desc)
  where lida = false;

-- Atualização atômica do cadastro e dos vínculos de empresa. A função fica
-- exposta somente para usuários autenticados e confirma o perfil admin dentro
-- do banco antes de realizar qualquer alteração.
create or replace function public.admin_update_user_profile(
  p_id uuid,
  p_nome text,
  p_email text,
  p_cargo text,
  p_telefone text,
  p_perfil public.perfil_usuario,
  p_ativo boolean,
  p_empresa_ids uuid[] default '{}'::uuid[]
) returns public.usuarios
language plpgsql
security invoker
set search_path = public, private, auth, pg_temp
as $$
declare
  v_result public.usuarios;
  v_admins integer;
begin
  if not private.is_admin() then
    raise exception 'Apenas administradores podem editar usuários'
      using errcode = '42501';
  end if;

  if p_id = auth.uid() and (not p_ativo or p_perfil <> 'admin') then
    select count(*) into v_admins
    from public.usuarios
    where perfil = 'admin' and ativo and id <> p_id;

    if v_admins = 0 then
      raise exception 'O sistema precisa manter ao menos um administrador ativo'
        using errcode = '23514';
    end if;
  end if;

  update public.usuarios
  set nome = nullif(trim(p_nome), ''),
      email = lower(nullif(trim(p_email), '')),
      cargo = nullif(trim(p_cargo), ''),
      telefone = nullif(trim(p_telefone), ''),
      perfil = p_perfil,
      ativo = p_ativo,
      updated_at = now()
  where id = p_id
  returning * into v_result;

  if not found then
    raise exception 'Usuário não encontrado' using errcode = 'P0002';
  end if;

  delete from public.usuario_empresas where usuario_id = p_id;
  insert into public.usuario_empresas (usuario_id, empresa_id)
  select p_id, empresa_id
  from unnest(coalesce(p_empresa_ids, '{}'::uuid[])) as empresa_id
  on conflict do nothing;

  return v_result;
end;
$$;

revoke all on function public.admin_update_user_profile(uuid,text,text,text,text,public.perfil_usuario,boolean,uuid[]) from public, anon;
grant execute on function public.admin_update_user_profile(uuid,text,text,text,text,public.perfil_usuario,boolean,uuid[]) to authenticated;

-- Mantém os perfis criados pelo Auth sincronizados com os campos disponíveis.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  p public.perfil_usuario;
begin
  p := case
    when new.raw_app_meta_data->>'perfil' in ('admin','cliente','operador','financeiro')
      then (new.raw_app_meta_data->>'perfil')::public.perfil_usuario
    else 'cliente'::public.perfil_usuario
  end;

  insert into public.usuarios(id,nome,email,cargo,telefone,perfil)
  values(
    new.id,
    nullif(new.raw_user_meta_data->>'nome',''),
    new.email,
    nullif(new.raw_user_meta_data->>'cargo',''),
    nullif(new.raw_user_meta_data->>'telefone',''),
    p
  )
  on conflict(id) do update
  set email = excluded.email, updated_at = now();

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Gera uma notificação individual por destinatário. Isso permite que cada
-- pessoa marque sua própria notificação como lida sem afetar as demais.
create or replace function private.notify_business_event()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_new jsonb := to_jsonb(new);
  v_old jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  v_empresa_id uuid;
  v_vaga_id uuid;
  v_titulo text;
  v_mensagem text;
  v_tipo text := tg_table_name;
  v_admin_only boolean := false;
  v_cargo text;
  v_nome text;
begin
  if tg_table_name = 'vagas' then
    v_empresa_id := (v_new->>'empresa_id')::uuid;
    v_cargo := coalesce(v_new->>'cargo','vaga');
    if tg_op = 'INSERT' then
      v_titulo := 'Nova vaga cadastrada';
      v_mensagem := 'A vaga ' || v_cargo || ' foi cadastrada.';
    elsif v_new->>'status' is distinct from v_old->>'status' then
      v_titulo := 'Status da vaga atualizado';
      v_mensagem := v_cargo || ': ' || replace(v_new->>'status','_',' ') || '.';
    else
      return new;
    end if;
  elsif tg_table_name = 'candidatos' then
    v_nome := coalesce(v_new->>'nome','Candidato');
    v_titulo := 'Novo candidato cadastrado';
    v_mensagem := v_nome || ' foi incluído no banco de talentos.';
  elsif tg_table_name in ('candidaturas','entrevistas','avaliacoes') then
    if tg_table_name = 'candidaturas' then
      v_vaga_id := (v_new->>'vaga_id')::uuid;
      select c.nome into v_nome from public.candidatos c where c.id = (v_new->>'candidato_id')::uuid;
      if tg_op = 'INSERT' then
        v_titulo := 'Nova candidatura';
        v_mensagem := coalesce(v_nome,'Candidato') || ' foi vinculado a um processo.';
      elsif v_new->>'status' is distinct from v_old->>'status' then
        v_titulo := 'Etapa do processo atualizada';
        v_mensagem := coalesce(v_nome,'Candidato') || ': ' || replace(v_new->>'status','_',' ') || '.';
      else
        return new;
      end if;
    elsif tg_table_name = 'entrevistas' then
      v_vaga_id := (v_new->>'vaga_id')::uuid;
      select c.nome into v_nome from public.candidatos c where c.id = (v_new->>'candidato_id')::uuid;
      if tg_op = 'INSERT' then
        v_titulo := 'Entrevista agendada';
        v_mensagem := 'Entrevista de ' || coalesce(v_nome,'candidato') || ' agendada.';
      elsif v_new->>'status' is distinct from v_old->>'status' then
        v_titulo := 'Entrevista atualizada';
        v_mensagem := coalesce(v_nome,'Candidato') || ': ' || replace(v_new->>'status','_',' ') || '.';
      else
        return new;
      end if;
    else
      select ca.vaga_id, c.nome into v_vaga_id, v_nome
      from public.candidaturas ca
      join public.candidatos c on c.id = ca.candidato_id
      where ca.id = (v_new->>'candidatura_id')::uuid;
      v_titulo := 'Avaliação registrada';
      v_mensagem := 'Uma avaliação de ' || coalesce(v_nome,'candidato') || ' foi registrada.';
    end if;

    select v.empresa_id, v.cargo into v_empresa_id, v_cargo
    from public.vagas v where v.id = v_vaga_id;
  elsif tg_table_name = 'financeiro' then
    v_admin_only := true;
    select v.empresa_id, v.cargo into v_empresa_id, v_cargo
    from public.vagas v where v.id = (v_new->>'vaga_id')::uuid;
    if tg_op = 'INSERT' then
      v_titulo := 'Novo lançamento financeiro';
      v_mensagem := 'Lançamento criado para ' || coalesce(v_cargo,'vaga') || '.';
    elsif v_new->>'status' is distinct from v_old->>'status'
       or v_new->>'pago' is distinct from v_old->>'pago' then
      v_titulo := 'Financeiro atualizado';
      v_mensagem := coalesce(v_cargo,'Vaga') || ': ' || replace(v_new->>'status','_',' ') || '.';
    else
      return new;
    end if;
  else
    return new;
  end if;

  insert into public.notificacoes(usuario_id,empresa_id,titulo,mensagem,tipo,metadata)
  select u.id, v_empresa_id, v_titulo, v_mensagem, v_tipo,
         jsonb_build_object('tabela',tg_table_name,'operacao',tg_op,'registro_id',v_new->>'id')
  from public.usuarios u
  where u.ativo
    and (
      (v_admin_only and u.perfil = 'admin')
      or (not v_admin_only and u.perfil in ('admin','operador'))
      or (not v_admin_only and u.perfil = 'cliente' and v_empresa_id is not null and exists(
        select 1 from public.usuario_empresas ue
        where ue.usuario_id = u.id and ue.empresa_id = v_empresa_id
      ))
    );

  return new;
end;
$$;

revoke all on function private.notify_business_event() from public, anon, authenticated;

drop trigger if exists notify_vagas on public.vagas;
create trigger notify_vagas after insert or update of status on public.vagas
for each row execute function private.notify_business_event();

drop trigger if exists notify_candidatos on public.candidatos;
create trigger notify_candidatos after insert on public.candidatos
for each row execute function private.notify_business_event();

drop trigger if exists notify_candidaturas on public.candidaturas;
create trigger notify_candidaturas after insert or update of status on public.candidaturas
for each row execute function private.notify_business_event();

drop trigger if exists notify_entrevistas on public.entrevistas;
create trigger notify_entrevistas after insert or update of status on public.entrevistas
for each row execute function private.notify_business_event();

drop trigger if exists notify_avaliacoes on public.avaliacoes;
create trigger notify_avaliacoes after insert on public.avaliacoes
for each row execute function private.notify_business_event();

drop trigger if exists notify_financeiro on public.financeiro;
create trigger notify_financeiro after insert or update of status, pago on public.financeiro
for each row execute function private.notify_business_event();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notificacoes'
  ) then
    alter publication supabase_realtime add table public.notificacoes;
  end if;
end;
$$;

insert into public.notificacoes(usuario_id,titulo,mensagem,tipo,metadata)
select u.id,
       'Sistema revisado',
       'Seu perfil foi confirmado como administrador e as notificações operacionais foram ativadas.',
       'sistema',
       jsonb_build_object('auditoria','2026-09-19')
from public.usuarios u
where lower(u.email) = 'tziondigital.tz@gmail.com'
  and not exists (
    select 1 from public.notificacoes n
    where n.usuario_id = u.id
      and n.metadata->>'auditoria' = '2026-09-19'
  );
