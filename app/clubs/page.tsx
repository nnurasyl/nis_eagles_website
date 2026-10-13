import type {Metadata} from 'next';
import {EaglesApp} from '@/components/eagles-app';
export const metadata: Metadata = {title: "Клубтар · NIS Eagles"};
export default function ClubsPage(){return <EaglesApp page="clubs"/>;}
