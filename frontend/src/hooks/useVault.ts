"use client";

import { useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useProgram } from "./useProgram";

export interface HeirInput {
  wallet: string;
  asset: string;
  allocationType: { percentage: {} } | { fixedAmount: {} };
  allocationValue: number;
}

// Helper para retry com backoff
async function retryRpc(
  fn: () => Promise<string>,
  maxRetries = 3,
  delayMs = 1000
): Promise<string> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      
      // Não retry em erros de negócio
      if (err.message?.includes("InvalidInactivityPeriod")) throw err;
      if (err.message?.includes("TimerNotExpired")) throw err;
      if (err.message?.includes("VaultNotActive")) throw err;
      if (err.message?.includes("Unauthorized")) throw err;
      
      // Retry em erros de conexão/wallet
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

export function useVault() {
  const { program, publicKey } = useProgram();
  const { connection } = useConnection();

  const getVaultPDA = useCallback(
    (owner: PublicKey, seed: number) => {
      if (!program) return null;
      const [pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vault"),
          owner.toBuffer(),
          Buffer.from(new BigUint64Array([BigInt(seed)]).buffer),
        ],
        program.programId
      );
      return pda;
    },
    [program]
  );

  const initializeVault = useCallback(
    async (
      seed: number,
      inactivityPeriodMinutes: number,
      heirs: HeirInput[],
      keeperFeeBps: number = 100,
      gasReserveSol: number = 0.01
    ) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      const vaultPDA = getVaultPDA(publicKey, seed);
      if (!vaultPDA) throw new Error("Failed to derive vault PDA");

      const inactivityPeriodSeconds = Math.floor(
        inactivityPeriodMinutes * 60
      );
      const gasReserveLamports = Math.floor(gasReserveSol * LAMPORTS_PER_SOL);

      const tx = await retryRpc(() =>
        (program as any).methods
          .initializeVault(
            new BN(seed),
            new BN(inactivityPeriodSeconds),
            heirs.map((h) => ({
              wallet: new PublicKey(h.wallet),
              asset: new PublicKey(h.asset),
              allocationType: h.allocationType,
              allocationValue: new BN(h.allocationValue),
            })),
            keeperFeeBps,
            new BN(gasReserveLamports)
          )
          .accounts({
            owner: publicKey,
            vault: vaultPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ skipPreflight: true, commitment: "confirmed" })
      );

      return { tx, vaultPDA };
    },
    [program, publicKey, getVaultPDA]
  );

  const depositSol = useCallback(
    async (vaultPDA: PublicKey, amountSol: number) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

      const tx = await retryRpc(() =>
        (program as any).methods
          .depositSol(new BN(amountLamports))
          .accounts({
            owner: publicKey,
            vault: vaultPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ skipPreflight: true, commitment: "confirmed" })
      );

      return tx;
    },
    [program, publicKey]
  );

  const depositToken = useCallback(
    async (vaultPDA: PublicKey, mint: PublicKey, amount: number) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      const ownerAta = getAssociatedTokenAddressSync(mint, publicKey);
      const vaultAta = getAssociatedTokenAddressSync(mint, vaultPDA, true);

      const tx = await retryRpc(() =>
        (program as any).methods
          .depositToken(new BN(amount))
          .accounts({
            owner: publicKey,
            vault: vaultPDA,
            mint,
            ownerAta,
            vaultAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc({ skipPreflight: true, commitment: "confirmed" })
      );

      return tx;
    },
    [program, publicKey]
  );

  const heartbeat = useCallback(
    async (vaultPDA: PublicKey, proof?: Uint8Array) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      const tx = await retryRpc(() =>
        (program as any).methods
          .heartbeat(proof || null)
          .accounts({
            executor: publicKey,
            vault: vaultPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ skipPreflight: true, commitment: "confirmed" })
      );

      return tx;
    },
    [program, publicKey]
  );

  const cancelVault = useCallback(
    async (vaultPDA: PublicKey) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      const tx = await retryRpc(() =>
        (program as any).methods
          .cancelVault()
          .accounts({
            owner: publicKey,
            vault: vaultPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ skipPreflight: true, commitment: "confirmed" })
      );

      return tx;
    },
    [program, publicKey]
  );

  const claim = useCallback(
    async (vaultPDA: PublicKey, heirs?: PublicKey[]) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      // Montar accounts object com heirs nas posições corretas
      const accounts: any = {
        executor: publicKey,
        vault: vaultPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      };

      // Adicionar herdeiros como heir0, heir1, etc. (camelCase no Anchor 0.32)
      if (heirs) {
        for (let i = 0; i < 10; i++) {
          accounts[`heir${i}`] = heirs[i] || null;
        }
      }

      const tx = await retryRpc(() =>
        (program as any).methods
          .claim()
          .accounts(accounts)
          .rpc({ skipPreflight: true, commitment: "confirmed" })
      );

      return tx;
    },
    [program, publicKey]
  );

  const fetchVault = useCallback(
    async (vaultPDA: PublicKey) => {
      if (!program) return null;
      try {
        const account = await (program as any).account.vault.fetch(vaultPDA);
        return account;
      } catch {
        return null;
      }
    },
    [program]
  );

  const fetchVaultsByOwner = useCallback(
    async (owner?: PublicKey) => {
      if (!program) return [];
      const target = owner || publicKey;
      if (!target) return [];

      try {
        const allVaults = await (program as any).account.vault.all();
        return allVaults.filter(
          (v: any) => v.account.owner.toBase58() === target.toBase58()
        );
      } catch {
        return [];
      }
    },
    [program, publicKey]
  );

  return {
    initializeVault,
    depositSol,
    depositToken,
    heartbeat,
    cancelVault,
    claim,
    fetchVault,
    fetchVaultsByOwner,
    getVaultPDA,
    program,
    publicKey,
    connected: !!publicKey,
  };
}
