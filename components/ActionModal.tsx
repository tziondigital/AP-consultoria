'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {Eye,Pencil,X} from 'lucide-react';

type Kind='view'|'edit';
export function ActionModal({kind,title,children}:{kind:Kind;title:string;children:ReactNode}){
 const [open,setOpen]=useState(false);
 useEffect(()=>{if(!open)return;const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('keydown',esc);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',esc);document.body.style.overflow=''}},[open]);
 const Icon=kind==='edit'?Pencil:Eye;
 return <><button type="button" className="icon-button" title={kind==='edit'?'Editar':'Visualizar'} aria-label={(kind==='edit'?'Editar ':'Visualizar ')+title} onClick={()=>setOpen(true)}><Icon size={14}/></button>
 {open&&<div className="record-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
  <section className="record-modal" role="dialog" aria-modal="true" aria-label={title}>
   <header className="record-modal-head"><div><b>{kind==='edit'?'Editar':'Visualizar'} — {title}</b><span>{kind==='edit'?'Atualize as informações e salve as alterações.':'Informações completas do registro.'}</span></div><button type="button" className="icon-button" onClick={()=>setOpen(false)} aria-label="Fechar"><X size={18}/></button></header>
   <div className="record-modal-body">{children}</div>
   <footer className="record-modal-footer"><button type="button" className="modal-cancel-button" onClick={()=>setOpen(false)}>Cancelar</button></footer>
  </section>
 </div>}</>
}
