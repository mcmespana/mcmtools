import type { CSSProperties, ReactNode, DragEvent, MouseEvent } from "react"

export function Bento({
  children,
  className = "",
  style = {},
  hoverLift = false,
  draggable,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  hoverLift?: boolean
  draggable?: boolean
  onClick?: (e: MouseEvent) => void
  onMouseEnter?: (e: MouseEvent) => void
  onMouseLeave?: (e: MouseEvent) => void
  onDragStart?: (e: DragEvent) => void
  onDragOver?: (e: DragEvent) => void
  onDragEnter?: (e: DragEvent) => void
  onDragLeave?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
  onDragEnd?: (e: DragEvent) => void
}) {
  return (
    <div
      className={`bento ${hoverLift ? "hover-lift" : ""} ${className}`}
      style={style}
      draggable={draggable}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
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
