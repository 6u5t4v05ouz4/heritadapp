import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import idl from "./idl/crypto_heranca.json";

export const PROGRAM_ID = new PublicKey(
  "8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX"
);

export const NETWORK = "devnet";

export function getConnection() {
  return new Connection(clusterApiUrl("devnet"), "confirmed");
}

export function getProgram(connection: Connection, provider?: AnchorProvider) {
  const progProvider =
    provider ??
    new AnchorProvider(connection, {} as any, AnchorProvider.defaultOptions());
  return new Program(idl as Idl, progProvider);
}

export function getProvider(
  connection: Connection,
  wallet: any
): AnchorProvider {
  return new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
}
