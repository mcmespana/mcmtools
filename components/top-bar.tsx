"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Icon } from "./icon"
import { useAdmin } from "./admin-context"

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light")

  useEffect(() => {
    const t = (document.documentElement.getAttribute("data-theme") as "dark" | "light") ?? "light"
    setTheme(t)
  }, [])

  const toggle = () => {
    const next: "dark" | "light" = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    try {
      localStorage.setItem("mcm-theme", next)
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      className="btn btn-ghost"
      onClick={toggle}
      aria-label="Cambiar tema"
      style={{ padding: "8px 10px" }}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
    </button>
  )
}

function useCrumbs(): string[] | null {
  const pathname = usePathname()
  if (!pathname || pathname === "/") return null
  if (pathname === "/tools/new") return ["Tool Builder"]
  const m = pathname.match(/^\/tools\/([^/]+)(\/config)?$/)
  if (m) {
    const tail = m[2] ? "Configuración" : "Ejecutar"
    return [m[1].replace(/_/g, " "), tail]
  }
  return null
}

export function TopBar() {
  const crumbs = useCrumbs()

  return (
    <div className="topbar">
      <div className="row" style={{ gap: 24 }}>
        <Link
          href="/"
          className="row"
          style={{ textDecoration: "none", color: "var(--text)", padding: 0, gap: 10 }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--text)",
              color: "var(--bg)",
              display: "grid",
              placeItems: "center",
              fontFamily: "Syne",
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: "-0.05em",
            }}
          >
            M
          </div>
          <span className="t-display" style={{ fontSize: 18, fontWeight: 700 }}>
            MCM
          </span>
          <span className="t-editorial"> Tools</span>
        </Link>
        {crumbs && crumbs.length > 0 && (
          <div className="row" style={{ gap: 8, color: "var(--text-3)" }}>
            <Icon name="chevRight" size={14} />
            {crumbs.map((c, i) => (
              <span
                key={i}
                style={{
                  fontSize: 13,
                  color: i === crumbs.length - 1 ? "var(--text)" : "var(--text-3)",
                  fontWeight: i === crumbs.length - 1 ? 600 : 400,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {i > 0 && <Icon name="chevRight" size={14} />}
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <ThemeToggle />
        <AdminMenu />
      </div>
    </div>
  )
}

function AdminMenu() {
  const { isAdmin, login, logout } = useAdmin()
  const [showPanel, setShowPanel] = useState(false)
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [error, setError] = useState(false)

  const handleLogin = () => {
    const ok = login(user, pass)
    if (ok) {
      setShowPanel(false)
      setUser("")
      setPass("")
      setError(false)
    } else {
      setError(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin()
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => { setShowPanel(!showPanel); setError(false) }}
        className="btn btn-ghost"
        style={{ padding: "8px 10px", color: isAdmin ? "var(--accent)" : "var(--text-3)" }}
      >
        <Icon name={isAdmin ? "unlock" : "lock"} size={16} />
      </button>

      {showPanel && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowPanel(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              padding: 20,
              borderRadius: 20,
              width: 260,
              zIndex: 50,
              boxShadow: "0 20px 60px -12px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>
              {isAdmin ? "Sesión activa" : "Acceso de administrador"}
            </div>

            {!isAdmin ? (
              <div className="col" style={{ gap: 10 }}>
                <input
                  className="input"
                  placeholder="Usuario"
                  value={user}
                  onChange={(e) => { setUser(e.target.value); setError(false) }}
                  onKeyDown={handleKeyDown}
                  style={{ fontSize: 13, padding: "10px 14px" }}
                  autoFocus
                />
                <input
                  className="input"
                  type="password"
                  placeholder="Contraseña"
                  value={pass}
                  onChange={(e) => { setPass(e.target.value); setError(false) }}
                  onKeyDown={handleKeyDown}
                  style={{ fontSize: 13, padding: "10px 14px" }}
                />
                {error && (
                  <div style={{
                    fontSize: 12,
                    color: "#E74C3C",
                    fontWeight: 500,
                    padding: "6px 0",
                  }}>
                    Credenciales incorrectas
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 4, padding: "10px 16px" }}
                  onClick={handleLogin}
                >
                  Entrar
                </button>
              </div>
            ) : (
              <div className="col" style={{ gap: 12 }}>
                <div className="row" style={{ gap: 8 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    display: "grid",
                    placeItems: "center",
                  }}>
                    <Icon name="check" size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>admin</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Modo creador activo</div>
                  </div>
                </div>
                <button
                  className="btn btn-danger"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => { logout(); setShowPanel(false) }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
