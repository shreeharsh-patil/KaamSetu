import type {
  IWorkerProfileEntity,
  IJobEntity,
  MatchingWeights,
  ScoreBreakdown,
  WorkerAvailability,
} from '@kaamsetu/types';

export interface CalculatedMatch {
  matchScore: number;
  distanceKm: number;
  scoreBreakdown: ScoreBreakdown;
}

/**
 * Calculates Great-Circle Distance between two coordinates in km using Haversine formula.
 * Input coordinates format: [longitude, latitude].
 */
export function calculateHaversineDistanceKm(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export class ScoringService {
  /**
   * Deterministically calculates candidate match score and detailed breakdown.
   * No AI, fully deterministic weighted formula.
   */
  calculateScore(
    worker: IWorkerProfileEntity,
    job: IJobEntity,
    distanceKm: number,
    weights: MatchingWeights,
    maxRadiusKm: number = 30
  ): CalculatedMatch {
    // 1. Skill Score (30% weight)
    const requiredSkillIds = job.requiredSkills || [];
    let skillScore = 100;
    if (requiredSkillIds.length > 0) {
      const workerSkillIds = (worker.skills || []).map((s) => s.skillId);
      const matchedSkills = requiredSkillIds.filter((id) => workerSkillIds.includes(id));
      const matchRatio = matchedSkills.length / requiredSkillIds.length;
      skillScore = matchRatio * 100;
    }

    // 2. Distance Score (25% weight)
    // Closer distance gives higher score. 0km = 100, maxRadius = 0
    const distanceRatio = Math.min(1, Math.max(0, distanceKm / Math.max(1, maxRadiusKm)));
    const distanceScore = Math.max(0, (1 - distanceRatio) * 100);

    // 3. Availability Score (15% weight)
    let availabilityScore: number;
    const availability = worker.availabilityStatus as WorkerAvailability;
    if (availability === 'AVAILABLE') {
      availabilityScore = 100;
    } else if (availability === 'BUSY') {
      availabilityScore = 30;
    } else {
      availabilityScore = 0; // OFFLINE
    }

    // 4. Rating Score (10% weight)
    // rating is 0 to 5; default to 3.5 (70) if brand new worker with 0 reviews
    const ratingAverage = worker.rating?.average ?? 0;
    const ratingCount = worker.rating?.count ?? 0;
    const ratingScore =
      ratingCount > 0
        ? Math.min(100, (ratingAverage / 5) * 100)
        : 70;

    // 5. Completion Rate Score (10% weight)
    const completedJobs = worker.stats?.completedJobs ?? 0;
    const cancelledJobs = worker.stats?.cancelledJobs ?? 0;
    const totalJobs = completedJobs + cancelledJobs;
    const completionRateScore =
      totalJobs > 0
        ? Math.min(100, (completedJobs / totalJobs) * 100)
        : 80; // Baseline for new worker

    // 6. Acceptance Rate Score (5% weight)
    const acceptanceRateScore = 85; // Baseline acceptance score

    // 7. Price Compatibility Score (5% weight)
    let priceScore = 100;
    const workerHourly = worker.pricing?.hourlyRate;
    const jobPrice = job.estimatedPrice;
    if (workerHourly && jobPrice && jobPrice > 0) {
      if (workerHourly <= jobPrice) {
        priceScore = 100;
      } else {
        const ratio = jobPrice / workerHourly;
        priceScore = Math.min(100, Math.max(20, ratio * 100));
      }
    }

    // Round sub-scores to 2 decimal places for breakdown
    const breakdown: ScoreBreakdown = {
      skillScore: Math.round(skillScore * 100) / 100,
      distanceScore: Math.round(distanceScore * 100) / 100,
      availabilityScore: Math.round(availabilityScore * 100) / 100,
      ratingScore: Math.round(ratingScore * 100) / 100,
      completionRateScore: Math.round(completionRateScore * 100) / 100,
      acceptanceRateScore: Math.round(acceptanceRateScore * 100) / 100,
      priceScore: Math.round(priceScore * 100) / 100,
    };

    // Calculate final weighted score from the rounded sub-scores (so the
    // breakdown always sums to the displayed match score), then quantize to
    // 0.01 so near-identical candidates produce a deterministic tie-break
    // order via distance instead of an arbitrary sort order.
    const totalScore =
      breakdown.skillScore * weights.skill +
      breakdown.distanceScore * weights.distance +
      breakdown.availabilityScore * weights.availability +
      breakdown.ratingScore * weights.rating +
      breakdown.completionRateScore * weights.completionRate +
      breakdown.acceptanceRateScore * weights.acceptanceRate +
      breakdown.priceScore * weights.priceCompatibility;

    const matchScore = Math.min(100, Math.max(0, Math.round(totalScore * 100) / 100));

    return {
      matchScore,
      distanceKm,
      scoreBreakdown: breakdown,
    };
  }
}

export const scoringService = new ScoringService();
