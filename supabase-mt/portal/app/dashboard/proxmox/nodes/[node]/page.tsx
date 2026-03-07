import { ProxmoxNodeSummary } from "@/components/proxmox/proxmox-node-summary";

type Props = { params: Promise<{ node: string }> };

export default async function ProxmoxNodePage({ params }: Props) {
  const { node } = await params;
  return <ProxmoxNodeSummary node={node} />;
}
