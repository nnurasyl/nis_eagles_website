import type {Metadata} from 'next';
import {EaglesApp} from '@/components/eagles-app';
export const metadata: Metadata={title:'Идеялар · NIS Eagles'};
export default function Page(){return <EaglesApp page="ideas"/>;}
