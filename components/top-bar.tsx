"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Icon } from "./icon"
import { useAdmin } from "./admin-context"

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const t = (document.documentElement.getAttribute("data-theme") as "dark" | "light") ?? "dark"
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
      <span style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>{theme}</span>
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
      <div className="row" style={{ gap: 12 }}>
        <div
          className="row"
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            fontSize: 12,
            color: "var(--text-3)",
            gap: 8,
          }}
        >
          <Icon name="search" size={13} />
          <span className="t-mono" style={{ fontSize: 11 }}>
            {"\u2318K"}
          </span>
        </div>
        <ThemeToggle />
        <AdminMenu />
      </div>
    </div>
  )
}

function AdminMenu() {
  const { isAdmin, login, logout } = useAdmin()
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowAdminLogin(!showAdminLogin)}
        className="btn btn-ghost"
        style={{ padding: "8px 10px", color: isAdmin ? "var(--accent)" : "var(--text-3)" }}
      >
        <Icon name={isAdmin ? "unlock" : "lock"} size={16} />
      </button>

      {showAdminLogin && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            padding: 16,
            borderRadius: 16,
            width: 220,
            zIndex: 50,
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)"
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {isAdmin ? "Opciones de Admin" : "Acceso Admin"}
          </div>

          {!isAdmin ? (
            <div className="col" style={{ gap: 8 }}>
              <input className="input" placeholder="Usuario" style={{ fontSize: 13, padding: "8px 12px" }} />
              <input className="input" type="password" placeholder="Contraseña" style={{ fontSize: 13, padding: "8px 12px" }} />
              <button 
                className="btn btn-primary" 
                style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                onClick={() => { login(); setShowAdminLogin(false) }}
              >
                Entrar
              </button>
            </div>
          ) : (
            <button 
              className="btn" 
              style={{ width: "100%", justifyContent: "center", color: "#FF6B4A" }}
              onClick={() => { logout(); setShowAdminLogin(false) }}
            >
              Cerrar sesión
            </button>
          )}
        </div>
      )}
    </div>
  )
}
