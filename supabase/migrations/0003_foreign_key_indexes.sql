create index if not exists idx_candidatos_criado_por on public.candidatos(criado_por);
create index if not exists idx_candidaturas_atualizado_por on public.candidaturas(atualizado_por);
create index if not exists idx_entrevistas_candidato_id on public.entrevistas(candidato_id);
create index if not exists idx_entrevistas_candidatura_id on public.entrevistas(candidatura_id);
create index if not exists idx_entrevistas_criado_por on public.entrevistas(criado_por);
create index if not exists idx_notificacoes_empresa_id on public.notificacoes(empresa_id);
create index if not exists idx_usuario_empresas_empresa_id on public.usuario_empresas(empresa_id);
create index if not exists idx_vagas_criado_por on public.vagas(criado_por);