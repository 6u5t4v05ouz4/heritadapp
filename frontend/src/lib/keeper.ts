/**
 * Keeper API configuration
 *
 * The keeper runs on Railway (backend) while the frontend runs on Vercel.
 * All keeper API calls must use the full base URL.
 */

export const KEEPER_BASE_URL =
  process.env.NEXT_PUBLIC_KEEPER_URL ||
  "https://crypto-heranca-keeper-production.up.railway.app";

/**
 * Build a full keeper API URL from a path.
 * Usage: keeperUrl("/api/v1/notifications/register")
 */
export function keeperUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${KEEPER_BASE_URL}${cleanPath}`;
}
