import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NEXIOM - Praktijkmanagement',
  description: 'NEXIOM tandarts praktijkmanagement software',
  openGraph: {
    title: 'NEXIOM - Praktijkmanagement',
    description: 'NEXIOM tandarts praktijkmanagement software',
    images: [{ url: '/images/nexiom-logo.png', width: 512, height: 512, alt: 'NEXIOM Logo' }],
    siteName: 'NEXIOM',
  },
  icons: {
    icon: '/images/nexiom-logo-sm.png',
    apple: '/images/nexiom-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
