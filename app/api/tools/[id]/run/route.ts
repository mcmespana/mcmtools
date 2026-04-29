import { NextResponse } from "next/server"
import { getTool, recordRun } from "@/lib/db"
import { runPythonScript, cleanupRun } from "@/lib/python-runner"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  let tmpInputDir: string | null = null

  try {
    const { id } = params
    const tool = await getTool(id)

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 })
    }

    // Parse incoming FormData (file + userVars JSON)
    const formData = await req.formData()
    const userVarsRaw = formData.get("userVars")
    const userVars: Record<string, string> = userVarsRaw
      ? JSON.parse(userVarsRaw as string)
      : {}

    // Save the uploaded file to a temp location if present
    let inputFilePath = ""
    const uploadedFile = formData.get("file") as File | null
    if (uploadedFile && uploadedFile.size > 0) {
      tmpInputDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcm_input_"))
      const inputPath = path.join(tmpInputDir, uploadedFile.name)
      const arrayBuffer = await uploadedFile.arrayBuffer()
      await fs.writeFile(inputPath, Buffer.from(arrayBuffer))
      inputFilePath = inputPath
    }

    let combinedStdout = ""
    let finalOutputDir = ""
    let hasErrors = false
    let lastStderr = ""

    // Execute each step that has Python code
    for (const step of tool.config.steps) {
      if (step.code && step.code.trim() !== "") {
        const appletVars = (step.variables || []).reduce(
          (acc: Record<string, string>, v) => ({ ...acc, [v.key]: v.value }),
          {}
        )

        const result = await runPythonScript({
          code: step.code,
          userVars,
          appletVars,
          inputFilePath,
        })

        combinedStdout += result.stdout
        finalOutputDir = result.outputDir

        if (result.stderr && result.stderr.trim()) {
          console.error(`[mcm] Step [${step.id}] stderr:`, result.stderr)
          lastStderr = result.stderr
          hasErrors = true
        }
      }
    }

    // Record stats
    const duration = Date.now() - startTime
    await recordRun(tool.id, duration, 1, hasErrors ? 1 : 0)

    // Clean up input temp dir
    if (tmpInputDir) {
      await fs.rm(tmpInputDir, { recursive: true, force: true }).catch(() => {})
    }

    // If there were errors in any step, return error JSON
    if (hasErrors) {
      if (finalOutputDir) await cleanupRun(finalOutputDir)
      return NextResponse.json(
        { error: lastStderr || "Error durante la ejecución del script" },
        { status: 500 }
      )
    }

    // Serve response based on outputType
    const outputType = tool.config.outputType

    if (outputType === "Texto" || outputType === "JSON/Tabla") {
      // Return plain stdout
      if (finalOutputDir) await cleanupRun(finalOutputDir)
      return NextResponse.json({ success: true, stdout: combinedStdout.trim(), durationMs: duration })
    }

    // For Archivo / .zip: read files from output dir and serve as zip
    if (finalOutputDir) {
      let files: string[] = []
      try {
        files = await fs.readdir(finalOutputDir)
      } catch {}

      if (files.length === 0) {
        await cleanupRun(finalOutputDir)
        return NextResponse.json({ success: true, stdout: combinedStdout.trim(), durationMs: duration })
      }

      if (files.length === 1 && outputType === "Archivo") {
        // Return single file directly
        const filePath = path.join(finalOutputDir, files[0])
        const fileBuffer = await fs.readFile(filePath)
        await cleanupRun(finalOutputDir)
        return new Response(fileBuffer, {
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${files[0]}"`,
          },
        })
      }

      // Multiple files or .zip output type: compress and return
      const zipPath = path.join(os.tmpdir(), `mcm_out_${Date.now()}.zip`)
      await execAsync(`cd "${finalOutputDir}" && zip -r "${zipPath}" .`)
      const zipBuffer = await fs.readFile(zipPath)
      await fs.rm(zipPath, { force: true }).catch(() => {})
      await cleanupRun(finalOutputDir)

      return new Response(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="mcmtools_${id}_output.zip"`,
        },
      })
    }

    return NextResponse.json({ success: true, stdout: combinedStdout.trim(), durationMs: duration })
  } catch (error: any) {
    if (tmpInputDir) {
      await fs.rm(tmpInputDir, { recursive: true, force: true }).catch(() => {})
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
