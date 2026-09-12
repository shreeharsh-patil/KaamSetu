import type { MatchingConfig } from '@kaamsetu/types';

const envOfferExpirySeconds = Number(process.env['OFFER_EXPIRY_SECONDS']);
const offerExpirySeconds = !isNaN(envOfferExpirySeconds) && envOfferExpirySeconds > 0 ? envOfferExpirySeconds : 30;

const envTotalTimeoutSeconds = Number(process.env['MATCHING_TOTAL_TIMEOUT_SECONDS']);
const totalMatchingTimeoutSeconds = !isNaN(envTotalTimeoutSeconds) && envTotalTimeoutSeconds > 0 ? envTotalTimeoutSeconds : 90;

const envWaveSize = Number(process.env['MATCHING_WAVE_SIZE']);
const waveSize = !isNaN(envWaveSize) && envWaveSize > 0 ? envWaveSize : 3;

const envMaxRadius = Number(process.env['MAX_SEARCH_RADIUS_KM']);
const maxSearchRadiusKm = !isNaN(envMaxRadius) && envMaxRadius > 0 ? envMaxRadius : 50;

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  weights: {
    skill: 0.30,              // 30% Skill
    distance: 0.25,           // 25% Distance
    availability: 0.15,       // 15% Availability
    rating: 0.10,             // 10% Rating
    completionRate: 0.10,     // 10% Completion rate
    acceptanceRate: 0.05,     // 5% Acceptance rate
    priceCompatibility: 0.05, // 5% Price compatibility
  },
  waveSize,
  offerExpirySeconds,
  offerExpiryMinutes: offerExpirySeconds / 60,
  totalMatchingTimeoutSeconds,
  maxSearchRadiusKm,
};
