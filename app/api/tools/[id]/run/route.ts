import { NextResponse } from "next/server"
import { getTool, recordRun } from "@/lib/db"

type RouteCtx = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: RouteCtx) {
  const startTime = Date.now()

  try {
    const { id } = await params
    const tool = await getTool(id)

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 })
    }

    // Parse incoming FormData
    const formData = await req.formData()
    const userVarsRaw = formData.get("userVars")
    const userVars: Record<string, string> = userVarsRaw
      ? JSON.parse(userVarsRaw as string)
      : {}
    const blobNamesRaw = formData.get("blobNames")
    const blobNames: string[] = blobNamesRaw ? JSON.parse(blobNamesRaw as string) : []

    // Merge user vars with system vars
    const systemVars: Record<string, string> = {}
    for (const sv of tool.config.systemVars || []) {
      systemVars[sv.key] = sv.value
    }
    const allVariables = { ...systemVars, ...userVars }

    // Read uploaded files
    const uploadedFiles = formData.getAll("files") as File[]
    const legacyFile = formData.get("file") as File | null
    if (legacyFile && uploadedFiles.length === 0) uploadedFiles.push(legacyFile)
    
    const inputFiles: { name: string; bytes: ArrayBuffer }[] = []
    for (const f of uploadedFiles) {
      if (f.size > 0) {
        inputFiles.push({ name: f.name || "archivo.bin", bytes: await f.arrayBuffer() })
      }
    }

    // Get the Python code from tool config
    const code = tool.config.code || ""

    if (!code.trim()) {
      return NextResponse.json({ error: "Esta herramienta no tiene código configurado" }, { status: 400 })
    }

    // Try Vercel Python endpoint first (production), fall back to local execution
    const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined

    let result: { output?: Uint8Array; filename?: string; stdout?: string; error?: string }

    if (isVercel) {
      // In Vercel: call the Python serverless function at /api/run
      const pyFormData = new FormData()
      pyFormData.append("code", code)
      pyFormData.append("variables", JSON.stringify(allVariables))
      // Si hay blobs en Azure, mandamos sus nombres (payload mínimo)
      if (blobNames.length > 0) {
        pyFormData.append("blobNames", JSON.stringify(blobNames))
        pyFormData.append("azureConnStr", process.env.AZURE_STORAGE_CONNECTION_STRING || "")
      }
      // Archivos pequeños que no fueron a Azure (o fallback sin Azure)
      uploadedFiles.forEach(f => {
        if (f.size > 0) pyFormData.append("files", f)
      })

      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"

      const pyHeaders: Record<string, string> = {}
      const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      if (bypassSecret) {
        pyHeaders["x-vercel-protection-bypass"] = bypassSecret
      }

      const pyRes = await fetch(`${baseUrl}/api/run`, {
        method: "POST",
        body: pyFormData,
        headers: pyHeaders,
      })

      if (!pyRes.ok) {
        const rawText = await pyRes.text()
        let errMsg = `Error en Python (${pyRes.status})`
        try {
          const errData = JSON.parse(rawText)
          errMsg = errData.traceback || errData.message || errMsg
        } catch {
          errMsg = rawText.slice(0, 500) || errMsg
        }
        console.error("[mcm] Python endpoint error:", errMsg)
        result = { error: errMsg }
      } else {
        const contentType = pyRes.headers.get("content-type") || ""
        if (contentType.includes("application/octet-stream")) {
          const buffer = await pyRes.arrayBuffer()
          const disposition = pyRes.headers.get("content-disposition") || ""
          const match = disposition.match(/filename="?([^"]+)"?/)
          result = {
            output: new Uint8Array(buffer),
            filename: match?.[1] || "resultado.bin",
          }
        } else {
          const data = await pyRes.json()
          result = { stdout: data.stdout ?? data.message ?? "Ejecutado correctamente" }
        }
      }
    } else {
      // Local development: use child_process
      result = await executeLocally(code, allVariables, inputFiles)
    }

    // Record stats
    const duration = Date.now() - startTime
    await recordRun(tool.id, duration, 1, result.error ? 1 : 0)

    // Return result
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    if (result.output) {
      const fname = result.filename || "resultado.bin"
      const ext = fname.split(".").pop()?.toLowerCase() || ""
      const mimeMap: Record<string, string> = {
        zip: "application/zip",
        pdf: "application/pdf",
        csv: "text/csv",
        json: "application/json",
        txt: "text/plain",
      }
      const mime = mimeMap[ext] || "application/octet-stream"
      
      return new Response(Buffer.from(result.output), {
        headers: {
          "Content-Type": mime,
          "Content-Disposition": `attachment; filename="${fname}"`,
          "Access-Control-Expose-Headers": "Content-Disposition",
        },
      })
    }

    return NextResponse.json({
      success: true,
      stdout: result.stdout || "",
      durationMs: duration,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Local execution via child_process (development only).
 * Writes a temp Python script, executes it, and reads output.
 */
async function executeLocally(
  code: string,
  variables: Record<string, string>,
  inputFiles: { name: string; bytes: ArrayBuffer }[]
): Promise<{ output?: Uint8Array; filename?: string; stdout?: string; error?: string }> {
  const { exec } = await import("child_process")
  const { promisify } = await import("util")
  const fs = await import("fs/promises")
  const path = await import("path")
  const os = await import("os")

  const execAsync = promisify(exec)
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcm_run_"))
  const outputDir = path.join(tmpDir, "output")
  const inputDir = path.join(tmpDir, "input")
  await fs.mkdir(outputDir, { recursive: true })
  await fs.mkdir(inputDir, { recursive: true })

  try {
    // Save input files
    for (const f of inputFiles) {
      await fs.writeFile(path.join(inputDir, f.name), Buffer.from(f.bytes))
    }

    // Build the Python script with injected context
    const injectedCode = `
import json, io, os, sys

# --- INJECTED BY MCM ENGINE ---
variables = json.loads('''${JSON.stringify(variables).replace(/'/g, "\\'")}''')

input_files = {}
_input_dir = r"${inputDir}"
if os.path.exists(_input_dir):
    for _fname in os.listdir(_input_dir):
        with open(os.path.join(_input_dir, _fname), "rb") as _f:
            input_files[_fname] = _f.read()

input_bytes = None
if len(input_files) > 0:
    input_bytes = list(input_files.values())[0]

output_file = None
output_filename = "resultado.bin"
_mcm_output_dir = r"${outputDir}"
os.makedirs(_mcm_output_dir, exist_ok=True)
# --- END INJECTION ---

${code}

# --- SAVE OUTPUT ---
if output_file is not None:
    _out_path = os.path.join(_mcm_output_dir, output_filename)
    with open(_out_path, "wb") as _f:
        _f.write(output_file if isinstance(output_file, bytes) else bytes(output_file))
`

    const scriptPath = path.join(tmpDir, "script.py")
    await fs.writeFile(scriptPath, injectedCode, "utf8")

    const { stdout, stderr } = await execAsync(`python "${scriptPath}"`, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    })

    if (stderr && stderr.trim()) {
      console.error("[mcm] Python stderr:", stderr)
    }

    // Check for output files
    const files = await fs.readdir(outputDir).catch(() => [] as string[])

    if (files.length > 0) {
      if (files.length === 1) {
        const filePath = path.join(outputDir, files[0])
        const fileBuffer = await fs.readFile(filePath)
        return { output: new Uint8Array(fileBuffer), filename: files[0] }
      } else {
        // Multiple files: zip them
        const zipPath = path.join(tmpDir, "output.zip")
        await execAsync(`cd "${outputDir}" && zip -r "${zipPath}" .`).catch(async () => {
          // Fallback for Windows: use PowerShell
          await execAsync(
            `powershell -Command "Compress-Archive -Path '${outputDir}\\*' -DestinationPath '${zipPath}'"`
          )
        })
        const zipBuffer = await fs.readFile(zipPath)
        return { output: new Uint8Array(zipBuffer), filename: `mcm_output.zip` }
      }
    }

    return { stdout: stdout.trim() }
  } catch (error: any) {
    return { error: error.stderr || error.message }
  } finally {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
