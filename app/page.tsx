import { listTools } from "@/lib/db"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const tools = await listTools()
  return <DashboardClient initialTools={tools} />
}
