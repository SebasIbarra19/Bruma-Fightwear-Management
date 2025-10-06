import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NavigationProvider } from '@/contexts/NavigationContext'

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // PRIORIDAD ABSOLUTA: El tema guardado SIEMPRE prevalece
                const savedTheme = localStorage.getItem('theme');
                const themes = {
                  light: { background: '#ffffff', surface: '#f8fafc', textPrimary: '#1e293b', textSecondary: '#475569', border: '#e2e8f0', primary: '#3b82f6' },
                  dark: { background: '#0a0a0a', surface: '#1a1a1a', textPrimary: '#ffffff', textSecondary: '#d4d4d4', border: '#404040', primary: '#ffffff' },
                  forest: { background: '#0f1f13', surface: '#1a2e20', textPrimary: '#ecfdf5', textSecondary: '#bbf7d0', border: '#2d4736', primary: '#22c55e' },
                  ocean: { background: '#0c1827', surface: '#1e2a47', textPrimary: '#f0f9ff', textSecondary: '#bae6fd', border: '#2a3f66', primary: '#0ea5e9' },
                  warm: { background: '#f0e6d2', surface: '#e8dcc6', textPrimary: '#3e2723', textSecondary: '#5d4037', border: '#c7b896', primary: '#c56c00' }
                };
                
                // Si existe tema guardado, usarlo SIEMPRE (prioridad absoluta)
                const themeToUse = savedTheme && themes[savedTheme] ? savedTheme : 'warm';
                const theme = themes[themeToUse];
                
                document.documentElement.style.setProperty('--color-background', theme.background);
                document.documentElement.style.setProperty('--color-surface', theme.surface);
                document.documentElement.style.setProperty('--color-text-primary', theme.textPrimary);
                document.documentElement.style.setProperty('--color-text-secondary', theme.textSecondary);
                document.documentElement.style.setProperty('--color-border', theme.border);
                document.documentElement.style.setProperty('--color-primary', theme.primary);
                document.documentElement.setAttribute('data-theme', themeToUse);
              } catch (e) {}
            `,
          }}
        />
        <ThemeProvider defaultTheme="warm">
          <AuthProvider>
            <NavigationProvider>
              <div id="root">
                {children}
              </div>
            </NavigationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}