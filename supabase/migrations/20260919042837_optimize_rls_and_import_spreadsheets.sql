-- AP Consultoria: correções seguras indicadas pelos advisors e importação
-- idempotente das planilhas operacionais recebidas em 19/09/2026.

-- Índices de chaves estrangeiras sinalizados pelo advisor de performance.
create index if not exists idx_avaliacoes_candidatura_id
  on public.avaliacoes (candidatura_id);
create index if not exists idx_avaliacoes_operador_id
  on public.avaliacoes (operador_id);

-- Evita reavaliar auth.uid() e funções sem dependência da linha para cada registro.
alter policy usuarios_select_self_or_admin on public.usuarios
  using ((id = (select auth.uid())) or (select private.is_admin()));

alter policy usuario_empresas_select on public.usuario_empresas
  using ((usuario_id = (select auth.uid())) or (select private.is_admin()));

alter policy notificacoes_select_own_or_admin on public.notificacoes
  using (
    (select private.is_admin())
    or usuario_id = (select auth.uid())
    or (empresa_id is not null and private.has_company_access(empresa_id))
  );

alter policy notificacoes_update_own on public.notificacoes
  using ((usuario_id = (select auth.uid())) or (select private.is_admin()))
  with check ((usuario_id = (select auth.uid())) or (select private.is_admin()));

-- As políticas ALL abaixo também participavam de SELECT, gerando políticas
-- permissivas duplicadas. Elas são separadas por operação sem mudar o acesso.
drop policy if exists avaliacoes_manage_recruitment on public.avaliacoes;
create policy avaliacoes_manage_recruitment_insert on public.avaliacoes
  for insert to authenticated
  with check ((select private.can_manage_recruitment()));
create policy avaliacoes_manage_recruitment_update on public.avaliacoes
  for update to authenticated
  using ((select private.can_manage_recruitment()))
  with check ((select private.can_manage_recruitment()));
create policy avaliacoes_manage_recruitment_delete on public.avaliacoes
  for delete to authenticated
  using ((select private.can_manage_recruitment()));

drop policy if exists candidatos_manage_recruitment on public.candidatos;
create policy candidatos_manage_recruitment_insert on public.candidatos
  for insert to authenticated
  with check ((select private.can_manage_recruitment()));
create policy candidatos_manage_recruitment_update on public.candidatos
  for update to authenticated
  using ((select private.can_manage_recruitment()))
  with check ((select private.can_manage_recruitment()));
create policy candidatos_manage_recruitment_delete on public.candidatos
  for delete to authenticated
  using ((select private.can_manage_recruitment()));

drop policy if exists candidaturas_manage_recruitment on public.candidaturas;
create policy candidaturas_manage_recruitment_insert on public.candidaturas
  for insert to authenticated
  with check ((select private.can_manage_recruitment()));
create policy candidaturas_manage_recruitment_update on public.candidaturas
  for update to authenticated
  using ((select private.can_manage_recruitment()))
  with check ((select private.can_manage_recruitment()));
create policy candidaturas_manage_recruitment_delete on public.candidaturas
  for delete to authenticated
  using ((select private.can_manage_recruitment()));

drop policy if exists entrevistas_manage_recruitment on public.entrevistas;
create policy entrevistas_manage_recruitment_insert on public.entrevistas
  for insert to authenticated
  with check ((select private.can_manage_recruitment()));
create policy entrevistas_manage_recruitment_update on public.entrevistas
  for update to authenticated
  using ((select private.can_manage_recruitment()))
  with check ((select private.can_manage_recruitment()));
create policy entrevistas_manage_recruitment_delete on public.entrevistas
  for delete to authenticated
  using ((select private.can_manage_recruitment()));

drop policy if exists empresas_admin_write on public.empresas;
create policy empresas_admin_insert on public.empresas
  for insert to authenticated
  with check ((select private.is_admin()));
create policy empresas_admin_update on public.empresas
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy empresas_admin_delete on public.empresas
  for delete to authenticated
  using ((select private.is_admin()));

drop policy if exists usuario_empresas_admin_write on public.usuario_empresas;
create policy usuario_empresas_admin_insert on public.usuario_empresas
  for insert to authenticated
  with check ((select private.is_admin()));
create policy usuario_empresas_admin_update on public.usuario_empresas
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy usuario_empresas_admin_delete on public.usuario_empresas
  for delete to authenticated
  using ((select private.is_admin()));

drop policy if exists usuarios_admin_write on public.usuarios;
create policy usuarios_admin_insert on public.usuarios
  for insert to authenticated
  with check ((select private.is_admin()));
create policy usuarios_admin_update on public.usuarios
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy usuarios_admin_delete on public.usuarios
  for delete to authenticated
  using ((select private.is_admin()));

-- Ajusta datas que haviam sido deslocadas em um dia na primeira carga.
update public.vagas set
  data_requisicao = date '2026-07-15',
  start_talent = date '2026-07-16'
where requisicao in ('0126-01', '0126-02');

update public.vagas set
  data_requisicao = date '2026-07-17',
  start_talent = date '2026-07-17'
where requisicao in ('0226-01', '0226-02');

-- Lançamentos financeiros. Para as duas vagas IT, a planilha informa somente
-- o valor fixo de R$ 500; ele é registrado como base integral (100%).
with origem(requisicao, cargo, valor, percentual, observacoes) as (
  values
    ('0226-01'::text, null::text, 1500.00::numeric, 19.00::numeric, 'Importado de CONTROLE DE VAGAS: honorários de 19%.'::text),
    ('0226-02', null, 1500.00, 19.00, 'Importado de CONTROLE DE VAGAS: honorários de 19%.'),
    ('326', null, 500.00, 100.00, 'Importado de CONTROLE DE VAGAS: valor fixo; percentual não informado na origem.'),
    ('426', null, 500.00, 100.00, 'Importado de CONTROLE DE VAGAS: valor fixo; percentual não informado na origem.'),
    (null, 'ASSISTENTE FINANCEIRO', 2500.00, 30.00, 'Importado de CONTROLE DE VAGAS: honorários de 30%.'),
    (null, 'ASSISTENTE ADMINISTRATIVO', 2500.00, 30.00, 'Importado de CONTROLE DE VAGAS: honorários de 30%.')
), lancamentos as (
  select v.id as vaga_id, o.valor, o.percentual, o.observacoes
  from origem o
  join public.vagas v
    on (o.requisicao is not null and v.requisicao = o.requisicao)
    or (o.requisicao is null and upper(v.cargo) = o.cargo)
)
insert into public.financeiro (vaga_id, valor, percentual, status, pago, observacoes)
select l.vaga_id, l.valor, l.percentual, 'pendente'::public.status_pagamento, false, l.observacoes
from lancamentos l
where not exists (
  select 1 from public.financeiro f
  where f.vaga_id = l.vaga_id
    and f.observacoes = l.observacoes
);
