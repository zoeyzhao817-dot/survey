import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Scent Type · 香型人格',
  description: "What's your scent type? 90 seconds, no sign-up. Get a scent-personality card and 3 fragrance picks.",
  openGraph: { title: "What's your scent type?", description: '90 seconds. No sign-up.', type: 'website' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FBF7F2' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=Noto+Serif+SC:wght@600;700&display=swap"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
