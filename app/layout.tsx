import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { TopBar } from "@/components/top-bar"

export const metadata: Metadata = {
  title: "MCM Tools Engine",
  description: "Tus micro-utilidades, ensambladas a mano.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
}

const themeBootstrap = `
(function() {
  try {
    var t = localStorage.getItem('mcm-theme');
    if (t !== 'light' && t !== 'dark') t = 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
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
        <TopBar />
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
