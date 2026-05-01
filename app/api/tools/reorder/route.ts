import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { tools } = await req.json()
    if (!Array.isArray(tools)) {
      return NextResponse.json({ error: "Invalid tools array" }, { status: 400 })
    }

    // Process them in a single transaction-like batch
    const queries = tools.map((t) => 
      sql`UPDATE tools SET position = ${t.position} WHERE id = ${t.id}`
    )
    
    await Promise.all(queries)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Error reordering tools:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
