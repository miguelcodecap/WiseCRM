import type { Metadata, Viewport } from 'next';
import { Geist, Instrument_Serif } from 'next/font/google';
import './globals.css';

const sans = Geist({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  title: 'WiseCRM · The sales CRM that explains its numbers',
  description:
    'A modern sales CRM with a drag-and-drop pipeline, weighted forecasting, sales-velocity analytics and an AI copilot. Built with Next.js, TypeScript and Supabase.',
  openGraph: {
    title: 'WiseCRM',
    description: 'The sales CRM that explains its numbers.',
    type: 'website',
  },
};

export const viewport: Viewport = { themeColor: '#1d1233', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
