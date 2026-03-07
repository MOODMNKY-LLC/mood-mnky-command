import { ProxmoxOverview } from "@/components/proxmox/proxmox-overview";

type Props = { searchParams: Promise<{ node?: string }> };

export default async function ProxmoxOverviewPage({ searchParams }: Props) {
  const { node } = await searchParams;
  return <ProxmoxOverview selectedNode={node ?? null} />;
}
