import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import ThemeRegistry from '@/components/theme-registry';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Luna Jewel Atelier',
  description: 'Luxury jewelry storefront starter built with Next.js, MUI, Motion, and Embla.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${display.variable}`}>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
