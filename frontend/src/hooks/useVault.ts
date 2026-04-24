"use client";

import { useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
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

export function useVault() {
  const { program, publicKey, wallet } = useProgram();
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

      const tx = await (program as any).methods
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
        .rpc({ skipPreflight: true, commitment: "confirmed" });

      return { tx, vaultPDA };
    },
    [program, publicKey, getVaultPDA]
  );

  const depositSol = useCallback(
    async (vaultPDA: PublicKey, amountSol: number) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

      const tx = await (program as any).methods
        .depositSol(new BN(amountLamports))
        .accounts({
          owner: publicKey,
          vault: vaultPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ skipPreflight: true, commitment: "confirmed" });

      return tx;
    },
    [program, publicKey]
  );

  const depositToken = useCallback(
    async (vaultPDA: PublicKey, mint: PublicKey, amount: number) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      const ownerAta = getAssociatedTokenAddressSync(mint, publicKey);
      const vaultAta = getAssociatedTokenAddressSync(mint, vaultPDA, true);

      const tx = await (program as any).methods
        .depositToken(new BN(amount))
        .accounts({
          owner: publicKey,
          vault: vaultPDA,
          mint,
          ownerAta,
          vaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ skipPreflight: true, commitment: "confirmed" });

      return tx;
    },
    [program, publicKey]
  );

  const heartbeat = useCallback(
    async (vaultPDA: PublicKey, proof?: Uint8Array) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      const tx = await (program as any).methods
        .heartbeat(proof || null)
        .accounts({
          executor: publicKey,
          vault: vaultPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ skipPreflight: true, commitment: "confirmed" });

      return tx;
    },
    [program, publicKey]
  );

  const cancelVault = useCallback(
    async (vaultPDA: PublicKey) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      const tx = await (program as any).methods
        .cancelVault()
        .accounts({
          owner: publicKey,
          vault: vaultPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ skipPreflight: true, commitment: "confirmed" });

      return tx;
    },
    [program, publicKey]
  );

  const claim = useCallback(
    async (vaultPDA: PublicKey, heirs?: PublicKey[]) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      const remainingAccounts =
        heirs?.map((h) => ({ pubkey: h, isWritable: true, isSigner: false })) ||
        [];

      const tx = await (program as any).methods
        .claim()
        .accounts({
          executor: publicKey,
          vault: vaultPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
        .rpc({ skipPreflight: true, commitment: "confirmed" });

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
