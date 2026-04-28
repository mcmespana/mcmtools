import { notFound } from "next/navigation"
import { getTool, getToolStats } from "@/lib/db"
import { ToolRun } from "@/components/run/tool-run"

export const dynamic = "force-dynamic"

export default async function ToolRunPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tool = await getTool(id)
  if (!tool) notFound()
  const stats = await getToolStats(id)
  return <ToolRun tool={tool} stats={stats} />
}
