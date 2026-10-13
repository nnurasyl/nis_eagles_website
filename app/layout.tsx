import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'NIS Eagles — NIS Almaty-Nauryzbay',
  description: 'NIS Almaty-Nauryzbay оқушылардың өзін-өзі басқаруы, 2026–2027. Клубтар, іс-шаралар және шаңырақтар.',
  icons: {icon: {url: '/eagles.jpeg', type: 'image/jpeg'}},
};
export const viewport: Viewport = {width: 'device-width', initialScale: 1, themeColor: '#f6f9fc'};
export default function RootLayout({children}: {children: React.ReactNode}) {
  return <html lang="kk"><body>{children}</body></html>;
}
