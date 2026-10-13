import type {Metadata} from 'next';
import {EaglesApp} from '@/components/eagles-app';
export const metadata: Metadata = {title: "Өзін-өзі басқару · NIS Eagles",description: 'NIS Almaty-Nauryzbay басшылығы, министрліктері және шаңырақ көшбасшылары, 2026–2027.'};
export default function MinistriesPage(){return <EaglesApp page="ministries"/>;}
