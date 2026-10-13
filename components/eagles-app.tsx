'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { ArrowUpRight, ArrowRight, Plus, X, Menu, Search, ChevronDown, Check, Trophy, Users, CalendarDays, MapPin, Sparkles, LogOut, LoaderCircle, Eye, EyeOff, Code2, Mic2, Palette, Heart, MoveUpRight, Mail, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Globe2, Newspaper, GraduationCap, Shield, Leaf, Wallet, Crown} from 'lucide-react';
import {PRESIDENT as INITIAL_PRESIDENT, LEADERSHIP as INITIAL_LEADERSHIP, MINISTRIES as INITIAL_MINISTRIES} from '@/lib/government';
import {SHANYRAK_LEADERS} from '@/lib/shanyrak-leaders';
import { useEagles } from '@/lib/store';
import {useTranslation, useLanguage, isLanguage, LANGUAGE_NAMES, authError, translate, LOCALES, memberCount, shanyrakCount, type Language} from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { loadPublicData, loadStudent, joinClub } from '@/lib/data';
import { CATEGORIES, isValidEmail, normalizePhone, validContactPhone, normalizeEmail, validateClub, validPassword } from '@/lib/validation';
import type { Club, SchoolEvent } from '@/lib/types';
import {ProfilePage,AdminPage} from './account-pages';
import {IdeasPage} from './ideas-page';
import {schoolDate,schoolMonth,schoolDay,schoolTime} from '@/lib/school-date';

const fade = {initial: {opacity: 1, y: 12}, whileInView: {opacity: 1, y: 0}, viewport: {once: true, amount: 0.08}, transition: {duration: 0.55}};
const categoryIcons = {Creative: Palette, Academic: Mic2, Technology: Code2, Sports: Trophy, Community: Heart};
const categoryColors = {Creative: 'peach', Academic: 'lilac', Technology: 'sky', Sports: 'mint', Community: 'butter'};
let activeDialogs = 0;
let bodyOverflowBeforeDialogs = '';

function Eagle({className = ''}: {className?: string}) {
  return <img className={clsx("eagles-logo", className)} src="/eagles.jpeg" alt="" aria-hidden="true" width={40} height={40}/>;
}
function Button({children, className, ...props}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={clsx('button', className)} {...props}>{children}</button>;
}
function SectionLabel({children, light = false}: {children: ReactNode; light?: boolean}) {return <div className={clsx('eyebrow', light && 'eyebrow-light')}><span className="tiny-square"/>{children}</div>;}

function LanguageSwitcher() {
  const {language, setLanguage} = useLanguage();
  return <label className="language-switcher"><span className="sr-only">Тіл / Язык / Language</span><select aria-label="Тіл / Язык / Language" value={language} onChange={event=>{if(isLanguage(event.target.value))setLanguage(event.target.value);}} title={LANGUAGE_NAMES[language]}>
    <option value="kk" lang="kk">ҚАЗ</option><option value="ru" lang="ru">РУС</option><option value="en" lang="en">ENG</option>
  </select><ChevronDown size={12} aria-hidden="true"/></label>;
}

function Modal({title, subtitle, children, onClose}: {title: string; subtitle?: string; children: ReactNode; onClose: () => void}) {
  const {t, language, locale} = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    if (activeDialogs === 0) bodyOverflowBeforeDialogs = document.body.style.overflow;
    activeDialogs += 1;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const items = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {event.preventDefault(); last.focus();}
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) {event.preventDefault(); first.focus();}
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      activeDialogs = Math.max(0, activeDialogs - 1);
      if (activeDialogs === 0) {document.body.style.overflow = bodyOverflowBeforeDialogs; previous?.focus({preventScroll: true});}
      document.removeEventListener('keydown', keyboard);
    };
  }, []);
  return <motion.div className="modal-backdrop" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0, pointerEvents: 'none'}} onMouseDown={(e) => {if(e.target === e.currentTarget) onClose();}}>
    <motion.div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref} tabIndex={-1} initial={{opacity: 0, y: 24, scale: 0.98}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: 12}}>
      <button className="icon-button modal-close" aria-label={t("Close dialog")} onClick={onClose}><X size={22}/></button>
      <Eagle className="modal-eagle"/>
      <h2 id="modal-title">{title}</h2>{subtitle && <p className="modal-subtitle">{subtitle}</p>}{children}
    </motion.div>
  </motion.div>;
}

function AuthDialog({mode}:{mode:'signin'|'signup'|'forgot'|'reset'}) {
  const {t, language, locale} = useTranslation();
  const {open, notify} = useEagles();
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [password, setPassword] = useState('');
  const [phone,setPhone]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [sent, setSent] = useState(false);
  const signup = mode === 'signup', forgot = mode === 'forgot', reset = mode === 'reset';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!reset && !isValidEmail(email)) {setError('Please enter a valid email address.'); return;}
    if (signup && (name.trim().length < 2 || name.trim().length > 60)) {setError('Please enter your name in 2–60 characters.'); return;}
    if (signup && !validContactPhone(phone)) {setError('Enter a phone number with country code, such as +7 700 123 45 67.');return;}
    if ((signup || reset) && !validPassword(password)) {setError('Use a password with 10–128 characters.'); return;}
    if (reset && password!==confirmPassword) {setError('Passwords do not match.');return;}
    if (!supabase) {setError('School accounts are not connected yet. The site administrator needs to complete the database setup.'); return;}
    setBusy(true);
    try {
      const normalized = normalizeEmail(email);
      if (forgot) {
        const result = await supabase.auth.resetPasswordForEmail(normalized, {redirectTo: window.location.origin});
        if (result.error) throw result.error; setSent(true);
      } else if (reset) {
        const result = await supabase.auth.updateUser({password}); if (result.error) throw result.error;
        notify("Your password has been updated."); open(null);
      } else if (signup) {
        const result = await supabase.auth.signUp({email: normalized, password, options: {data: {name: name.trim(),contact_phone: normalizePhone(phone)}, emailRedirectTo: window.location.origin}});
        if (result.error) throw result.error;
        setPassword(''); setSent(true);
      } else {
        const result = await supabase.auth.signInWithPassword({email: normalized, password}); if (result.error) throw result.error;
        if(result.data.user) await loadStudent(result.data.user.id, result.data.user.email ?? normalized);
        setPassword(''); notify("Welcome back, Eagle."); open(null);
      }
    } catch (err) {setError(authError(err, language));} finally {setBusy(false);}
  }
  return <Modal title={sent ? t("Check your inbox.") : signup ? t("Your next move starts here.") : forgot ? t("Let’s get you back in.") : reset ? t("A fresh start.") : t("Welcome back, Eagle.")} subtitle={sent ? t("If this address is eligible, we have sent instructions to your email.") : signup ? t("One school. A thousand possibilities. Join the community.") : forgot ? t("Enter your email to receive a password reset link.") : reset ? t("Choose a new password for your account.") : t("Sign in to join a club or bring your own idea to life.")} onClose={() => open(null)}>
    {sent ? <div className="email-sent"><Mail size={38}/><p>{t("Open the link in your email to continue. Check your spam folder too.")}</p><Button onClick={() => {setSent(false); open('signin');}}>{t("Back to sign in")} <ArrowRight size={18}/></Button></div> : <form onSubmit={submit} className="form">
      {signup && <label>{t("Your name")}<input required minLength={2} maxLength={60} value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder={t("First and last name")}/></label>}
      {!reset && <label>{t("Email address")}<input type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com"/></label>}
      {signup&&<label>{t("Contact phone")}<input type="tel" inputMode="tel" required maxLength={32} autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+7 700 123 45 67"/></label>}
      {!forgot && <label>{reset ? t("New password") : t("Password")}<div className="password-field"><input type={showPassword ? 'text' : 'password'} required minLength={signup || reset ? 10 : 1} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={signup || reset ? 'new-password' : 'current-password'} placeholder={signup || reset ? t("At least 10 characters") : t("Your password")}/><button type="button" className="icon-button" aria-label={showPassword ? t("Hide password") : t("Show password")} onClick={()=>setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>}
      {reset&&<label>{t("Confirm new password")}<input type="password" required minLength={10} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/></label>}
      {!signup && !forgot && !reset && <button className="text-link forgot-link" type="button" onClick={()=>open('forgot')}>{t("Forgot your password?")}</button>}
      {error && <p className="form-error" role="alert">{t(error)}</p>}
      <Button type="submit" className="full-width" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18}/> : <>{forgot ? t("Send reset link") : reset ? t("Update password") : signup ? t("Create account") : t("Sign in")}<ArrowUpRight size={19}/></>}</Button>
      {!reset && <p className="switch-auth">{forgot ? t("Remembered it?") : signup ? t("Already part of the community?") : t("New to NIS Eagles?")} <button type="button" className="text-link" onClick={()=>open(signup || forgot ? 'signin' : 'signup')}>{signup || forgot ? t("Sign in") : t("Create an account")}</button></p>}
      <div className="auth-note"><ShieldCheck size={16}/>{t("Your email and contact number stay private.")}</div>
    </form>}
  </Modal>;
}

function CreateClubDialog() {
  const {t, language, locale} = useTranslation();
  const {student, open, notify} = useEagles(); const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const input = {name: String(form.get('name')).trim(), description: String(form.get('description')).trim(), category: String(form.get('category')), meeting: String(form.get('meeting')).trim()};
    const validation = validateClub(input); if(validation) {setError(validation);return;}
    if(!student || !supabase) {setError('Please sign in with your verified account.');return;}
    setBusy(true);setError('');
    try {
      const result = await supabase.from('clubs').insert({...input,owner_id: student.id});
      if(result.error) throw result.error;
      await loadPublicData(); await loadStudent(student.id,student.email); open(null); notify("Your club is live. Let’s bring people together.");
      document.getElementById('clubs')?.scrollIntoView({behavior:'smooth'});
    } catch {setError('We couldn’t publish your club. Check that the name is unique and try again.');} finally {setBusy(false);}
  }
  return <Modal title={t("An idea. A new community.")} subtitle={t("Start a club, find your people, and make this year yours.")} onClose={()=>open(null)}><form className="form" onSubmit={submit}>
    <label>{t("Club name")}<input name="name" required minLength={3} maxLength={60} placeholder={t("Give your idea a name")}/></label>
    <label>{t("Category")}<select name="category" defaultValue="Academic">{CATEGORIES.map(x=><option key={x} value={x}>{t(x)}</option>)}</select></label>
    <label>{t("What’s your club about?")}<textarea name="description" required minLength={20} maxLength={500} rows={4} placeholder={t("What will you do together? Who should join?")}/></label>
    <label>{t("When & where")}<input name="meeting" required minLength={3} maxLength={100} placeholder={t("e.g. Fridays, 15:30 · Room 204")}/></label>
    <p className="field-hint">{t("Your club will be visible to everyone. Accounts with confirmed email can join.")}</p>
    {error && <p className="form-error" role="alert">{t(error)}</p>}<Button disabled={busy} className="full-width" type="submit">{busy ? <LoaderCircle size={18} className="spin"/> : <>{t("Publish your club")}<ArrowUpRight size={19}/></>}</Button>
  </form></Modal>;
}

function ClubDetail({club,onClose}: {club: Club; onClose:()=>void}) {
  const {t, language, locale} = useTranslation();
  const {student,memberships,notify}=useEagles();const [busy,setBusy]=useState(false);const [confirmDelete,setConfirmDelete]=useState(false);
  const joined=memberships.includes(club.id), owner=student?.id===club.owner_id;
  async function remove() {
    if(!confirmDelete){setConfirmDelete(true);return;}if(!supabase)return;setBusy(true);
    try{const result=await supabase.from('clubs').delete().eq('id',club.id);if(result.error)throw result.error;await loadPublicData();onClose();notify("Club deleted.");}catch{notify("We couldn’t delete this club. Please try again.",true);}finally{setBusy(false);}
  }
  return <Modal title={club.name} subtitle={t(club.category)+' · '+t('Student-led club')} onClose={onClose}>
    <p className="club-description-full">{club.description}</p><div className="detail-meta"><p><CalendarDays size={18}/>{club.meeting}</p><p><Users size={18}/>{memberCount(club.member_count, language)}</p></div>
    <Button className="full-width" disabled={busy || owner} onClick={async()=>{if(!student){onClose();useEagles.getState().open('signin');return;}setBusy(true);await joinClub(club.id);setBusy(false);onClose();}}>{busy ? <LoaderCircle size={18} className="spin"/> : owner ? <>{t("You’re the founder")}<Check size={18}/></> : joined ? t("Leave club") : <>{t("Join this club")}<ArrowUpRight size={18}/></>}</Button>
    {owner && <button className="danger-link" disabled={busy} onClick={remove}>{confirmDelete?t("Confirm deletion of this club and its memberships"):t("Delete my club")}</button>}
  </Modal>;
}

function EventDetail({event,onClose}: {event:SchoolEvent;onClose:()=>void}) {
  const {t, language, locale} = useTranslation();
  return <Modal title={event.title} subtitle={formatEvent(event.starts_at, language)} onClose={onClose}><p className="club-description-full">{event.description}</p><div className="detail-meta"><p><MapPin size={18}/>{event.location}</p></div>
    <Button className="full-width" onClick={()=>{
      const stamp=(date:Date)=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
      const escape=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
      const start=new Date(event.starts_at),end=new Date(start.getTime()+3600000);
      const content=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//NIS Eagles//School Events//EN','BEGIN:VEVENT',`UID:${event.id}@hbalm.nis.edu.kz`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,`SUMMARY:${escape(event.title)}`,`DESCRIPTION:${escape(event.description)}`,`LOCATION:${escape(event.location)}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
      const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='nis-eagles-event.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }}>{t("Add to my calendar")}<CalendarDays size={18}/></Button><p className="field-hint calendar-hint">{t("The calendar reminder reserves one hour.")}</p>
  </Modal>;
}
function formatEvent(value:string, language:Language) {return schoolDate(value,language)+' · '+translate(language,'Almaty time');}


type Page = 'home' | 'clubs' | 'shanyraks' | 'ministries' | 'profile' | 'admin' | 'ideas';
const navigation = [{href:'/',label:'Home',page:'home'},{href:'/clubs',label:'Клубы',page:'clubs'},{href:'/shanyraks',label:'Shanyraks',page:'shanyraks'},{href:'/ministries',label:'Самоуправление',page:'ministries'},{href:'/ideas',label:'Ideas',page:'ideas'}] as const;
const ministryIcons = {code:Code2,globe:Globe2,media:Newspaper,culture:Palette,education:GraduationCap,shield:Shield,sport:Trophy,ecology:Leaf,finance:Wallet};
const tones = ['sky','peach','mint','lilac','butter'];
function initials(name:string){return name.split(' ').map(word=>word[0]).slice(0,2).join('');}

export function EaglesApp({page='home'}:{page?:Page}) {
  const {t, language, locale} = useTranslation();
  const router=useRouter();
  useEffect(()=>{
    try {const stored=localStorage.getItem('nis-eagles-language'); if(isLanguage(stored))useLanguage.getState().setLanguage(stored);} catch {}
  },[]);
  useEffect(()=>{
    document.documentElement.lang=language;
    const item=navigation.find(item=>item.page===page);
    const title=page==='home'?'NIS Eagles — NIS Almaty-Nauryzbay':translate(language,page==='profile'?'My profile':page==='admin'?'Control panel':item?.label??'Home')+' · NIS Eagles';
    // Next.js can stream route metadata after this effect; keep it in the chosen language.
    const syncTitle=()=>{if(document.title!==title)document.title=title;};
    const observer=new MutationObserver(syncTitle);
    observer.observe(document.head,{childList:true,subtree:true,characterData:true});
    syncTitle();
    return()=>observer.disconnect();
  },[language,page]);
  const {student,clubs,events,shanyraks,governmentNames,memberships,modal,open,notice,authReady,loading,showMyClubs}=useEagles();
  const governmentName=(id:string,fallback:string|null)=>Object.hasOwn(governmentNames,id)?governmentNames[id]:fallback;
  const PRESIDENT={...INITIAL_PRESIDENT,name:governmentName('president',INITIAL_PRESIDENT.name)??''};
  const LEADERSHIP=INITIAL_LEADERSHIP.map((x,i)=>({...x,name:governmentName(['vice','speaker','secretary'][i],x.name)??''}));
  const MINISTRIES=INITIAL_MINISTRIES.map(x=>({...x,name:governmentName(x.id,x.name)}));
  const [mobileOpen,setMobileOpen]=useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('All');
  const [selectedClub,setSelectedClub]=useState<Club|null>(null);
  const [selectedEvent,setSelectedEvent]=useState<SchoolEvent|null>(null);
  const accountRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    void loadPublicData();
    if(!supabase){useEagles.getState().set({authReady:true});return;}
    const client=supabase;let alive=true;
    const resolve=async()=>{
      const {data,error}=await client.auth.getUser();
      if(!alive)return;
      if(data.user && !error && isValidEmail(data.user.email??''))await loadStudent(data.user.id,data.user.email!);
      else useEagles.getState().set({student:null,memberships:[],showMyClubs:false});
      useEagles.getState().set({authReady:true});
    };void resolve();
    const {data:listener}=client.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT')useEagles.getState().set({student:null,memberships:[],showMyClubs:false});
      if(event==='PASSWORD_RECOVERY')useEagles.getState().open('reset');
      if(session?.user && isValidEmail(session.user.email??''))setTimeout(()=>{if(alive)void loadStudent(session.user.id,session.user.email!);},0);
    });
    const refresh=()=>{void loadPublicData();void resolve();};window.addEventListener('focus',refresh);
    return()=>{alive=false;listener.subscription.unsubscribe();window.removeEventListener('focus',refresh);};
  },[]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>useEagles.getState().set({notice:null}),6500);return()=>clearTimeout(timer);},[notice]);
  useEffect(()=>{
    if(!accountOpen)return;
    const closeOutside=(event:PointerEvent)=>{if(!accountRef.current?.contains(event.target as Node))setAccountOpen(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setAccountOpen(false);};
    document.addEventListener('pointerdown',closeOutside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('keydown',escape);};
  },[accountOpen]);
  const startClub=()=>open(student?'create':'signup');
  const filtered=clubs.filter(club=>(category==='All'||club.category===category)&&(!showMyClubs||memberships.includes(club.id)||club.owner_id===student?.id)&&(club.name+' '+club.description).toLowerCase().includes(query.toLowerCase()));
  const sorted=[...shanyraks].sort((a,b)=>b.points-a.points||a.id-b.id);
  const signOut=async()=>{
    const result=await supabase?.auth.signOut();
    if(result?.error){useEagles.getState().notify('Couldn’t sign out. Please try again.',true);return;}
    setAccountOpen(false);useEagles.getState().set({student:null,memberships:[],showMyClubs:false});
  };
  return <MotionConfig reducedMotion="user">
    <a className="skip-link" href="#main">{t("Skip to content")}</a>
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label={t("NIS Eagles home")}><Eagle/><span>NIS Eagles</span></Link>
        <nav className="desktop-nav" aria-label={t("Main navigation")}>{navigation.map(item=><Link href={item.href} key={item.page} aria-current={page===item.page?'page':undefined}>{t(item.label)}</Link>)}</nav>
        <div className="header-actions">
          <LanguageSwitcher/>
          {student?<div className="account-wrap" ref={accountRef}><button className="account-button" aria-label={t("Open account menu")} aria-expanded={accountOpen} onClick={()=>setAccountOpen(!accountOpen)}><span className="avatar">{student.name.slice(0,1).toUpperCase()}</span><span className="account-name">{student.name.split(' ')[0]}</span><ChevronDown size={15}/></button>{accountOpen&&<div className="account-menu"><p>{student.name}<small>{student.email}</small></p><button onClick={()=>{setAccountOpen(false);router.push('/profile');}}><ShieldCheck size={16}/>{t("My profile")}</button><button onClick={()=>{useEagles.getState().set({showMyClubs:true});setAccountOpen(false);router.push('/clubs');}}><Users size={16}/>{t("My clubs")}</button><button onClick={signOut}><LogOut size={16}/>{t("Sign out")}</button></div>}</div>:<><button className="nav-signin" disabled={!authReady} onClick={()=>open('signin')}>{t("Sign in")}</button><Button className="nav-join" disabled={!authReady} onClick={()=>open('signup')}>{t("Join NIS")}</Button></>}
          <button className="icon-button mobile-toggle" aria-label={mobileOpen?t("Close navigation"):t("Open navigation")} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X size={21}/>:<Menu size={21}/>}</button>
        </div>
      </div>
      <AnimatePresence>{mobileOpen&&<motion.nav className="mobile-nav" id="mobile-navigation" aria-label={t("Mobile navigation")} initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>{navigation.map(item=><Link href={item.href} key={item.page} aria-current={page===item.page?'page':undefined} onClick={()=>setMobileOpen(false)}>{t(item.label)}<ArrowUpRight size={18}/></Link>)}{!student&&<button onClick={()=>{setMobileOpen(false);open('signin');}}>{t("Sign in")}<ArrowRight size={18}/></button>}{!student&&<button onClick={()=>{setMobileOpen(false);open('signup');}}>{t('Create account')}<Plus size={18}/></button>}</motion.nav>}</AnimatePresence>
    </header>
    <main id="main" className={clsx('site-main',page!=='home'&&'inner-page')}>
      {page==='home'&&<>
        <section className="home-hero" id="home">
          <div className="hero-photo" role="img" aria-label={t("The NIS Eagles student community at school")}/><div className="hero-wash"/>
          <div className="hero-orb orb-blue" aria-hidden="true"/><div className="hero-orb orb-peach" aria-hidden="true"/><div className="hero-orb orb-lilac" aria-hidden="true"/>
          <motion.div className="hero-content" initial={{opacity:1,y:12}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
            <p className="school-label">NIS Almaty-Nauryzbay<span>2026–2027</span></p>
            <h1>NIS EAGLES</h1>
            <p className="hero-description">{t("A place to belong. A voice that matters.")}<br/>{' '}{t("Let’s make this school year our own.")}</p>
            <div className="hero-ctas"><Link href="/clubs" className="button">{t("Клубы")}<ArrowUpRight size={17}/></Link><Link href="/ministries" className="text-link">{t("Meet the Eagles")}<ArrowRight size={16}/></Link></div>
          </motion.div>
          
        </section>
        <section className="home-paths section"><motion.div {...fade}><div className="center-heading"><p className="page-kicker">{t("Your community, one step at a time")}</p><h2>{t("A little curiosity.")}<br/>{' '}{t("A place to call yours.")}</h2></div><div className="path-grid">
          <Link href="/clubs" className="path-card"><span className="path-icon sky"><Users size={23}/></span><h3>{t("Клубы")}</h3><p>{t("Discover a shared interest.")}<br/>{' '}{t("Or start something of your own.")}</p><ArrowUpRight className="path-arrow" size={20}/></Link>
          <Link href="/shanyraks" className="path-card"><span className="path-icon lilac"><Trophy size={23}/></span><h3>{t("Back your Shanyrak")}</h3><p>{shanyrakCount(shanyraks.length, language)}.<br/>{' '}{t("One school spirit.")}</p><ArrowUpRight className="path-arrow" size={20}/></Link>
          <Link href="/ministries" className="path-card"><span className="path-icon peach"><Sparkles size={23}/></span><h3>{t("Meet your team")}</h3><p>{t("The people bringing")}<br/>{' '}{t("our ideas to life.")}</p><ArrowUpRight className="path-arrow" size={20}/></Link>
        </div></motion.div></section>
        <section className="events-section section" id="events"><motion.div {...fade}><div className="events-heading"><h2 id="events-title">{t("Events")}</h2></div>
          <div className={clsx('events-box',events.length===0&&'events-box-empty')} role="list" aria-labelledby="events-title">{events.length===0&&<div className="event-empty" role="listitem"><p>{loading?t("Загружаем события…"):t("Пока событий нет.")}</p></div>}{events.map(event=><article key={event.id} className="event-row" role="listitem"><div className="event-date"><span>{schoolMonth(event.starts_at,language)}</span><strong>{schoolDay(event.starts_at)}</strong></div><div className="event-info"><h3>{event.title}</h3><p><MapPin size={14}/>{event.location}<span>·</span>{schoolTime(event.starts_at)}</p></div><Button className="event-button" onClick={()=>setSelectedEvent(event)}>{t("Event details")}<ArrowUpRight size={16}/></Button></article>)}</div>
        </motion.div></section>
        <section className="section home-ideas"><div><span className="page-kicker">{t("Idea box")}</span><h2>{t("What would make our school better?")}</h2><p>{t("Suggest a change, share an opinion, or bring a new idea.")}</p></div><Link href="/ideas" className="button">{t("Send an idea")}<ArrowUpRight size={17}/></Link></section>
      </>}
      {page==='clubs'&&<>
        <section className="page-intro"><motion.div {...fade}><p className="page-kicker">{t("Student-led. Everyone welcome.")}</p><h1>{t("Клубы")}</h1><p>{t("A shared interest is all it takes.")}<br/>{' '}{t("Join a club or bring your own idea to life.")}</p><Button onClick={startClub}>{t("Start a club")}<Plus size={17}/></Button></motion.div></section>
        <section className="section club-directory" id="clubs" aria-label={t("Club directory")}>
          <div className="club-toolbar"><div className="filters" role="group" aria-label={t("Filter clubs by category")}>{['All',...CATEGORIES].map(x=><button key={x} className={clsx('filter',category===x&&'active')} aria-pressed={category===x} onClick={()=>setCategory(x)}>{x==='All'?t("All clubs"):t(x)}</button>)}</div><label className="search"><Search size={17}/><input aria-label={t("Search clubs")} placeholder={t("Find a club")} value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button className="icon-button" aria-label={t("Clear search")} onClick={()=>setQuery('')}><X size={15}/></button>}</label></div>
          {student&&<button className={clsx('my-clubs-toggle',showMyClubs&&'selected')} aria-pressed={showMyClubs} onClick={()=>useEagles.getState().set({showMyClubs:!showMyClubs})}><Users size={15}/>{showMyClubs?t("Showing my clubs"):t("Show my clubs")}</button>}
          {loading&&<div className="loading-data" role="status"><LoaderCircle className="spin" size={16}/>{t("Updating clubs…")}</div>}
          {filtered.length?<div className="club-grid">{filtered.map(club=>{const Icon=categoryIcons[club.category]??Users;const joined=memberships.includes(club.id);return <motion.article key={club.id} className="club-card" layout><div className="club-card-top"><span className="category-tag">{t(club.category)}</span><span className={clsx('club-icon',categoryColors[club.category])}><Icon size={24}/></span></div><h3><button onClick={()=>setSelectedClub(club)}>{club.name}</button></h3><p>{club.description}</p><div className="club-card-bottom"><span><Users size={15}/>{memberCount(club.member_count, language)}</span><button className="club-join" onClick={()=>setSelectedClub(club)}>{club.owner_id===student?.id?t("Your club"):joined?t("Joined"):t("Join club")}{joined?<Check size={16}/>:<ArrowUpRight size={17}/>}</button></div></motion.article>;})}</div>:<div className="club-empty"><span className="empty-icon sky"><Users size={28}/></span><h2>{clubs.length||query||category!=='All'||showMyClubs?t("No clubs found."):t("Your club could be the first.")}</h2><p>{clubs.length||query||category!=='All'||showMyClubs?t("Try a different search or category."):t("This space fills up as students publish their clubs.")}</p>{(query||category!=='All'||showMyClubs)&&<button className="text-link" onClick={()=>{setQuery('');setCategory('All');useEagles.getState().set({showMyClubs:false});}}>{t("Reset filters")}<ArrowRight size={16}/></button>}</div>}
        </section>
      </>}
      {page==='shanyraks'&&<>
        <section className="page-intro"><motion.div {...fade}><p className="page-kicker">{t("Different classes. Shared spirit.")}</p><h1>{t("One school.")}<br/>{' '}<span>{shanyrakCount(shanyraks.length, language)}.</span></h1><p>{t("A Shanyrak brings two, three, or four classes together.")}<br/>{' '}{t("Every great story starts at zero.")}</p></motion.div></section>
        <section className="section standings-section" id="shanyraks"><div className="standings-panel"><div className="standings-header"><span><Trophy size={17}/>{t("Shanyrak standings")}</span><span className="season-pill">2026–2027</span></div><div className="standings-grid">{sorted.map((item,index)=>{const rank=sorted.findIndex(x=>x.points===item.points)+1;const tied=sorted.filter(x=>x.points===item.points).length>1;return <div className="standing-row" key={item.id}><span className="standing-rank">{tied?'=':''}{rank}</span><span className={clsx('shanyrak-avatar',tones[index%tones.length])}><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="12" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M6 18h24M18 6v24M9.5 9.5l17 17M26.5 9.5l-17 17" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="18" r="4" fill="currentColor"/></svg></span><div className="standing-community"><h2 lang="kk">{item.name}</h2><p className="standing-leader" lang="kk">{item.leader_name !== undefined ? item.leader_name??'' : SHANYRAK_LEADERS[item.name]??''}</p></div><span className="standing-points">{item.points}<small>{t("PTS")}</small></span></div>;})}</div><p className="standings-note">{t("All Shanyraks begin at zero. Points will appear as the season unfolds.")}</p></div></section>
      </>}
      {page==='ministries'&&<>
        <section className="page-intro team-intro"><motion.div {...fade}><p className="page-kicker">NIS Eagles · 2026–2027</p><h1>{t("Самоуправление")}</h1><p>{t("Руководство, министерства и лидеры Шаныраков.")}</p></motion.div></section>
        <section className="section leadership-section" aria-labelledby="leadership-title"><div className="subsection-heading"><h2 id="leadership-title">{t("Leadership")}</h2><p>{t("A shared direction for our school.")}</p></div><motion.article className="president-card" {...fade}><span className="president-avatar" aria-hidden="true">{initials(PRESIDENT.name)}</span><div className="president-copy"><span className="role-label"><Crown size={16}/>{t(PRESIDENT.role)}</span><h3 lang="kk">{PRESIDENT.name}</h3><p>NIS Eagles · 2026–2027</p></div><Eagle className="president-eagle"/></motion.article><div className="leadership-grid">{LEADERSHIP.map((member,index)=><motion.article className="leader-card" key={t(member.role)} {...fade}><span className={clsx('member-avatar',tones[(index+1)%tones.length])} aria-hidden="true">{initials(member.name)}</span><p className="member-role">{t(member.role)}</p><h3 lang="kk">{member.name}</h3></motion.article>)}</div></section>
        <section className="section ministries-section" aria-labelledby="ministries-title"><div className="subsection-heading"><h2 id="ministries-title">{t("Ministries")}</h2><p>{t("Nine areas. One community.")}</p></div><div className="ministry-grid">{MINISTRIES.map((member,index)=>{const Icon=ministryIcons[member.icon];return <motion.article className="ministry-card" key={member.id} {...fade}><span className={clsx('ministry-icon',tones[index%tones.length])}><Icon size={23}/></span>{member.name?<h3 lang="kk">{member.name}</h3>:<div className="unfilled-name" aria-hidden="true"/>}<p className="ministry-role" lang={language}>{t(member.role)}</p></motion.article>;})}</div></section>
        <section className="section shanyrak-council-section" aria-labelledby="shanyrak-leaders-title"><div className="subsection-heading"><h2 id="shanyrak-leaders-title">{t("Лидеры Шаныраков")}</h2></div><div className="shanyrak-council-list" role="list">{shanyraks.map((shanyrak,index)=><article className="shanyrak-council-row" key={shanyrak.id} role="listitem"><span className={clsx('shanyrak-avatar',tones[index%tones.length])} aria-hidden="true">{index+1}</span><div className="shanyrak-council-person"><h3 lang="kk">{shanyrak.name}</h3><p lang="kk">{shanyrak.leader_name !== undefined ? shanyrak.leader_name??'' : SHANYRAK_LEADERS[shanyrak.name]??''}</p></div></article>)}</div></section>

      </>}
      {page==='ideas'&&<IdeasPage/>}
      {page==='profile'&&<ProfilePage/>}
      {page==='admin'&&<AdminPage/>}
    </main>
    <footer className="footer"><div className="footer-top"><Link href="/" className="brand"><Eagle/><span>NIS Eagles</span></Link><nav aria-label={t("Footer navigation")}><Link href="/clubs">{t("Клубы")}</Link><Link href="/shanyraks">{t("Shanyraks")}</Link><Link href="/ministries">{t("Самоуправление")}</Link><Link href="/ideas">{t("Ideas")}</Link></nav><span className="footer-season">2026–2027</span></div><div className="footer-bottom"><p>NIS Almaty-Nauryzbay</p><a href="#main" className="text-link">{t("Back to top")}<ArrowUpRight size={15}/></a></div><p className="footer-credit">Powered by Kurmangali Nurassyl</p></footer>
    <AnimatePresence>{modal&&['signin','signup','forgot','reset'].includes(modal)&&<AuthDialog mode={modal as 'signin'|'signup'|'forgot'|'reset'} key={modal}/>} {modal==='create'&&<CreateClubDialog key="create"/>}{selectedClub&&<ClubDetail key={selectedClub.id} club={selectedClub} onClose={()=>setSelectedClub(null)}/>} {selectedEvent&&<EventDetail key={selectedEvent.id} event={selectedEvent} onClose={()=>setSelectedEvent(null)}/>}</AnimatePresence>
    <AnimatePresence>{notice&&<motion.div role={notice.error?'alert':'status'} className={clsx('toast',notice.error&&'toast-error')} initial={{opacity:0,y:24,x:'-50%'}} animate={{opacity:1,y:0,x:'-50%'}} exit={{opacity:0,y:24,x:'-50%'}}>{notice.error?<X size={18}/>:<Check size={18}/>}<span>{t(notice.text)}</span><button className="icon-button" aria-label={t("Dismiss notification")} onClick={()=>useEagles.getState().set({notice:null})}><X size={17}/></button></motion.div>}</AnimatePresence>
  </MotionConfig>;
}
