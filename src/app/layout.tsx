import './globals.css';
import { Roboto_Mono, Inter } from 'next/font/google';
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { auth0 } from '@/lib/auth0';

const robotoMono = Roboto_Mono({ weight: '400', subsets: ['latin'] });
const publicSans = Inter({ weight: '400', subsets: ['latin'] });

const TITLE = 'Cassandra';
const DESCRIPTION = 'Talk to your Calendar(s) to manage your life.';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{TITLE}</title>
        <link rel="shortcut icon" type="image/svg+xml" href="/images/favicon.png" />
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content="/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content="/images/og-image.png" />
      </head>
      <body className={publicSans.className}>
        <div className="flex flex-col h-[100dvh] bg-background">
          <header className="flex justify-between items-center p-2 border-b">
            <span className={`${robotoMono.className} text-xl`}>Cassandra</span>
            {session && (
              <Button asChild variant="ghost" size="sm">
                <a href="/auth/logout" className="flex items-center gap-1">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </a>
              </Button>
            )}
          </header>
          <main className="flex-1 relative">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
