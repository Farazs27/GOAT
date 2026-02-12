import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NEXIOM - Praktijkmanagement',
  description: 'NEXIOM tandarts praktijkmanagement software',
  openGraph: {
    title: 'NEXIOM - Praktijkmanagement',
    description: 'NEXIOM tandarts praktijkmanagement software',
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
