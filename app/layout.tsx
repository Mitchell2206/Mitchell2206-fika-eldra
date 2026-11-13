import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

const site = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'FIKA ELDRA · Ritual con propósito', template: '%s · FIKA ELDRA' },
  description: 'Velas aromáticas con runas, brumas textiles y pequeños rituales para volver al presente. Retiro en Villa Urquiza y envíos.',
  openGraph: { type: 'website', locale: 'es_AR', siteName: 'FIKA ELDRA', images: ['/images/vela-incognito.webp'] },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { themeColor: '#0e110e', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className="dark">
      <body>
        {children}
        <Toaster theme="dark" position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
