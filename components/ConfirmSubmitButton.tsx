'use client';
import {useState} from 'react';
import {Trash2} from 'lucide-react';
export function ConfirmSubmitButton({title='Excluir registro',message='Esta ação não pode ser desfeita.'}:{title?:string;message?:string}){
 const [open,setOpen]=useState(false);
 return <><button type="button" className="icon-button" title="Excluir" aria-label="Excluir" onClick={()=>setOpen(true)}><Trash2 size={14}/></button>{open&&<div className="record-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><section className="record-modal confirm-modal" role="dialog" aria-modal="true" aria-label={title}><header className="record-modal-head"><div><b>{title}</b><span>Confirme antes de continuar.</span></div></header><div className="record-modal-body"><p>{message}</p></div><footer className="record-modal-footer"><button type="button" className="modal-cancel-button" onClick={()=>setOpen(false)}>Cancelar</button><button type="button" className="danger-button" onClick={e=>{const form=e.currentTarget.closest('form');setOpen(false);form?.requestSubmit()}}>Confirmar exclusão</button></footer></section></div>}</>;
}
