import type { MatchingConfig } from '@kaamsetu/types';

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
  waveSize: 3,
  offerExpiryMinutes: 10,
  maxSearchRadiusKm: 50,
};
