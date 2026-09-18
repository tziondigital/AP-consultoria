# Arquitetura — AP Consultoria RH

Next.js App Router no frontend/BFF; Supabase para Postgres, Auth, Storage e Edge Functions. RLS é a fronteira principal de autorização.

Perfis: admin, operador e cliente. O vínculo de cliente com empresa fica em `usuario_empresas`.

Modelo principal: `empresas -> vagas -> candidaturas <- candidatos`. Entrevistas referenciam candidatura, vaga e candidato; financeiro referencia vaga.

Segurança: RLS, helpers em schema privado, buckets privados, views `security_invoker` e auditoria.