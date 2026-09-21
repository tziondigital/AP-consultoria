'use client';
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {Eye,Pencil,X} from 'lucide-react';

type Kind='view'|'edit';
export function ActionModal({kind,title,children,triggerLabel}:{kind:Kind;title:string;children:ReactNode;triggerLabel?:string}){
 const [open,setOpen]=useState(false);
 const titleId=useId(),panelRef=useRef<HTMLElement>(null),triggerRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement|null;const trigger=triggerRef.current;const panel=panelRef.current;panel?.querySelector<HTMLElement>('button,input,select,textarea,a[href]')?.focus();const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);return}if(e.key!=='Tab'||!panel)return;const focusable=[...panel.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')];if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}};document.addEventListener('keydown',onKey);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow='';(previous||trigger)?.focus()}},[open]);
 const Icon=kind==='edit'?Pencil:Eye;
 return <><button ref={triggerRef} type="button" className={`icon-button${triggerLabel?' text-trigger':''}`} title={kind==='edit'?'Editar':'Visualizar'} aria-label={(kind==='edit'?'Editar ':'Visualizar ')+title} onClick={()=>setOpen(true)}>{triggerLabel?<span>{triggerLabel}</span>:<Icon size={14}/>}</button>
 {open&&<div className="record-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
  <section ref={panelRef} className="record-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
   <header className="record-modal-head"><div><b id={titleId}>{kind==='edit'?'Editar':'Visualizar'} — {title}</b><span>{kind==='edit'?'Atualize as informações e salve as alterações.':'Informações completas do registro.'}</span></div><button type="button" className="icon-button" onClick={()=>setOpen(false)} aria-label="Fechar"><X size={18}/></button></header>
   <div className="record-modal-body">{children}</div>
   <footer className="record-modal-footer"><button type="button" className="modal-cancel-button" onClick={()=>setOpen(false)}>{kind==='edit'?'Cancelar':'Fechar'}</button></footer>
  </section>
 </div>}</>
}
