import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import path from "path"
import os from "os"

const execAsync = promisify(exec)

export async function runPythonScript({
  code,
  userVars = {},
  appletVars = {},
  inputFilePath = "",
}: {
  code: string
  userVars?: Record<string, string>
  appletVars?: Record<string, string>
  inputFilePath?: string
}): Promise<{ stdout: string; stderr: string; outputDir: string }> {
  // Create a unique temporary directory for this execution
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcm_run_"))
  const outputDir = path.join(tmpDir, "output")
  await fs.mkdir(outputDir, { recursive: true })

  // Combine variables into a single context
  const mcmVars = {
    ...appletVars,
    ...userVars,
  }

  // Inject variables at the top of the python script
  const injectedContext = `
# --- INYECTADO POR EL MOTOR MCM ---
import json
import os

mcm_vars = json.loads('''${JSON.stringify(mcmVars).replace(/'/g, "\\'")}''')
mcm_input_file = r"${inputFilePath}"
mcm_output_dir = r"${outputDir}"

# Create output dir if it doesn't exist
os.makedirs(mcm_output_dir, exist_ok=True)
# ----------------------------------
`

  const finalCode = injectedContext + "\n" + code

  const scriptPath = path.join(tmpDir, "script.py")
  await fs.writeFile(scriptPath, finalCode, "utf8")

  try {
    // Execute the script
    const { stdout, stderr } = await execAsync(`python "${scriptPath}"`)
    
    // We return the paths so the caller can zip or read the outputDir,
    // and eventually clean up the tmpDir.
    return {
      stdout,
      stderr,
      outputDir,
    }
  } catch (error: any) {
    // Return stderr if execution failed
    return {
      stdout: error.stdout || "",
      stderr: error.stderr || error.message,
      outputDir,
    }
  }
}

export async function cleanupRun(outputDir: string) {
  try {
    const parentDir = path.dirname(outputDir)
    await fs.rm(parentDir, { recursive: true, force: true })
  } catch (e) {
    console.error("Error cleaning up", e)
  }
}
