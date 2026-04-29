import type { CSSProperties, ReactNode, DragEvent, MouseEvent } from "react"

export function Bento({
  children,
  className = "",
  style = {},
  hoverLift = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  hoverLift?: boolean
  onClick?: (e: MouseEvent) => void
  onMouseEnter?: (e: MouseEvent) => void
  onMouseLeave?: (e: MouseEvent) => void
  onDragOver?: (e: DragEvent) => void
  onDragEnter?: (e: DragEvent) => void
  onDragLeave?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
}) {
  return (
    <div
      className={`bento ${hoverLift ? "hover-lift" : ""} ${className}`}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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
