/**
 * Adobe PDF Services API client for HTML-to-PDF conversion.
 * Used for formula export and document generation.
 * See: https://developer.adobe.com/document-services/docs/overview/pdf-services-api/
 */

import { Readable } from "node:stream"
import {
  PDFServices,
  ServicePrincipalCredentials,
  MimeType,
  HTMLToPDFJob,
  HTMLToPDFResult,
  type StreamAsset,
} from "@adobe/pdfservices-node-sdk"

function getConfig() {
  const clientId =
    process.env.PDF_SERVICES_CLIENT_ID ?? process.env.ADOBE_CLIENT_ID
  const clientSecret =
    process.env.PDF_SERVICES_CLIENT_SECRET ?? process.env.ADOBE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error(
      "PDF_SERVICES_CLIENT_ID and PDF_SERVICES_CLIENT_SECRET (or ADOBE_*) must be set"
    )
  }
  return { clientId, clientSecret }
}

/**
 * Convert HTML string to PDF buffer using Adobe PDF Services.
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const { clientId, clientSecret } = getConfig()
  const credentials = new ServicePrincipalCredentials({
    clientId,
    clientSecret,
  })
  const pdfServices = new PDFServices({ credentials })

  const readStream = Readable.from([html])

  const inputAsset = await pdfServices.upload({
    readStream,
    mimeType: MimeType.HTML,
  })

  const job = new HTMLToPDFJob({ inputAsset })
  const pollingURL = await pdfServices.submit({ job })

  const response = await pdfServices.getJobResult({
    pollingURL,
    resultType: HTMLToPDFResult,
  })

  const resultAsset = response.result.asset
  const streamAsset: StreamAsset = await pdfServices.getContent({
    asset: resultAsset,
  })

  const chunks: Buffer[] = []
  const stream = streamAsset.readStream as NodeJS.ReadableStream
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk: Buffer | Uint8Array) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    )
    stream.on("end", resolve)
    stream.on("error", reject)
  })
  return Buffer.concat(chunks)
}
