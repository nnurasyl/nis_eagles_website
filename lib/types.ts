import type { Category } from './validation';
export type Student = {id: string; name: string; email: string; isAdmin: boolean};
export type Club = {id: string; name: string; description: string; category: Category; meeting: string; owner_id: string; created_at: string; member_count: number};
export type SchoolEvent = {id: string; title: string; description: string; starts_at: string; location: string};
export type Shanyrak = {id: number; name: string; points: number};
