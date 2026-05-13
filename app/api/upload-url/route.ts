import { NextResponse } from "next/server"
import { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from "@azure/storage-blob"

const CONTAINER = "mcmtools-uploads"
const SAS_TTL_MINUTES = 15

export async function POST(req: Request) {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!connStr) {
    return NextResponse.json(
      { error: "AZURE_STORAGE_CONNECTION_STRING no configurada" },
      { status: 500 }
    )
  }

  try {
    const { filename } = await req.json()
    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "filename requerido" }, { status: 400 })
    }

    // Sanitize filename and create a unique blob name
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
    const blobName = `${Date.now()}_${safe}`

    const serviceClient = BlobServiceClient.fromConnectionString(connStr)
    const containerClient = serviceClient.getContainerClient(CONTAINER)

    // Auto-create container if it doesn't exist (private access)
    await containerClient.createIfNotExists({ access: "blob" })

    // Parse account name and key from connection string for SAS generation
    const accountNameMatch = connStr.match(/AccountName=([^;]+)/)
    const accountKeyMatch = connStr.match(/AccountKey=([^;]+)/)
    if (!accountNameMatch || !accountKeyMatch) {
      return NextResponse.json({ error: "Connection string inválida" }, { status: 500 })
    }
    const accountName = accountNameMatch[1]
    const accountKey = accountKeyMatch[1]

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)

    const expiresOn = new Date()
    expiresOn.setMinutes(expiresOn.getMinutes() + SAS_TTL_MINUTES)

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: CONTAINER,
        blobName,
        permissions: BlobSASPermissions.parse("rcw"), // read, create, write
        expiresOn,
      },
      sharedKeyCredential
    ).toString()

    const blobUrl = `https://${accountName}.blob.core.windows.net/${CONTAINER}/${blobName}?${sasToken}`

    return NextResponse.json({ uploadUrl: blobUrl, blobName })
  } catch (err: any) {
    console.error("[upload-url]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
