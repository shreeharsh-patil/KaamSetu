/**
 * Goa demo seed data — approximate town centroids.
 *
 * Coordinates are plausible town-centre approximations in [longitude, latitude]
 * (KaamSetu GeoJSON order). They are NOT real residential addresses and must
 * never be treated as such. Pincodes are the towns' general postal codes.
 */
export interface GoaLocation {
  name: string;
  region: 'NORTH' | 'CENTRAL' | 'SOUTH';
  /** [longitude, latitude] */
  coordinates: [number, number];
  pincode: string;
}

export const GOA_LOCATIONS: Record<string, GoaLocation> = {
  PANAJI: { name: 'Panaji', region: 'NORTH', coordinates: [73.8278, 15.4909], pincode: '403001' },
  PORVORIM: { name: 'Porvorim', region: 'NORTH', coordinates: [73.8389, 15.5145], pincode: '403501' },
  MAPUSA: { name: 'Mapusa', region: 'NORTH', coordinates: [73.808, 15.5915], pincode: '403507' },
  CALANGUTE: { name: 'Calangute', region: 'NORTH', coordinates: [73.7535, 15.544], pincode: '403516' },
  CANDOLIM: { name: 'Candolim', region: 'NORTH', coordinates: [73.7712, 15.5176], pincode: '403515' },
  BICHOLIM: { name: 'Bicholim', region: 'NORTH', coordinates: [73.9613, 15.5555], pincode: '403504' },
  OLD_GOA: { name: 'Old Goa', region: 'NORTH', coordinates: [73.9073, 15.504], pincode: '403402' },
  PONDA: { name: 'Ponda', region: 'CENTRAL', coordinates: [74.0099, 15.4027], pincode: '403401' },
  MARGAO: { name: 'Margao', region: 'SOUTH', coordinates: [73.958, 15.2832], pincode: '403601' },
  VASCO: { name: 'Vasco da Gama', region: 'SOUTH', coordinates: [73.8113, 15.3982], pincode: '403802' },
  VERNA: { name: 'Verna', region: 'SOUTH', coordinates: [73.9499, 15.3431], pincode: '403722' },
  COLVA: { name: 'Colva', region: 'SOUTH', coordinates: [73.927, 15.268], pincode: '403708' },
  CUNCOLIM: { name: 'Cuncolim', region: 'SOUTH', coordinates: [73.993, 15.173], pincode: '403703' },
  CANACONA: { name: 'Canacona', region: 'SOUTH', coordinates: [74.0303, 15.0147], pincode: '403702' },
} as const;

export type GoaLocationKey = keyof typeof GOA_LOCATIONS;

/**
 * Small deterministic offset so two people in the same town don't sit on the
 * exact same point. Fully deterministic: same index → same offset.
 */
export function jitteredCoordinates(
  key: GoaLocationKey,
  index: number
): [number, number] {
  const base = GOA_LOCATIONS[key].coordinates;
  const dLng = (((index * 37) % 17) - 8) * 0.0012; // ±~0.9 km east/west
  const dLat = (((index * 53) % 19) - 9) * 0.0011; // ±~1.0 km north/south
  return [
    Math.round((base[0] + dLng) * 1e6) / 1e6,
    Math.round((base[1] + dLat) * 1e6) / 1e6,
  ];
}
