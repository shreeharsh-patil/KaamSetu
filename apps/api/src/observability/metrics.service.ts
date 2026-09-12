/**
 * KaamSetu Application Metrics & Performance Tracking Service
 * Tracks HTTP, Database, Cache, Queue, and Domain Business Metrics.
 */

interface PercentileStats {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

class SlidingReservoir {
  private samples: number[] = [];
  private readonly maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  record(value: number): void {
    if (this.samples.length < this.maxSize) {
      this.samples.push(value);
    } else {
      // Random replacement (Reservoir sampling)
      const index = Math.floor(Math.random() * this.maxSize);
      this.samples[index] = value;
    }
  }

  getStats(): PercentileStats {
    if (this.samples.length === 0) {
      return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0, count: 0 };
    }

    const sorted = [...this.samples].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, val) => acc + val, 0);

    const p50 = sorted[Math.floor(count * 0.50)] ?? 0;
    const p95 = sorted[Math.floor(count * 0.95)] ?? 0;
    const p99 = sorted[Math.floor(count * 0.99)] ?? 0;
    const min = sorted[0] ?? 0;
    const max = sorted[count - 1] ?? 0;
    const avg = parseFloat((sum / count).toFixed(2));

    return { p50, p95, p99, avg, min, max, count };
  }

  clear(): void {
    this.samples = [];
  }
}

export class MetricsService {
  // 1. HTTP Traffic Metrics
  private totalHttpRequests = 0;
  private statusCodes: Record<string, number> = {
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
  };
  private methodCounts: Record<string, number> = {};
  private httpLatencyReservoir = new SlidingReservoir(2000);

  // 2. Infrastructure Latencies
  private dbLatencyReservoir = new SlidingReservoir(500);
  private redisLatencyReservoir = new SlidingReservoir(500);

  // 3. Queues & Background Jobs
  private queueDepth = {
    waiting: 0,
    active: 0,
    delayed: 0,
    failed: 0,
  };
  private failedBackgroundJobsCount = 0;

  // 4. Domain Metrics: Matching & Geospatial
  private matchingDurationReservoir = new SlidingReservoir(500);

  // 5. Domain Metrics: Offer Responses
  private offerStats = {
    totalSent: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    withdrawn: 0,
  };
  private offerAcceptanceLatencyReservoir = new SlidingReservoir(500);

  // 6. Realtime & Socket Connections
  private activeSocketConnections = 0;

  // 7. Notification Delivery
  private notificationStats = {
    sent: 0,
    failed: 0,
  };

  // ---------------- Record Methods ----------------

  recordHttpRequest(method: string, _route: string, statusCode: number, durationMs: number): void {
    this.totalHttpRequests++;
    this.methodCounts[method] = (this.methodCounts[method] || 0) + 1;

    if (statusCode >= 200 && statusCode < 300) {
      this.statusCodes['2xx'] = (this.statusCodes['2xx'] || 0) + 1;
    } else if (statusCode >= 300 && statusCode < 400) {
      this.statusCodes['3xx'] = (this.statusCodes['3xx'] || 0) + 1;
    } else if (statusCode >= 400 && statusCode < 500) {
      this.statusCodes['4xx'] = (this.statusCodes['4xx'] || 0) + 1;
    } else if (statusCode >= 500) {
      this.statusCodes['5xx'] = (this.statusCodes['5xx'] || 0) + 1;
    }

    this.httpLatencyReservoir.record(durationMs);
  }

  recordDbLatency(durationMs: number): void {
    this.dbLatencyReservoir.record(durationMs);
  }

  recordRedisLatency(durationMs: number): void {
    this.redisLatencyReservoir.record(durationMs);
  }

  setQueueDepth(depth: { waiting: number; active: number; delayed: number; failed: number }): void {
    this.queueDepth = { ...depth };
  }

  recordFailedBackgroundJob(): void {
    this.failedBackgroundJobsCount++;
    this.queueDepth.failed++;
  }

  recordMatchingDuration(durationMs: number): void {
    this.matchingDurationReservoir.record(durationMs);
  }

  recordOfferSent(): void {
    this.offerStats.totalSent++;
  }

  recordOfferResponse(outcome: 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'WITHDRAWN', durationMs?: number): void {
    if (outcome === 'ACCEPTED') {
      this.offerStats.accepted++;
      if (durationMs !== undefined) {
        this.offerAcceptanceLatencyReservoir.record(durationMs);
      }
    } else if (outcome === 'REJECTED') {
      this.offerStats.rejected++;
    } else if (outcome === 'EXPIRED') {
      this.offerStats.expired++;
    } else if (outcome === 'WITHDRAWN') {
      this.offerStats.withdrawn++;
    }
  }

  incrementSocketConnections(): void {
    this.activeSocketConnections++;
  }

  decrementSocketConnections(): void {
    this.activeSocketConnections = Math.max(0, this.activeSocketConnections - 1);
  }

  setSocketConnections(count: number): void {
    this.activeSocketConnections = Math.max(0, count);
  }

  recordNotification(status: 'sent' | 'failed'): void {
    if (status === 'sent') {
      this.notificationStats.sent++;
    } else {
      this.notificationStats.failed++;
    }
  }

  // ---------------- Query Snapshot ----------------

  getMetricsSnapshot() {
    const totalResponses = this.offerStats.accepted + this.offerStats.rejected + this.offerStats.expired;
    const acceptanceRate =
      totalResponses > 0
        ? parseFloat(((this.offerStats.accepted / totalResponses) * 100).toFixed(2))
        : 0;

    const totalNotifications = this.notificationStats.sent + this.notificationStats.failed;
    const notificationFailureRate =
      totalNotifications > 0
        ? parseFloat(((this.notificationStats.failed / totalNotifications) * 100).toFixed(2))
        : 0;

    const totalErrors = (this.statusCodes['4xx'] ?? 0) + (this.statusCodes['5xx'] ?? 0);
    const errorRate =
      this.totalHttpRequests > 0
        ? parseFloat(((totalErrors / this.totalHttpRequests) * 100).toFixed(2))
        : 0;

    return {
      http: {
        totalRequests: this.totalHttpRequests,
        errorRatePercent: errorRate,
        statusCodes: { ...this.statusCodes },
        methods: { ...this.methodCounts },
        latencyMs: this.httpLatencyReservoir.getStats(),
      },
      database: {
        latencyMs: this.dbLatencyReservoir.getStats(),
      },
      redis: {
        latencyMs: this.redisLatencyReservoir.getStats(),
      },
      queues: {
        depth: { ...this.queueDepth },
        failedJobsTotal: this.failedBackgroundJobsCount,
      },
      matching: {
        durationMs: this.matchingDurationReservoir.getStats(),
      },
      offers: {
        stats: { ...this.offerStats },
        acceptanceRatePercent: acceptanceRate,
        acceptanceLatencyMs: this.offerAcceptanceLatencyReservoir.getStats(),
      },
      realtime: {
        activeSocketConnections: this.activeSocketConnections,
      },
      notifications: {
        stats: { ...this.notificationStats },
        failureRatePercent: notificationFailureRate,
      },
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  /**
   * Serializes current metrics into standard OpenMetrics / Prometheus exposition format.
   */
  toPrometheusFormat(): string {
    const snapshot = this.getMetricsSnapshot();
    const lines: string[] = [
      '# HELP http_requests_total Total number of HTTP requests processed',
      '# TYPE http_requests_total counter',
      `http_requests_total ${snapshot.http.totalRequests}`,
      '',
      '# HELP http_requests_by_status Total HTTP requests partitioned by status class',
      '# TYPE http_requests_by_status counter',
      `http_requests_by_status{class="2xx"} ${snapshot.http.statusCodes['2xx']}`,
      `http_requests_by_status{class="3xx"} ${snapshot.http.statusCodes['3xx']}`,
      `http_requests_by_status{class="4xx"} ${snapshot.http.statusCodes['4xx']}`,
      `http_requests_by_status{class="5xx"} ${snapshot.http.statusCodes['5xx']}`,
      '',
      '# HELP http_request_duration_ms HTTP request latency percentiles in ms',
      '# TYPE http_request_duration_ms summary',
      `http_request_duration_ms{quantile="0.5"} ${snapshot.http.latencyMs.p50}`,
      `http_request_duration_ms{quantile="0.95"} ${snapshot.http.latencyMs.p95}`,
      `http_request_duration_ms{quantile="0.99"} ${snapshot.http.latencyMs.p99}`,
      `http_request_duration_ms_sum ${snapshot.http.latencyMs.avg * snapshot.http.latencyMs.count}`,
      `http_request_duration_ms_count ${snapshot.http.latencyMs.count}`,
      '',
      '# HELP db_latency_ms MongoDB latency in ms',
      '# TYPE db_latency_ms summary',
      `db_latency_ms{quantile="0.5"} ${snapshot.database.latencyMs.p50}`,
      `db_latency_ms{quantile="0.95"} ${snapshot.database.latencyMs.p95}`,
      `db_latency_ms{quantile="0.99"} ${snapshot.database.latencyMs.p99}`,
      '',
      '# HELP redis_latency_ms Redis ping latency in ms',
      '# TYPE redis_latency_ms summary',
      `redis_latency_ms{quantile="0.5"} ${snapshot.redis.latencyMs.p50}`,
      `redis_latency_ms{quantile="0.95"} ${snapshot.redis.latencyMs.p95}`,
      `redis_latency_ms{quantile="0.99"} ${snapshot.redis.latencyMs.p99}`,
      '',
      '# HELP queue_depth BullMQ queue depth gauge',
      '# TYPE queue_depth gauge',
      `queue_depth{state="waiting"} ${snapshot.queues.depth.waiting}`,
      `queue_depth{state="active"} ${snapshot.queues.depth.active}`,
      `queue_depth{state="delayed"} ${snapshot.queues.depth.delayed}`,
      `queue_depth{state="failed"} ${snapshot.queues.depth.failed}`,
      '',
      '# HELP queue_failed_jobs_total Total failed background jobs',
      '# TYPE queue_failed_jobs_total counter',
      `queue_failed_jobs_total ${snapshot.queues.failedJobsTotal}`,
      '',
      '# HELP matching_duration_ms Matching algorithm duration in ms',
      '# TYPE matching_duration_ms summary',
      `matching_duration_ms{quantile="0.5"} ${snapshot.matching.durationMs.p50}`,
      `matching_duration_ms{quantile="0.95"} ${snapshot.matching.durationMs.p95}`,
      `matching_duration_ms{quantile="0.99"} ${snapshot.matching.durationMs.p99}`,
      '',
      '# HELP offer_acceptance_rate_percent Percentage of offers accepted',
      '# TYPE offer_acceptance_rate_percent gauge',
      `offer_acceptance_rate_percent ${snapshot.offers.acceptanceRatePercent}`,
      '',
      '# HELP socket_connections_active Number of active WebSocket connections',
      '# TYPE socket_connections_active gauge',
      `socket_connections_active ${snapshot.realtime.activeSocketConnections}`,
      '',
      '# HELP notification_failure_rate_percent Percentage of notification deliveries that failed',
      '# TYPE notification_failure_rate_percent gauge',
      `notification_failure_rate_percent ${snapshot.notifications.failureRatePercent}`,
    ];

    return lines.join('\n');
  }

  reset(): void {
    this.totalHttpRequests = 0;
    this.statusCodes = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
    this.methodCounts = {};
    this.httpLatencyReservoir.clear();
    this.dbLatencyReservoir.clear();
    this.redisLatencyReservoir.clear();
    this.matchingDurationReservoir.clear();
    this.offerStats = { totalSent: 0, accepted: 0, rejected: 0, expired: 0, withdrawn: 0 };
    this.offerAcceptanceLatencyReservoir.clear();
    this.activeSocketConnections = 0;
    this.notificationStats = { sent: 0, failed: 0 };
    this.failedBackgroundJobsCount = 0;
  }
}

export const metricsService = new MetricsService();
