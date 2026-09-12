import { apiClient } from "@/lib/api/client";
import type { JobClassification } from "./types";

export const aiApi = {
  classifyJob: (text: string) => apiClient.post<JobClassification>("/ai/classify-job", { text }),
};
