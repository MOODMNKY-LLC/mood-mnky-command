import { handleBackofficeProxy } from "@/lib/backoffice-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleBackofficeProxy(request, path ?? [], "nextcloud");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleBackofficeProxy(request, path ?? [], "nextcloud");
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleBackofficeProxy(request, path ?? [], "nextcloud");
}
