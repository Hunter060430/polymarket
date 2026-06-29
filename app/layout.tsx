import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans, Geist_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/theme-provider'
import { CookieConsent } from '@/components/cookie-consent'
import { Web3Provider } from '@/components/web3-provider'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Verdict — Prediction Market Clarity Index',
    template: '%s — Verdict',
  },
  description:
    'Verdict is an independent watchdog that scores active Polymarket markets on rule clarity, evidence standards, and post-trade resolution risk. Know before you trade.',
  keywords: ['prediction markets', 'polymarket', 'market clarity', 'resolution risk', 'watchdog'],
  authors: [{ name: 'Verdict' }],
  openGraph: {
    title: 'Verdict — Prediction Market Clarity Index',
    description: 'Independent scoring of Polymarket resolution quality. Know before you trade.',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Verdict — Prediction Market Clarity Index',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verdict — Prediction Market Clarity Index',
    description: 'Independent scoring of Polymarket resolution quality. Know before you trade.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cormorant.variable} ${dmSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Web3Provider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
            <CookieConsent />
          </Web3Provider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
