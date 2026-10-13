import { supabase } from './supabase';
import { useEagles } from './store';
import type { Club, SchoolEvent, Shanyrak, Student } from './types';
export async function loadPublicData() {
  if (!supabase) return;
  const state = useEagles.getState();
  state.set({loading: true});
  const [clubs, events, shanyraks] = await Promise.all([
    supabase.from('club_directory').select('*').order('created_at', {ascending: false}),
    supabase.from('events').select('id,title,description,starts_at,location').eq('published', true).gte('starts_at', new Date().toISOString()).order('starts_at'),
    supabase.from('shanyraks').select('*').order('id'),
  ]);
  const government = await supabase.from('government_members').select('id,name');
  if(!government.error) state.set({governmentNames: Object.fromEntries((government.data??[]).map(x=>[x.id,x.name]))});
  state.set({loading: false});
  if (clubs.error || events.error || shanyraks.error) { state.notify('School data could not be loaded. Please try again.', true); return; }
  state.set({clubs: (clubs.data ?? []) as Club[], events: (events.data ?? []) as SchoolEvent[], shanyraks: ((shanyraks.data ?? []) as Shanyrak[]).filter(x=>x.active ?? x.name!=='Алатау')});
}
export async function loadStudent(id: string, email: string) {
  if (!supabase) return;
  const [profile, membership] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('club_members').select('club_id').eq('user_id', id),
  ]);
  const {data: currentSession} = await supabase.auth.getSession();
  if(currentSession.session?.user.id !== id) return;
  if (profile.error || membership.error) { useEagles.getState().set({student:null,memberships:[]}); useEagles.getState().notify('Your school profile could not be loaded. Please sign in again.', true); return; }
  const student: Student = {id, email, name: profile.data.name, isAdmin: profile.data.is_admin, isOwner: profile.data.is_owner ?? false};
  useEagles.getState().set({student, memberships: membership.data.map((row) => row.club_id)});
}
export async function joinClub(id: string) {
  const state = useEagles.getState();
  if (!state.student) {state.open('signin'); return;}
  if (!supabase) return;
  const leaving = state.memberships.includes(id);
  const result = leaving ? await supabase.from('club_members').delete().eq('club_id', id).eq('user_id', state.student.id)
    : await supabase.from('club_members').insert({club_id: id, user_id: state.student.id});
  if (result.error) {state.notify('We couldn’t update your membership. Please try again.', true); return;}
  state.set({memberships: leaving ? state.memberships.filter((x) => x !== id) : [...state.memberships, id]});
  state.notify(leaving ? 'You’ve left the club.' : 'You’re in! Welcome to the club.');
  await loadPublicData();
}
