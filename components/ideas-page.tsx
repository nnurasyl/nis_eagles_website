'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {Lightbulb,ArrowUpRight,LoaderCircle} from 'lucide-react';
import {useEagles} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {supabase} from '@/lib/supabase';
import {schoolDate} from '@/lib/school-date';
import {ideaError,ideaStatus,validIdea,type Idea} from '@/lib/ideas';

export function IdeasPage(){
  const {t,language}=useTranslation(); const {student,authReady,open,notify}=useEagles();
  const [title,setTitle]=useState('');const [body,setBody]=useState('');const [ideas,setIdeas]=useState<Idea[]>([]);
  const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
  const userId=student?.id;
  const load=useCallback(async()=>{
    if(!supabase||!userId)return;
    const result=await supabase.from('ideas').select('id,title,body,status,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(100);
    if(result.error)throw result.error;return result.data as Idea[];
  },[userId]);
  useEffect(()=>{let active=true;setIdeas([]);setTitle('');setBody('');setError('');if(!userId)return;setLoading(true);load().then(rows=>{if(active)setIdeas(rows??[]);}).catch(err=>{if(active)setError(ideaError(err));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[load,userId]);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy||!supabase||!userId)return;setError('');
    if(!validIdea(title,body)){setError('Write a title with 3–100 characters and a suggestion with 10–2000 characters.');return;}
    setBusy(true);try{const result=await supabase.rpc('submit_idea',{p_title:title.trim(),p_body:body.trim()});if(result.error)throw result.error;if(useEagles.getState().student?.id!==userId)return;setTitle('');setBody('');notify('Idea sent.');const rows=await load();if(useEagles.getState().student?.id===userId)setIdeas(rows??[]);}catch(err){setError(ideaError(err));}finally{setBusy(false);}
  }
  return <><section className="page-intro ideas-intro"><span className="ideas-symbol" aria-hidden="true"><Lightbulb size={28}/></span><h1>{t('Idea box')}</h1><p>{t('Suggest a change, share an opinion, or bring a new idea.')}</p></section><section className="section account-shell ideas-shell">
    {!authReady?<p className="loading-data" role="status">{t('Loading…')}</p>:!student?<div className="account-card ideas-gate"><h2>{t('What would make our school better?')}</h2><p>{t('Sign in to share an idea.')}</p><button className="button" onClick={()=>open('signin')}>{t('Sign in')}<ArrowUpRight size={17}/></button></div>:<div className="ideas-grid"><section className="account-card"><h2>{t('What would make our school better?')}</h2><form className="form" onSubmit={submit}><label>{t('Idea title')}<input required minLength={3} maxLength={100} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>{t('Your suggestion')}<textarea required minLength={10} maxLength={2000} rows={7} value={body} onChange={e=>setBody(e.target.value)}/></label><p className="field-hint">{t('Only you and the administrators can read your ideas.')}</p>{error&&<p className="form-error" role="alert">{t(error)}</p>}<button className="button" disabled={busy} type="submit">{busy?<LoaderCircle className="spin" size={17}/>:<>{t('Send an idea')}<ArrowUpRight size={17}/></>}</button></form></section><section className="ideas-history"><div className="admin-toolbar"><h2>{t('My ideas')}</h2></div>{loading?<p role="status">{t('Loading…')}</p>:ideas.length?<div className="admin-list">{ideas.map(idea=><article className="idea-card" key={idea.id}><div className="idea-meta"><span className={'admin-badge idea-status-'+idea.status}>{t(ideaStatus(idea.status))}</span><time dateTime={idea.created_at}>{schoolDate(idea.created_at,language)}</time></div><h3>{idea.title}</h3><p className="idea-body">{idea.body}</p></article>)}</div>:<p className="admin-empty">{t('No ideas yet.')}</p>}</section></div>}
  </section></>;
}
