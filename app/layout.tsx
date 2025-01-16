import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { MainNav } from '@/components/ui/nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PulseChain Token Scanner',
  description: 'Track burned tokens and liquidity on PulseChain with a retro-modern interface',
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
      </body>
    </html>
  );
}