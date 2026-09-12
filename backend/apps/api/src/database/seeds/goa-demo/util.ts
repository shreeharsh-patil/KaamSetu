/**
 * Goa demo seed utilities — deterministic IDs, distance and time helpers.
 */
import crypto from 'crypto';
import { Types } from 'mongoose';

const SEED_NAMESPACE = 'GOA_DEMO_V1';

/**
 * Deterministic 12-byte ObjectId derived from a stable string key.
 * Same key (within SEED_NAMESPACE) always yields the same _id, which is what
 * makes the seed idempotent (upsert by _id) and reset surgical (delete by the
 * recomputed _id list — no schema changes, no broad deleteMany filters).
 */
export function deterministicId(kind: string, ...parts: Array<string | number>): Types.ObjectId {
  const hash = crypto
    .createHash('sha256')
    .update(`${SEED_NAMESPACE}:${kind}:${parts.join(':')}`)
    .digest('hex')
    .slice(0, 24);
  return new Types.ObjectId(hash);
}

/** All deterministic ids embed this namespace marker in nothing user-visible;
 *  reset recomputes the same lists from the same seed definitions. */
export const SEED_TAG = SEED_NAMESPACE;

/** Great-circle distance in km between two [lng, lat] points. */
export function haversineKm(
  a: readonly [number, number],
  b: readonly [number, number]
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 100) / 100;
}

/** Date `minutes` in the past, pinned to second precision for determinism. */
export function minutesAgo(minutes: number, base = new Date()): Date {
  return new Date(Math.floor(base.getTime() - minutes * 60_000));
}

/** Date `minutes` in the future. */
export function minutesFromNow(minutes: number, base = new Date()): Date {
  return minutesAgo(-minutes, base);
}

/**
 * Simple deterministic pseudo-random pick from a list (stable across runs).
 */
export function pickStable<T>(list: readonly T[], seed: string | number): T {
  const hash = crypto.createHash('md5').update(`${SEED_NAMESPACE}:${seed}`).digest();
  return list[hash[0] % list.length];
}
