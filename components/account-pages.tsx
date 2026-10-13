'use client';
import {useCallback,useEffect,useRef,useState,type FormEvent,type ReactNode} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowUpRight,Check,LoaderCircle,Plus,ShieldCheck,Trash2} from 'lucide-react';
import {useEagles} from '@/lib/store';
import {useTranslation,authError} from '@/lib/i18n';
import {supabase} from '@/lib/supabase';
import {loadPublicData,loadStudent} from '@/lib/data';
import {CATEGORIES,normalizeEmail,validPassword,validateClub} from '@/lib/validation';
import {PRESIDENT,LEADERSHIP,MINISTRIES} from '@/lib/government';
import {schoolDate} from '@/lib/school-date';
import type {Club,SchoolEvent,Shanyrak} from '@/lib/types';

function Action({busy=false,children,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&{busy?:boolean}) {
  return <button {...props} className={'button '+(props.className??'')} disabled={busy||props.disabled}>{busy?<LoaderCircle size={18} className="spin"/>:children}</button>;
}
function Heading({title,children}:{title:string;children?:ReactNode}){return <section className="page-intro account-intro"><p className="page-kicker">NIS Almaty-Nauryzbay</p><h1>{title}</h1>{children}</section>;}
function Gate({admin=false}:{admin?:boolean}) {
  const {t}=useTranslation();const {authReady,student,open}=useEagles();
  return <><Heading title={t(admin?'Control panel':'My profile')}/><section className="section account-shell"><div className="account-card"><p>{!authReady?t('Loading…'):t(student?'Admin access required.':'Please sign in with your verified school account.')}</p>{authReady&&!student&&<div className="account-actions"><Action onClick={()=>open('signin')}>{t('Sign in')}<ArrowUpRight size={17}/></Action><button className="text-link" onClick={()=>open('forgot')}>{t('Forgot your password?')}</button></div>}{student&&<Link className="text-link" href="/profile"><ArrowLeft size={16}/>{t('My profile')}</Link>}</div></section></>;
}
function operationError(error:unknown,t:(s:string)=>string) {
  const value=error as {message?:string;code?:string};
  if(value.code==='PGRST202'||value.code==='42703'||value.code==='42P01')return t('Database update required.');
  if(value.message==='transfer_owner_first')return t('Transfer ownership before deleting your account.');
  if(value.message==='last_admin')return t('The school needs at least one verified admin.');
  if(value.message?.includes('access_required'))return t('Admin access required.');
  if(value.message?.includes('verified_'))return t('Account verification is required.');
  return t('Could not save changes.');
}

export function ProfilePage(){
  const {t,language}=useTranslation();const {student,authReady,open,notify}=useEagles();
  const [name,setName]=useState('');const [current,setCurrent]=useState('');const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');
  const [deleting,setDeleting]=useState(false);const [email,setEmail]=useState('');const [deletePassword,setDeletePassword]=useState('');
  const [busy,setBusy]=useState<string|null>(null);const [error,setError]=useState<{area:string;text:string}|null>(null);
  useEffect(()=>{setName(student?.name??'');},[student?.name]);
  if(!authReady||!student)return <Gate/>;
  const account=student;
  async function changeName(e:FormEvent){
    e.preventDefault();if(!supabase||busy)return;setError(null);setBusy('name');
    try{const result=await supabase.rpc('set_my_name',{p_name:name.trim()});if(result.error)throw result.error;await loadStudent(account.id,account.email);notify('Saved.');}
    catch(err){setError({area:'name',text:operationError(err,t)});}finally{setBusy(null);}
  }
  async function changePassword(e:FormEvent){
    e.preventDefault();if(!supabase||busy)return;setError(null);
    if(!validPassword(password)){setError({area:'password',text:t('Use a password with 10–128 characters.')});return;}
    if(password!==confirm){setError({area:'password',text:t('Passwords do not match.')});return;}
    if(password===current){setError({area:'password',text:t('Choose a different password.')});return;}
    setBusy('password');
    try{const check=await supabase.auth.signInWithPassword({email:account.email,password:current});if(check.error)throw check.error;
      const result=await supabase.auth.updateUser({password});if(result.error)throw result.error;
      setCurrent('');setPassword('');setConfirm('');notify('Your password has been updated.');
    }catch(err){setError({area:'password',text:authError(err,language)});}finally{setBusy(null);}
  }
  async function deleteAccount(e:FormEvent){
    e.preventDefault();if(!supabase||busy||normalizeEmail(email)!==normalizeEmail(account.email))return;setError(null);setBusy('delete');
    try{const check=await supabase.auth.signInWithPassword({email:account.email,password:deletePassword});if(check.error)throw check.error;
      const result=await supabase.rpc('delete_my_account',{p_confirmation:normalizeEmail(email)});if(result.error)throw result.error;
      await supabase.auth.signOut({scope:'local'});useEagles.getState().set({student:null,memberships:[],showMyClubs:false});await loadPublicData();notify('Account deleted.');
    }catch(err){setError({area:'delete',text:(err as {code?:string}).code==='invalid_credentials'?authError(err,language):operationError(err,t)});}finally{setBusy(null);setDeletePassword('');}
  }
  const feedback=(area:string)=>error?.area===area?<p className="form-error" role="alert">{error.text}</p>:null;
  return <><Heading title={t('My profile')}><p>{t('Your account, your settings.')}</p></Heading><section className="section account-shell">
    <div className="profile-banner"><span className="avatar">{account.name.slice(0,1)}</span><div><h2>{account.name}</h2><p>{account.email}</p></div>{account.isAdmin&&<Link href="/admin" className="button"><ShieldCheck size={18}/>{t('Admin')}<ArrowUpRight size={16}/></Link>}</div>
    <div className="profile-grid"><section className="account-card"><h2>{t('Your name')}</h2><form className="form" onSubmit={changeName}><label>{t('Your name')}<input required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label><p className="field-hint">{t('School email')}: {account.email}</p>{feedback('name')}<Action busy={busy==='name'} disabled={!!busy||name.trim()===account.name} type="submit">{t('Save changes')}<Check size={17}/></Action></form></section>
    <section className="account-card"><h2>{t('Change password')}</h2><form className="form" onSubmit={changePassword}><label>{t('Current password')}<input required type="password" maxLength={128} autoComplete="current-password" value={current} onChange={e=>setCurrent(e.target.value)}/></label><label>{t('New password')}<input required type="password" minLength={10} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>{t('Confirm new password')}<input required type="password" minLength={10} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>{feedback('password')}<Action type="submit" busy={busy==='password'} disabled={!!busy}>{t('Update password')}</Action><button type="button" className="text-link" onClick={()=>open('forgot')}>{t('Forgot your password?')}</button></form></section></div>
    <section className="account-card account-danger"><h2>{t('Delete account')}</h2><p>{t('This permanently deletes your account, your clubs, and your memberships.')}</p>{account.isOwner?<p className="field-hint">{t('Transfer ownership before deleting your account.')}</p>:deleting?<form className="form" onSubmit={deleteAccount}><label>{t('Type your school email to confirm.')}<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="off"/></label><label>{t('Current password')}<input required type="password" autoComplete="current-password" maxLength={128} value={deletePassword} onChange={e=>setDeletePassword(e.target.value)}/></label>{feedback('delete')}<div className="account-actions"><Action className="delete-button" type="submit" busy={busy==='delete'} disabled={!!busy||normalizeEmail(email)!==normalizeEmail(account.email)}>{t('Confirm permanent deletion.')}<Trash2 size={17}/></Action><button className="text-link" type="button" disabled={!!busy} onClick={()=>{setDeleting(false);setDeletePassword('');setEmail('');setError(null);}}>{t('Cancel')}</button></div></form>:<button className="text-link danger-text" onClick={()=>setDeleting(true)}>{t('Delete account')}<Trash2 size={16}/></button>}</section>
  </section></>;
}

type Person={id:string;name:string;email:string;is_admin:boolean;is_owner:boolean;confirmed:boolean};
type Tab='Events'|'Клубы'|'Shanyraks'|'Самоуправление'|'People';
type Editor={kind:'Events';row:SchoolEvent|null}|{kind:'Клубы';row:Club|null}|{kind:'Shanyraks';row:Shanyrak|null}|{kind:'Самоуправление';row:{id:string;name:string|null;role:string}};
type Confirmation={title:string;detail:string;action:()=>Promise<void>};
const team=[{id:'president',...PRESIDENT},...LEADERSHIP.map((x,i)=>({...x,id:['vice','speaker','secretary'][i]})),...MINISTRIES];
function localDate(value:string){return new Date(new Date(value).getTime()+5*3600000).toISOString().slice(0,16);}

export function AdminPage(){
  const {t,language}=useTranslation();const {student,authReady,notify}=useEagles();
  const [tab,setTab]=useState<Tab>('Events');const [events,setEvents]=useState<SchoolEvent[]>([]);const [clubs,setClubs]=useState<Club[]>([]);const [shanyraks,setShanyraks]=useState<Shanyrak[]>([]);const [people,setPeople]=useState<Person[]>([]);const [names,setNames]=useState<Record<string,string|null>>({});
  const [query,setQuery]=useState('');const [editor,setEditor]=useState<Editor|null>(null);const [confirm,setConfirm]=useState<Confirmation|null>(null);const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
  const generation=useRef(0);const editorRef=useRef<HTMLElement>(null);const confirmationRef=useRef<HTMLElement>(null);
  const load=useCallback(async()=>{
    if(!supabase||!student?.isAdmin)return;const request=++generation.current;setLoading(true);setError('');
    try{
      const result=tab==='Events'?await supabase.from('events').select('*').order('starts_at',{ascending:false}):tab==='Клубы'?await supabase.from('clubs').select('*').order('created_at',{ascending:false}):tab==='Shanyraks'?await supabase.from('shanyraks').select('*').order('id'):tab==='Самоуправление'?await supabase.from('government_members').select('*'):await supabase.rpc('admin_list_students',{p_search:query.trim()});
      if(request!==generation.current)return;if(result.error)throw result.error;
      if(tab==='Events')setEvents(result.data??[]);else if(tab==='Клубы')setClubs(result.data??[]);else if(tab==='Shanyraks')setShanyraks(result.data??[]);else if(tab==='People')setPeople(result.data??[]);else setNames(Object.fromEntries((result.data??[]).map((x:{id:string;name:string|null})=>[x.id,x.name])));
    }catch(err){if(request===generation.current)setError(operationError(err,t));}finally{if(request===generation.current)setLoading(false);}
  },[tab,query,student?.isAdmin,t]);
  // t is stable only within a render; use an effect keyed by actual inputs to avoid fetch loops.
  const latestLoad=useRef(load);latestLoad.current=load;
  useEffect(()=>{setLoading(true);const timer=setTimeout(()=>void latestLoad.current(),tab==='People'?250:0);return()=>{clearTimeout(timer);generation.current++;};},[tab,query,student?.id,student?.isAdmin]);
  useEffect(()=>{if(editor){editorRef.current?.focus();editorRef.current?.scrollIntoView({behavior:'smooth',block:'start'});}},[editor]);
  useEffect(()=>{if(confirm){confirmationRef.current?.focus();confirmationRef.current?.scrollIntoView({behavior:'smooth',block:'center'});}},[confirm]);
  if(!authReady||!student?.isAdmin)return <Gate admin/>;
  const account=student;
  async function mutate(action:()=>Promise<void>){if(busy||!supabase)return;setBusy(true);setError('');try{await action();setConfirm(null);setEditor(null);notify('Saved.');await loadPublicData();await latestLoad.current();await loadStudent(account.id,account.email);}catch(err){setError(operationError(err,t));}finally{setBusy(false);}}
  function check(result:{error:unknown;data?:unknown}){if(result.error)throw result.error;if(Array.isArray(result.data)&&result.data.length===0)throw {message:'admin_access_required'};}
  async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!editor||!supabase)return;const form=new FormData(e.currentTarget);const text=(key:string)=>String(form.get(key)??'').trim();const edit=editor;
    if(edit.kind==='Клубы'){const validation=validateClub({name:text('name'),description:text('description'),category:text('category'),meeting:text('meeting')});if(validation){setError(t(validation));return;}}
    if(edit.kind==='Events'){const date=new Date(text('starts_at')+':00+05:00');if(!Number.isFinite(date.getTime())||(!edit.row&&date.getTime()<=Date.now())){setError(t('Choose a future date and time.'));return;}}
    await mutate(async()=>{
      if(!supabase)return;
      if(edit.kind==='Events'){const value={title:text('title'),description:text('description'),location:text('location'),starts_at:new Date(text('starts_at')+':00+05:00').toISOString(),published:form.has('published')};check(await (edit.row?supabase.from('events').update(value).eq('id',edit.row.id):supabase.from('events').insert(value)).select('id'));}
      else if(edit.kind==='Клубы'){const value={name:text('name'),description:text('description'),category:text('category'),meeting:text('meeting')};check(await (edit.row?supabase.from('clubs').update(value).eq('id',edit.row.id):supabase.from('clubs').insert({...value,owner_id:account.id})).select('id'));}
      else if(edit.kind==='Shanyraks'){const points=Number(text('points'));if(!Number.isInteger(points)||points<0||points>2147483647)throw Error('invalid_points');const value={name:text('name'),points,leader_name:text('leader_name')||null,active:form.has('active')};check(await (edit.row?supabase.from('shanyraks').update(value).eq('id',edit.row.id):supabase.from('shanyraks').insert(value)).select('id'));}
      else check(await supabase.from('government_members').update({name:text('name')||null}).eq('id',edit.row.id).select('id'));
    });
  }
  const remove=(table:'events'|'clubs',row:{id:string;title?:string;name?:string})=>setConfirm({title:t('Confirm permanent deletion.'),detail:row.title??row.name??'',action:async()=>{check(await supabase!.from(table).delete().eq('id',row.id).select('id'));}});
  const entry=(title:string,detail:string,buttons:ReactNode,badge?:string)=><><div className="admin-entry-copy"><h3>{title}</h3><p>{detail}</p>{badge&&<span className="admin-badge">{badge}</span>}</div><div className="admin-entry-actions">{buttons}</div></>;
  return <><Heading title={t('Control panel')}><p>{t('Manage school news, people, and communities.')}</p></Heading><section className="section account-shell admin-shell"><Link href="/profile" className="text-link"><ArrowLeft size={16}/>{t('My profile')}</Link>
    <div className="admin-tabs" role="group" aria-label={t('Administration')}>{(['Events','Клубы','Shanyraks','Самоуправление','People'] as Tab[]).map(item=><button className={'filter '+(tab===item?'active':'')} aria-pressed={tab===item} key={item} disabled={busy} onClick={()=>{setTab(item);setEditor(null);setConfirm(null);setError('');}}>{t(item)}</button>)}</div>
    <div className="admin-toolbar"><h2>{t(tab)}</h2><div className="account-actions">{['Events','Клубы','Shanyraks'].includes(tab)&&<Action disabled={busy} onClick={()=>{setError('');setConfirm(null);setEditor({kind:tab,row:null} as Editor);}}><Plus size={17}/>{t(tab==='Events'?'Add event':tab==='Клубы'?'Start a club':'Add Shanyrak')}</Action>}<button className="text-link" disabled={busy||loading} onClick={()=>void load()}>{t('Refresh')}</button></div></div>
    {tab==='People'&&<><label className="admin-search"><span className="sr-only">{t('Search people')}</span><input type="search" placeholder={t('Search people')} value={query} onChange={e=>setQuery(e.target.value)}/></label><p className="field-hint admin-help">{t('Results are limited to 100. Search by name or email.')} {t('Only verified school accounts can become admins.')}</p></>}
    {editor&&<section className="account-card admin-editor" tabIndex={-1} ref={editorRef}><div className="admin-toolbar"><h2>{t(editor.row?'Edit':'Create')}{editor.kind==='Самоуправление'?' · '+t(editor.row.role):''}</h2><button className="text-link" disabled={busy} onClick={()=>{setEditor(null);setError('');}}>{t('Cancel')}</button></div><form className="form" onSubmit={save} key={editor.kind+JSON.stringify(editor.row)}>
      {editor.kind==='Events'?<><label>{t('Event title')}<input name="title" required minLength={3} maxLength={100} defaultValue={editor.row?.title}/></label><label>{t('Date')} · {t('Time')}<input name="starts_at" type="datetime-local" required defaultValue={editor.row?localDate(editor.row.starts_at):''}/><span className="field-hint">{t('All times are in Almaty (UTC+5).')}</span></label><label>{t('Location')}<input name="location" required minLength={2} maxLength={100} defaultValue={editor.row?.location}/></label><label>{t('Details')}<textarea name="description" rows={4} required minLength={10} maxLength={1000} defaultValue={editor.row?.description}/></label><label className="check-label"><input name="published" type="checkbox" defaultChecked={editor.row?.published??true}/>{t('Show on the website')}</label></>:editor.kind==='Клубы'?<><label>{t('Club name')}<input name="name" required minLength={3} maxLength={60} defaultValue={editor.row?.name}/></label><label>{t('Category')}<select name="category" defaultValue={editor.row?.category??'Academic'}>{CATEGORIES.map(x=><option key={x} value={x}>{t(x)}</option>)}</select></label><label>{t('What’s your club about?')}<textarea name="description" required minLength={20} maxLength={500} rows={4} defaultValue={editor.row?.description}/></label><label>{t('When & where')}<input name="meeting" required minLength={3} maxLength={100} defaultValue={editor.row?.meeting}/></label></>:editor.kind==='Shanyraks'?<><label>{t('Name')}<input name="name" required minLength={2} maxLength={60} defaultValue={editor.row?.name}/></label><label>{t('Leader')}<input name="leader_name" minLength={2} maxLength={100} defaultValue={editor.row?.leader_name??''}/></label><label>{t('Points')}<input name="points" type="number" required min={0} max={2147483647} step={1} defaultValue={editor.row?.points??0}/></label><label className="check-label"><input name="active" type="checkbox" defaultChecked={editor.row?.active??true}/>{t('Show on the website')}</label></>:<label>{t('Name')}<input name="name" minLength={2} maxLength={100} defaultValue={editor.row.name??''}/></label>}
      {error&&<p className="form-error" role="alert">{error}</p>}<Action type="submit" busy={busy}>{t('Save changes')}<Check size={17}/></Action>
    </form></section>}
    {confirm&&<section className="account-card confirmation-card" tabIndex={-1} ref={confirmationRef}><h2>{confirm.title}</h2><p>{confirm.detail}</p>{tab==='People'&&<p>{t('Admins can edit school content and manage other admins.')}</p>}{error&&<p className="form-error" role="alert">{error}</p>}<div className="account-actions"><Action busy={busy} onClick={()=>void mutate(confirm.action)}>{t('Confirm')}</Action><button className="text-link" disabled={busy} onClick={()=>{setConfirm(null);setError('');}}>{t('Cancel')}</button></div></section>}
    {error&&!editor&&!confirm&&<p className="form-error" role="alert">{error}</p>}{loading?<p className="loading-data" role="status"><LoaderCircle className="spin" size={17}/>{t('Loading…')}</p>:<div className="admin-list">
    {tab==='Events'&&events.map(row=><article className="admin-entry" key={row.id}>{entry(row.title,schoolDate(row.starts_at,language)+' · '+row.location,<><button className="text-link" disabled={busy} onClick={()=>{setConfirm(null);setError('');setEditor({kind:'Events',row});}}>{t('Edit')}</button><button className="text-link danger-text" disabled={busy} onClick={()=>{setEditor(null);remove('events',row);}}>{t('Delete')}</button></>,t(row.published?'Published':'Draft'))}</article>)}
    {tab==='Клубы'&&clubs.map(row=><article className="admin-entry" key={row.id}>{entry(row.name,row.meeting,<><button className="text-link" disabled={busy} onClick={()=>{setConfirm(null);setError('');setEditor({kind:'Клубы',row});}}>{t('Edit')}</button><button className="text-link danger-text" disabled={busy} onClick={()=>{setEditor(null);remove('clubs',row);}}>{t('Delete')}</button></>,t(row.category))}</article>)}
    {tab==='Shanyraks'&&shanyraks.map(row=><article className="admin-entry" key={row.id}>{entry(row.name,(row.leader_name?row.leader_name+' · ':'')+t('Points')+': '+row.points,<><button className="text-link" disabled={busy} onClick={()=>{setConfirm(null);setError('');setEditor({kind:'Shanyraks',row});}}>{t('Edit')}</button><button className="text-link" disabled={busy} onClick={()=>{setEditor(null);setConfirm({title:t(row.active?'Archive':'Restore'),detail:row.name,action:async()=>{check(await supabase!.from('shanyraks').update({active:!row.active}).eq('id',row.id).select('id'));}});}}>{t(row.active?'Archive':'Restore')}</button></>,t(row.active?'Active':'Archived'))}</article>)}
    {tab==='Самоуправление'&&team.map(row=><article className="admin-entry" key={row.id}>{entry(names[row.id]??'',t(row.role),<button className="text-link" disabled={busy} onClick={()=>{setConfirm(null);setError('');setEditor({kind:'Самоуправление',row:{...row,name:names[row.id]??null}});}}>{t('Edit')}</button>)}</article>)}
    {tab==='People'&&people.map(row=><article className="admin-entry" key={row.id}>{entry(row.name,row.email,<>{row.id===account.id?<span className="admin-badge">{t('You')}</span>:!row.is_owner&&row.confirmed&&<button className="text-link" disabled={busy} onClick={()=>{setEditor(null);setError('');setConfirm({title:t(row.is_admin?'Revoke admin':'Grant admin'),detail:row.name+' · '+row.email,action:async()=>{check(await supabase!.rpc('admin_set_role',{p_id:row.id,p_admin:!row.is_admin}));}});}}>{t(row.is_admin?'Revoke admin':'Grant admin')}</button>}{account.isOwner&&row.is_admin&&row.confirmed&&row.id!==account.id&&<button className="text-link" disabled={busy} onClick={()=>{setError('');setConfirm({title:t('Transfer ownership'),detail:row.name+' · '+row.email+' — '+t('The new owner can manage access and transfer ownership.'),action:async()=>{check(await supabase!.rpc('transfer_school_owner',{p_id:row.id}));}});}}>{t('Transfer ownership')}</button>}</>,t(!row.confirmed?'Not verified':row.is_owner?'School owner':row.is_admin?'Admin':'Student'))}</article>)}
    {((tab==='Events'&&!events.length)||(tab==='Клубы'&&!clubs.length)||(tab==='Shanyraks'&&!shanyraks.length)||(tab==='People'&&!people.length))&&!error&&<p className="admin-empty">{t('No entries yet.')}</p>}
    </div>}
  </section></>;
}
