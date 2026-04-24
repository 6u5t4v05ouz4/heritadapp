import {
  Connection,
  PublicKey,
  Keypair,
} from '@solana/web3.js';
import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import { config } from '../config';
import idl from './idl/crypto_heranca.json';

// Initialize connection
const connection = new Connection(config.SOLANA_RPC_URL, 'confirmed');

// Initialize keeper wallet (supports base58 or JSON array format)
function loadKeeperKeypair(privateKey: string): Keypair {
  try {
    // Try JSON array format first: [1,2,3,...]
    if (privateKey.startsWith('[')) {
      const secretKey = Uint8Array.from(JSON.parse(privateKey));
      return Keypair.fromSecretKey(secretKey);
    }
    // Try base58 format
    const secretKey = bs58.decode(privateKey);
    return Keypair.fromSecretKey(secretKey);
  } catch (err) {
    throw new Error(
      'Invalid KEEPER_PRIVATE_KEY format. Use base58 string or JSON array of bytes.'
    );
  }
}

const keeperKeypair = loadKeeperKeypair(config.KEEPER_PRIVATE_KEY);

const wallet = new Wallet(keeperKeypair);

// Initialize Anchor provider
const provider = new AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
});

// Initialize program
const program = new Program(idl as any, provider);

export { connection, keeperKeypair, program, provider };

// ============================================================
// Vault Types (from IDL)
// ============================================================
export interface Heir {
  wallet: PublicKey;
  asset: PublicKey;
  allocationType: { percentage?: {}; fixedAmount?: {} };
  allocationValue: BN;
}

export interface VaultAccount {
  owner: PublicKey;
  lastHeartbeat: BN;
  inactivityPeriod: BN;
  heirs: Heir[];
  assets: PublicKey[];
  keeperFeeBps: number;
  gasReserveLamports: BN;
  status: { active?: {}; claimed?: {}; cancelled?: {} };
  createdAt: BN;
  bump: number;
  seed: BN;
}

// ============================================================
// Helper: Get vault PDA address
// ============================================================
export function getVaultPDA(owner: PublicKey, seed: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('vault'),
      owner.toBuffer(),
      seed.toArrayLike(Buffer, 'le', 8),
    ],
    config.PROGRAM_ID_PUBKEY
  );
}

// ============================================================
// Fetch all vault accounts
// ============================================================
export async function fetchAllVaults(): Promise<
  { pubkey: PublicKey; account: VaultAccount }[]
> {
  try {
    const accounts = await program.account.vault.all();
    return accounts.map((acc: any) => ({
      pubkey: acc.publicKey,
      account: acc.account as VaultAccount,
    }));
  } catch (err) {
    console.error('Error fetching vaults:', err);
    return [];
  }
}

// ============================================================
// Fetch single vault
// ============================================================
export async function fetchVault(
  vaultAddress: PublicKey
): Promise<VaultAccount | null> {
  try {
    const account = await program.account.vault.fetch(vaultAddress);
    return account as VaultAccount;
  } catch (err) {
    console.error(`Error fetching vault ${vaultAddress.toBase58()}:`, err);
    return null;
  }
}

// ============================================================
// Check if vault timer is expired
// ============================================================
export function isVaultExpired(vault: VaultAccount): boolean {
  const now = Math.floor(Date.now() / 1000);
  const lastHeartbeat = vault.lastHeartbeat.toNumber();
  const inactivityPeriod = vault.inactivityPeriod.toNumber();
  return now > lastHeartbeat + inactivityPeriod;
}

// ============================================================
// Get vault status as string
// ============================================================
export function getVaultStatus(vault: VaultAccount): string {
  if (vault.status.active !== undefined) return 'active';
  if (vault.status.claimed !== undefined) return 'claimed';
  if (vault.status.cancelled !== undefined) return 'cancelled';
  return 'unknown';
}

// ============================================================
// Get vault SOL balance
// ============================================================
export async function getVaultSolBalance(vaultAddress: PublicKey): Promise<number> {
  const balance = await connection.getBalance(vaultAddress);
  return balance;
}

// ============================================================
// Get token balance for a vault
// ============================================================
export async function getVaultTokenBalance(
  vaultAddress: PublicKey,
  mint: PublicKey
): Promise<number> {
  try {
    const { TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
    const { getAssociatedTokenAddressSync } = await import('@solana/spl-token');
    const ata = getAssociatedTokenAddressSync(mint, vaultAddress, true);
    const accountInfo = await connection.getTokenAccountBalance(ata);
    return Number(accountInfo.value.amount);
  } catch {
    return 0;
  }
}
