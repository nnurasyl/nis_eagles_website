'use client';
import { create } from 'zustand';
import type { Student, Club, SchoolEvent, Shanyrak } from './types';
import { INITIAL_SHANYRAKS } from './shanyraks';
type Modal = 'signin' | 'signup' | 'forgot' | 'reset' | 'create' | 'event' | null;
type State = {
  student: Student | null; clubs: Club[]; events: SchoolEvent[]; shanyraks: Shanyrak[];
  memberships: string[]; modal: Modal; authReady: boolean; loading: boolean; showMyClubs: boolean;
  notice: {text: string; error: boolean} | null;
  set: (value: Partial<Omit<State, 'set' | 'open' | 'notify'>>) => void;
  open: (modal: Modal) => void; notify: (text: string, error?: boolean) => void;
};
export const useEagles = create<State>((set) => ({
  student: null, clubs: [], events: [], shanyraks: INITIAL_SHANYRAKS, memberships: [], modal: null,
  loading: false, authReady: false, notice: null, showMyClubs: false,
  set: (value) => set(value), open: (modal) => set({modal}),
  notify: (text, error = false) => set({notice: {text, error}}),
}));
