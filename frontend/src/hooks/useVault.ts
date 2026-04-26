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
      console.error(`[retryRpc] Attempt ${i + 1}/${maxRetries} failed:`, err.message, err);
      
      // Não retry em erros de negócio / programa
      if (err.message?.includes("InvalidInactivityPeriod")) throw err;
      if (err.message?.includes("TimerNotExpired")) throw err;
      if (err.message?.includes("VaultNotActive")) throw err;
      if (err.message?.includes("Unauthorized")) throw err;
      if (err.message?.includes("Unknown action")) throw err;
      if (err.message?.includes("already in use")) throw err;
      if (err.message?.includes("already been processed")) throw err;
      if (err.message?.includes("Program not deployed")) throw err;
      
      // Retry em erros de conexão/wallet
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

// Verifica se o programa está deployado na rede atual
async function verifyProgramDeployed(
  connection: any,
  programId: PublicKey
): Promise<void> {
  try {
    const accountInfo = await connection.getAccountInfo(programId);
    if (!accountInfo) {
      throw new Error(
        `Programa não encontrado na rede atual (${programId.toBase58()}). ` +
        `Verifique se: 1) Phantom está na Devnet, 2) O programa foi deployado.`
      );
    }
    if (!accountInfo.executable) {
      throw new Error(
        `Conta ${programId.toBase58()} existe mas não é um programa executável. ` +
        `Verifique se o Program ID está correto.`
      );
    }
    console.log("[verifyProgramDeployed] Programa encontrado e é executável:", programId.toBase58());
  } catch (err: any) {
    if (err.message?.includes("Programa não encontrado") || err.message?.includes("não é um programa")) {
      throw err;
    }
    console.error("[verifyProgramDeployed] Erro ao verificar programa:", err);
    // Não bloqueia em erros de conexão, deixa o fluxo continuar
  }
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

      // Verificar se o vault PDA já existe on-chain (previne erro opaco "Unknown action")
      const existingAccount = await connection.getAccountInfo(vaultPDA);
      if (existingAccount) {
        throw new Error(
          `Vault com seed ${seed} já existe! Use uma seed diferente.`
        );
      }

      const inactivityPeriodSeconds = Math.floor(
        inactivityPeriodMinutes * 60
      );
      const gasReserveLamports = Math.floor(gasReserveSol * LAMPORTS_PER_SOL);

      console.log("[initializeVault] Params:", {
        seed,
        inactivityPeriodSeconds,
        heirs: heirs.length,
        keeperFeeBps,
        gasReserveLamports,
        vaultPDA: vaultPDA.toBase58(),
        programId: program.programId.toBase58(),
      });

      // Verificar se o programa está realmente deployado na rede atual
      await verifyProgramDeployed(connection, program.programId);

      let tx: string;
      try {
        tx = await retryRpc(async () => {
          try {
            return await (program as any).methods
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
              .rpc({ skipPreflight: false, commitment: "confirmed" });
          } catch (rpcErr: any) {
            // Enriquecer erro opaco do Phantom com contexto útil
            if (rpcErr.message?.includes("Unknown action")) {
              throw new Error(
                `Phantom não conseguiu processar a transação. ` +
                `Causas prováveis: 1) Sua Phantom não está na Devnet — clique no menu da Phantom e mude para Devnet. ` +
                `2) O programa ${program.programId.toBase58()} não está deployado na rede atual. ` +
                `3) Conflito de extensão de wallet. Erro original: ${rpcErr.message}`
              );
            }
            throw rpcErr;
          }
        });
      } catch (retryErr: any) {
        // Recovery: se o vault PDA foi criado apesar do erro (ex: "already processed"),
        // consideramos sucesso e retornamos o PDA para o redirecionamento.
        const accountNow = await connection.getAccountInfo(vaultPDA);
        if (accountNow) {
          console.warn(
            `[initializeVault] Transação falhou com erro "${retryErr.message}" ` +
            `mas o vault PDA ${vaultPDA.toBase58()} existe. Considerando sucesso.`
          );
          return { tx: "", vaultPDA };
        }
        throw retryErr;
      }

      return { tx, vaultPDA };
    },
    [program, publicKey, getVaultPDA, connection]
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

      // Anchor 0.32 sentinel: use program ID for absent optional accounts
      const sentinel = program.programId;

      // Build accounts object - Anchor JS client auto-converts IDL snake_case
      // (heir_0) to camelCase (heir0), so we use camelCase here
      const accounts: any = {
        executor: publicKey,
        vault: vaultPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      };

      // Add ALL 10 heir slots — use program ID as sentinel for absent heirs
      for (let i = 0; i < 10; i++) {
        accounts[`heir${i}`] = heirs?.[i] || sentinel;
      }

      console.log("[CLAIM] Accounts passed to Anchor:", Object.fromEntries(
        Object.entries(accounts).map(([k, v]) => [k, (v as PublicKey)?.toBase58?.() || v])
      ));

      const tx = await retryRpc(() =>
        (program as any).methods
          .claim()
          .accounts(accounts)
          .rpc({ commitment: "confirmed" })
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
