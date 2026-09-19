"use client";
import {useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import {Mail,Lock,Eye,EyeOff,ArrowRight,Users,CalendarDays,Building2,BarChart3,ShieldCheck,Moon} from 'lucide-react';

function APLogo(){return <div className="login-logo" aria-label="AP Consultoria Recursos Humanos"><div className="ap-symbol"><span>A</span><span>P</span><i/></div><div className="ap-name">AP CONSULTORIA</div><div className="ap-rh"><b/> RECURSOS HUMANOS <b/></div></div>}

export default function LoginPage(){
 const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[msg,setMsg]=useState('');const[show,setShow]=useState(false);const[loading,setLoading]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setMsg('');setLoading(true);const s=createClient();const{error}=await s.auth.signInWithPassword({email,password});setLoading(false);if(error)return setMsg('E-mail ou senha inválidos.');location.href='/dashboard'}
 return <main className="login-page">
  <section className="login-showcase">
   <div className="showcase-overlay"/>
   <div className="showcase-content"><APLogo/>
    <div className="showcase-copy"><h1>Conectando<br/>pessoas a<br/><strong>grandes resultados</strong></h1><p>Soluções completas em Recursos Humanos<br/>para sua empresa crescer com as pessoas certas.</p>
     <div className="features">
      <div><i><Users/></i><span><b>Gestão de Vagas</b><small>Do recrutamento à contratação</small></span></div>
      <div><i><CalendarDays/></i><span><b>Entrevistas Organizadas</b><small>Mais agilidade no seu processo seletivo</small></span></div>
      <div><i><Building2/></i><span><b>Parceria com Empresas</b><small>Conectando talentos e oportunidades</small></span></div>
      <div><i><BarChart3/></i><span><b>Relatórios Inteligentes</b><small>Decisões baseadas em dados</small></span></div>
     </div>
    </div><div className="slogan">CONECTANDO TALENTOS,<br/>GERANDO VALOR.</div>
   </div>
  </section>
  <section className="login-panel">
   <div className="theme-label"><Moon size={17}/> Modo claro</div>
   <form onSubmit={submit} className="login-form"><APLogo/><h2>Bem-vindo(a)</h2><p>Faça login para acessar o sistema</p>
    <label>E-mail<div className="field"><Mail/><input type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/></div></label>
    <label>Senha<div className="field"><Lock/><input type={show?'text':'password'} placeholder="Digite sua senha" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" className="eye" onClick={()=>setShow(!show)} aria-label="Mostrar senha">{show?<EyeOff/>:<Eye/>}</button></div></label>
    <div className="login-options"><label className="remember"><input type="checkbox"/> Lembrar de mim</label><a href="#">Esqueceu sua senha?</a></div>
    {msg&&<div className="login-error">{msg}</div>}
    <button className="login-submit" disabled={loading}>{loading?'Entrando...':<>Entrar <ArrowRight size={20}/></>}</button>
    <div className="secure"><ShieldCheck size={16}/> Seus dados estão seguros e protegidos</div>
   </form>
  </section>
 </main>
}