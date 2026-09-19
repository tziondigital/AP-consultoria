export const STATUS_LABELS:Record<string,string>={
rascunho:'Rascunho',em_andamento:'Em andamento',congelada:'Congelada',completada:'Concluída',cancelada:'Cancelada',
novo:'Novo',triagem:'Triagem',entrevista:'Entrevista',aprovado:'Aprovado',reprovado:'Reprovado',desistiu:'Desistiu',contratado:'Contratado',
agendada:'Agendada',confirmada:'Confirmada',realizada:'Realizada',nao_compareceu:'Não compareceu',
pendente:'Pendente',parcial:'Parcial',pago:'Pago',vencido:'Vencido',
admin:'Administrador',cliente:'Cliente',operador:'Operador',disponivel:'Disponível',empregado:'Empregado'
};
export function label(value?:string|null){if(!value)return '—';const key=String(value).trim().toLowerCase();return STATUS_LABELS[key]||key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
export function badgeClass(value?:string|null){const v=String(value||'').toLowerCase();if(['pago','aprovado','contratado','completada','realizada','confirmada','ativo','ativa'].includes(v))return 'green';if(['cancelada','cancelado','reprovado','vencido','nao_compareceu'].includes(v))return 'red';if(['congelada','rascunho','desistiu','inativo','inativa'].includes(v))return 'gray';return 'blue'}
