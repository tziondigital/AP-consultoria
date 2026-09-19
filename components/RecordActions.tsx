'use client';
import {useState} from 'react';
import {Pencil,Trash2,X} from 'lucide-react';

export function EditModal({title,action,children}:{title:string;action:(formData:FormData)=>void|Promise<void>;children:React.ReactNode}){
  const [open,setOpen]=useState(false);
  return <>
    <button type="button" className="icon-action" title="Editar" aria-label={'Editar '+title} onClick={()=>setOpen(true)}><Pencil size={15}/></button>
    {open&&<div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-card">
        <div className="modal-head"><div><b>{title}</b><span>Atualize as informações do registro.</span></div><button type="button" className="icon-action" onClick={()=>setOpen(false)} aria-label="Fechar"><X size={17}/></button></div>
        <form action={action} className="modal-form">{children}<div className="modal-actions"><button type="button" className="small-button" onClick={()=>setOpen(false)}>Cancelar</button><button className="button">Salvar alterações</button></div></form>
      </div>
    </div>}
  </>
}

export function DeleteButton({id,action,label='registro'}:{id:string;action:(formData:FormData)=>void|Promise<void>;label?:string}){
  return <form action={action} onSubmit={e=>{if(!confirm('Excluir este '+label+'? Esta ação não pode ser desfeita.'))e.preventDefault()}}>
    <input type="hidden" name="id" value={id}/>
    <button className="icon-action danger-icon" title="Excluir" aria-label={'Excluir '+label}><Trash2 size={15}/></button>
  </form>
}
