import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SmartAdmin - Sistema de Administración',
  description: 'Sistema completo de administración empresarial - Gestiona proyectos, productos, categorías y más.',
  keywords: 'admin, gestión, sistema, administración, productos',
  authors: [{ name: 'SmartAdmin Team' }],
  creator: 'SmartAdmin Team',
  publisher: 'SmartAdmin',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'SmartAdmin - Sistema de Administración',
    description: 'Sistema completo de administración empresarial',
    url: 'https://smartadmin.com',
    siteName: 'SmartAdmin',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartAdmin - Sistema de Administración',
    description: 'Sistema completo de administración empresarial',
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
        <AuthProvider>
          <div id="root">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}