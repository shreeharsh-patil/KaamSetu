export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
    sessions: () => [...queryKeys.auth.all, "sessions"] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => [...queryKeys.categories.all, "list"] as const,
    detail: (slug: string) => [...queryKeys.categories.all, "detail", slug] as const,
  },
  jobs: {
    all: ["jobs"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.jobs.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.jobs.all, "detail", id] as const,
    offers: (jobId: string) => [...queryKeys.jobs.all, "offers", jobId] as const,
  },
  workers: {
    all: ["workers"] as const,
    nearby: (params?: Record<string, unknown>) =>
      [...queryKeys.workers.all, "nearby", params] as const,
    profile: (id: string) => [...queryKeys.workers.all, "profile", id] as const,
  },
} as const;
