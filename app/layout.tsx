import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { TopBar } from "@/components/top-bar"
import { AdminProvider } from "@/components/admin-context"

export const metadata: Metadata = {
  title: "MCM Tools",
  description: "Tu plataforma de micro-herramientas. Define, construye y ejecuta.",
}

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
}

const themeBootstrap = `
(function() {
  try {
    var t = localStorage.getItem('mcm-theme');
    if (t !== 'light' && t !== 'dark') t = 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="antialiased">
        <AdminProvider>
          <TopBar />
          {children}
          {process.env.NODE_ENV === "production" && <Analytics />}
        </AdminProvider>
      </body>
    </html>
  )
}
