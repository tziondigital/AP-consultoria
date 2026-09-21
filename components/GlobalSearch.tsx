'use client';import {Search} from 'lucide-react';
export function GlobalSearch(){return <form className="global-search" action="/busca"><Search size={16}/><input name="q" placeholder="Buscar vagas, candidatos, empresas..." aria-label="Busca global"/></form>}
