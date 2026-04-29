"use client"

import { useRef, useCallback, useState } from "react"
import dynamic from "next/dynamic"
import { Icon } from "@/components/icon"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

type CodeEditorProps = {
  value: string
  onChange: (code: string) => void
  height?: string | number
  readOnly?: boolean
}

export function CodeEditor({ value, onChange, height = 400, readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<any>(null)
  const [copied, setCopied] = useState(false)

  const handleMount = useCallback((editor: any) => {
    editorRef.current = editor
    editor.focus()
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="monaco-wrapper" style={{ position: "relative" }}>
      <button
        onClick={copyToClipboard}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 10,
          background: "var(--surface-3)",
          color: "var(--text-2)",
          border: "none",
          padding: "6px 10px",
          borderRadius: 8,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        <Icon name={copied ? "check" : "copy"} size={14} />
        {copied ? "Copiado" : "Copiar"}
      </button>
      <MonacoEditor
        height={height}
        defaultLanguage="python"
        value={value}
        onChange={(val) => onChange(val ?? "")}
        onMount={handleMount}
        theme="mcm-dark"
        beforeMount={(monaco) => {
          monaco.editor.defineTheme("mcm-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
              { token: "comment", foreground: "6a737d", fontStyle: "italic" },
              { token: "keyword", foreground: "c792ea" },
              { token: "string", foreground: "a5d6a7" },
              { token: "number", foreground: "f78c6c" },
              { token: "type", foreground: "82aaff" },
              { token: "identifier", foreground: "e0e0e0" },
            ],
            colors: {
              "editor.background": "#1a1a1a",
              "editor.foreground": "#e0e0e0",
              "editor.lineHighlightBackground": "#ffffff08",
              "editor.selectionBackground": "#6C5CE740",
              "editorCursor.foreground": "#6C5CE7",
              "editorLineNumber.foreground": "#444444",
              "editorLineNumber.activeForeground": "#888888",
              "editor.inactiveSelectionBackground": "#6C5CE720",
            },
          })
        }}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          fontLigatures: false,
          minimap: { enabled: false },
          lineNumbers: "on",
          renderLineHighlight: "line",
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          tabSize: 4,
          insertSpaces: true,
          wordWrap: "on",
          readOnly,
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          guides: {
            indentation: true,
            bracketPairs: false,
          },
        }}
      />
    </div>
  )
}
