import { clusterApiUrl } from "@solana/web3.js";

const EXPLORER_BASE = "https://explorer.solana.com";
const SOLSCAN_BASE = "https://solscan.io";

export function getTxExplorerUrl(
  signature: string,
  cluster: "devnet" | "mainnet-beta" = "devnet",
  provider: "solana" | "solscan" = "solana"
): string {
  const clusterParam = cluster === "devnet" ? "?cluster=devnet" : "";
  if (provider === "solscan") {
    return `${SOLSCAN_BASE}/tx/${signature}${clusterParam.replace("?", "?")}`;
  }
  return `${EXPLORER_BASE}/tx/${signature}${clusterParam}`;
}

export function getAddressExplorerUrl(
  address: string,
  cluster: "devnet" | "mainnet-beta" = "devnet",
  provider: "solana" | "solscan" = "solana"
): string {
  const clusterParam = cluster === "devnet" ? "?cluster=devnet" : "";
  if (provider === "solscan") {
    return `${SOLSCAN_BASE}/account/${address}${clusterParam.replace("?", "?")}`;
  }
  return `${EXPLORER_BASE}/address/${address}${clusterParam}`;
}

export function getClusterName(cluster: string): string {
  switch (cluster) {
    case "devnet":
      return "Devnet";
    case "mainnet-beta":
      return "Mainnet";
    case "testnet":
      return "Testnet";
    default:
      return cluster;
  }
}
