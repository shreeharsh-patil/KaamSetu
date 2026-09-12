import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface CustomerAddress {
  id: string; label: string; addressLine: string; city: string; state: string;
  pincode: string; coordinates?: [number, number]; isDefault: boolean;
}

export const customerApi = {
  me: () => apiClient.get<{ defaultAddress?: CustomerAddress | null }>(API_ENDPOINTS.CUSTOMERS.ME),
};
