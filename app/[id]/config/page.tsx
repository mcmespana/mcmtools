import { notFound } from "next/navigation"
import { getTool } from "@/lib/db"
import { ToolConfigView } from "@/components/config/tool-config"

export const dynamic = "force-dynamic"

export default async function ToolConfigPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tool = await getTool(id)
  if (!tool) notFound()
  return <ToolConfigView tool={tool} />
}
