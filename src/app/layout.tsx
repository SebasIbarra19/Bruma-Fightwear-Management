import type { Viewport } from 'next'
import './globals.css'
import { Fraunces } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { GlobalBackground } from '@/components/layout/GlobalBackground'

const fraunces = Fraunces({ 
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata = {
  title: 'BRUMA Fightwear - Sistema de Gestión',
  description: 'Sistema completo de administración para equipamiento de artes marciales - Gestiona productos, ventas, inventario y más.',
  keywords: 'bruma, fightwear, artes marciales, boxeo, mma, gestión, admin',
  authors: [{ name: 'BRUMA Team' }],
  creator: 'BRUMA Fightwear',
  publisher: 'BRUMA',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'BRUMA Fightwear - Sistema de Gestión',
    description: 'Sistema completo de administración para equipamiento de artes marciales',
    url: 'https://brumafightwear.com',
    siteName: 'BRUMA Fightwear',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BRUMA Fightwear - Sistema de Gestión',
    description: 'Sistema completo de administración para equipamiento de artes marciales',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${GeistSans.variable}`}>
      <body className="font-geist min-h-[100vh] bg-background text-foreground overflow-x-hidden antialiased">
        <ThemeProvider defaultTheme="warm">
          <AuthProvider>
            <GlobalBackground />
            <div id="root" className="relative z-10 flex flex-col min-h-screen">
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}