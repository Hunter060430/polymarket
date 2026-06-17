import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans, Geist_Mono } from 'next/font/google'
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verdict — Prediction Market Clarity Index',
    description: 'Independent scoring of Polymarket resolution quality. Know before you trade.',
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
      className={`${cormorant.variable} ${dmSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
