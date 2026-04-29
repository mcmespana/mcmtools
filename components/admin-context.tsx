"use client"

import { createContext, useContext, useState, useEffect } from "react"

type AdminContextType = {
  isAdmin: boolean
  login: (user: string, pass: string) => boolean
  logout: () => void
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  login: () => false,
  logout: () => {},
})

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(localStorage.getItem("mcm-admin") === "1")
  }, [])

  const login = (user: string, pass: string): boolean => {
    if (user === "admin" && pass === "admin") {
      localStorage.setItem("mcm-admin", "1")
      setIsAdmin(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem("mcm-admin")
    setIsAdmin(false)
  }

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
