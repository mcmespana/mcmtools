import type { CSSProperties, ReactNode } from "react"

export function Bento({
  children,
  className = "",
  style = {},
  hoverLift = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  hoverLift?: boolean
  onClick?: (e: React.MouseEvent) => void
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: (e: React.MouseEvent) => void
}) {
  return (
    <div
      className={`bento ${hoverLift ? "hover-lift" : ""} ${className}`}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="grain" />
      {children}
    </div>
  )
}

export function Kicker({
  children,
  style = {},
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div className="t-kicker" style={style}>
      {children}
    </div>
  )
}
