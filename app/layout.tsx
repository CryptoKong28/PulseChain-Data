import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { MainNav } from '@/components/ui/nav';
import { Toaster } from 'sonner';
import { Footer } from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PulseChain Token Scanner',
  description: 'Track burned tokens and liquidity on PulseChain with a retro-modern interface',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/favicon-16x16.png',
        type: 'image/png',
        sizes: '16x16',
      },
      {
        url: '/favicon-32x32.png',
        type: 'image/png',
        sizes: '32x32',
      },
    ],
    apple: {
      url: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/android-chrome-512x512.png',
      },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <MainNav />
        <div className="pt-16">
          {children}
        </div>
        <Toaster position="top-right" theme="dark" />
        <Footer />
      </body>
    </html>
  );
}