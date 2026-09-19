# AP Consultoria — Sistema de Recrutamento e Seleção

**Conectando talentos, gerando valor.**

Aplicação corporativa para gestão de vagas, banco de talentos, processos seletivos, entrevistas, avaliações, clientes, financeiro e indicadores.

## Stack
Next.js 16, React 19, TypeScript, Supabase (Auth/Postgres/RLS), Vercel e GitHub Actions.

## Perfis
- **Administrador:** gestão geral, usuários, empresas, financeiro e relatórios.
- **Operador:** candidatos, processos, entrevistas e avaliações.
- **Cliente:** vagas e acompanhamento dos processos vinculados à sua empresa.

## Módulos
Dashboard, Vagas, Banco de Talentos, Processos Seletivos, Kanban, Entrevistas, Avaliações, Empresas, Financeiro, Relatórios e Usuários.

## Ambiente
Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Nunca versionar chaves secretas.

## Desenvolvimento
`npm install` → `npm run dev`

## Validação
`npm run typecheck` e `npm run build`

## Deploy
O projeto está integrado ao Vercel. A branch de homologação gera Preview; produção deve ser promovida somente após validação dos fluxos e build.

## Segurança
Autenticação via Supabase Auth e autorização por RLS. O frontend não deve usar service-role key.
