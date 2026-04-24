// ============================================================
// Crypto-Heranca - TypeScript Tests (Anchor Test)
// 
// Testes completos para todas as instrucoes
// ============================================================

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CryptoHeranca } from "../target/types/crypto_heranca";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("crypto_heranca", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.CryptoHeranca as Program<CryptoHeranca>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;

  // Test accounts
  const owner = Keypair.generate();
  const heir1 = Keypair.generate();
  const heir2 = Keypair.generate();
  const keeper = Keypair.generate();

  // Vault PDA
  let vaultPda: PublicKey;
  let vaultBump: number;
  const seed = new anchor.BN(0);

  // Token mint (fake USDC)
  let mint: PublicKey;
  let ownerAta: PublicKey;
  let vaultAta: PublicKey;

  before(async () => {
    // Airdrop SOL to all accounts
    const airdropPromises = [
      owner, heir1, heir2, keeper,
    ].map(async (kp) => {
      const sig = await connection.requestAirdrop(kp.publicKey, 10 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig);
    });
    await Promise.all(airdropPromises);

    // Derive vault PDA
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        owner.publicKey.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // Create fake USDC mint
    mint = await createMint(
      connection,
      owner,
      owner.publicKey,
      null,
      6
    );

    // Create ATAs
    const ownerAtaAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      mint,
      owner.publicKey
    );
    ownerAta = ownerAtaAccount.address;

    // Mint some tokens to owner
    await mintTo(
      connection,
      owner,
      mint,
      ownerAta,
      owner.publicKey,
      1_000_000_000 // 1000 tokens with 6 decimals
    );
  });

  // ============================================================
  // 1. Initialize Vault
  // ============================================================
  it("Initialize vault", async () => {
    const inactivityPeriod = new anchor.BN(30 * 24 * 60 * 60); // 30 days
    const keeperFeeBps = 100; // 1%
    const gasReserve = new anchor.BN(0.01 * LAMPORTS_PER_SOL);

    const heirs = [
      {
        wallet: heir1.publicKey,
        asset: SystemProgram.programId,
        allocationType: { percentage: {} },
        allocationValue: new anchor.BN(5000), // 50%
      },
      {
        wallet: heir2.publicKey,
        asset: SystemProgram.programId,
        allocationType: { percentage: {} },
        allocationValue: new anchor.BN(5000), // 50%
      },
    ];

    await program.methods
      .initializeVault(
        seed,
        inactivityPeriod,
        heirs,
        keeperFeeBps,
        gasReserve
      )
      .accounts({
        owner: owner.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const vault = await program.account.vault.fetch(vaultPda);
    
    assert.equal(vault.owner.toBase58(), owner.publicKey.toBase58());
    assert.equal(vault.inactivityPeriod.toNumber(), inactivityPeriod.toNumber());
    assert.equal(vault.heirs.length, 2);
    assert.deepEqual(vault.status, { active: {} });
    assert.equal(vault.bump, vaultBump);
    assert.equal(vault.keeperFeeBps, keeperFeeBps);
  });

  // ============================================================
  // 2. Deposit SOL
  // ============================================================
  it("Deposit SOL", async () => {
    const depositAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);

    await program.methods
      .depositSol(depositAmount)
      .accounts({
        owner: owner.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const vaultBalance = await connection.getBalance(vaultPda);
    assert.isAtLeast(vaultBalance, depositAmount.toNumber());
  });

  // ============================================================
  // 3. Initialize Token Account
  // ============================================================
  it("Initialize token account for vault", async () => {
    // Derive vault ATA
    const [vaultAtaPda] = PublicKey.findProgramAddressSync(
      [
        vaultPda.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    vaultAta = vaultAtaPda;

    await program.methods
      .initializeTokenAccount()
      .accounts({
        owner: owner.publicKey,
        vault: vaultPda,
        mint: mint,
        vaultAta: vaultAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([owner])
      .rpc();

    const vaultAtaAccount = await connection.getTokenAccountBalance(vaultAta);
    assert.equal(vaultAtaAccount.value.uiAmount, 0);
  });

  // ============================================================
  // 4. Deposit Tokens
  // ============================================================
  it("Deposit tokens", async () => {
    const depositAmount = new anchor.BN(500_000_000); // 500 tokens

    await program.methods
      .depositToken(depositAmount)
      .accounts({
        owner: owner.publicKey,
        vault: vaultPda,
        mint: mint,
        ownerAta: ownerAta,
        vaultAta: vaultAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([owner])
      .rpc();

    const vaultAtaAccount = await connection.getTokenAccountBalance(vaultAta);
    assert.equal(vaultAtaAccount.value.amount, depositAmount.toString());
  });

  // ============================================================
  // 5. Heartbeat by owner
  // ============================================================
  it("Heartbeat by owner", async () => {
    await program.methods
      .heartbeat(null)
      .accounts({
        executor: owner.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const vault = await program.account.vault.fetch(vaultPda);
    const currentTime = Math.floor(Date.now() / 1000);
    assert.isAtMost(currentTime - vault.lastHeartbeat.toNumber(), 60);
  });

  // ============================================================
  // 6. Update config
  // ============================================================
  it("Update config by owner", async () => {
    const newKeeperFee = 200; // 2%
    const newGasReserve = new anchor.BN(0.02 * LAMPORTS_PER_SOL);

    await program.methods
      .updateConfig(
        null,
        null,
        newKeeperFee,
        newGasReserve
      )
      .accounts({
        owner: owner.publicKey,
        vault: vaultPda,
      })
      .signers([owner])
      .rpc();

    const vault = await program.account.vault.fetch(vaultPda);
    assert.equal(vault.keeperFeeBps, newKeeperFee);
    assert.equal(vault.gasReserveLamports.toNumber(), newGasReserve.toNumber());
  });

  // ============================================================
  // 7. Claim fails before timer expires
  // ============================================================
  it("Claim fails before timer expires", async () => {
    try {
      await program.methods
        .claim()
        .accounts({
          executor: keeper.publicKey,
          vault: vaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([keeper])
        .rpc();
      
      assert.fail("Should have thrown error");
    } catch (error) {
      assert.include(error.toString(), "TimerNotExpired");
    }
  });

  // ============================================================
  // 8. Full claim flow (time warp)
  // ============================================================
  it("Claim after timer expires", async () => {
    // Get vault state to know inactivity period
    const vaultBefore = await program.account.vault.fetch(vaultPda);
    const inactivityPeriod = vaultBefore.inactivityPeriod.toNumber();

    // Warp time forward past inactivity period
    // We do this by creating a new slot with advanced timestamp
    const latestBlockhash = await connection.getLatestBlockhash();
    
    // Advance time by creating dummy transactions
    // Note: In localnet, we can advance time by requesting multiple airdrops
    // which creates new blocks
    for (let i = 0; i < 5; i++) {
      await connection.requestAirdrop(Keypair.generate().publicKey, 1);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Get heir balances before claim
    const heir1BalanceBefore = await connection.getBalance(heir1.publicKey);
    const heir2BalanceBefore = await connection.getBalance(heir2.publicKey);

    // Wait until timer expires
    let elapsed = 0;
    while (elapsed < inactivityPeriod + 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      elapsed += 1;
      
      // Check if we can claim now
      try {
        await program.methods
          .claim()
          .accounts({
            executor: keeper.publicKey,
            vault: vaultPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            heir0: heir1.publicKey,
            heir1: heir2.publicKey,
            heir2: null,
            heir3: null,
            heir4: null,
            heir5: null,
            heir6: null,
            heir7: null,
            heir8: null,
            heir9: null,
          })
          .signers([keeper])
          .rpc();
        break;
      } catch (e) {
        // Continue waiting
      }
    }

    const heir1BalanceAfter = await connection.getBalance(heir1.publicKey);
    const heir2BalanceAfter = await connection.getBalance(heir2.publicKey);

    // Verify heirs received SOL
    assert.isAbove(heir1BalanceAfter, heir1BalanceBefore, "Heir 1 should have received SOL");
    assert.isAbove(heir2BalanceAfter, heir2BalanceBefore, "Heir 2 should have received SOL");

    // Verify vault status
    const vaultAfter = await program.account.vault.fetch(vaultPda);
    assert.deepEqual(vaultAfter.status, { claimed: {} });
  });

  // ============================================================
  // 9. Operations fail after claim
  // ============================================================
  it("Deposit fails after vault is claimed", async () => {
    try {
      await program.methods
        .depositSol(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          owner: owner.publicKey,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([owner])
        .rpc();
      
      assert.fail("Should have thrown error");
    } catch (error) {
      assert.include(error.toString(), "VaultNotActive");
    }
  });

  // ============================================================
  // 10. Unauthorized operations fail
  // ============================================================
  it("Unauthorized update config fails", async () => {
    const attacker = Keypair.generate();
    await connection.requestAirdrop(attacker.publicKey, 1 * LAMPORTS_PER_SOL);

    try {
      await program.methods
        .updateConfig(null, null, 100, null)
        .accounts({
          owner: attacker.publicKey,
          vault: vaultPda,
        })
        .signers([attacker])
        .rpc();
      
      assert.fail("Should have thrown error");
    } catch (error) {
      assert.include(error.toString(), "Unauthorized");
    }
  });
});
