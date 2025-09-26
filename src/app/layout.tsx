import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <div id="root">
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}