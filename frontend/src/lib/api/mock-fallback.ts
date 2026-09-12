/**
 * Development & Offline Mock Handlers for KaamSetu API Client
 * Activated seamlessly when the Express backend (localhost:5000) is offline or unreachable.
 */

import { API_ENDPOINTS } from "./endpoints";

export function handleOfflineMockResponse<T>(
  endpoint: string,
  _method: string = "GET",
  body?: unknown
): T | null {
  const normalizedEndpoint = endpoint.replace(/^\/api\/v1/, "");
  const payload = body as Record<string, unknown> | undefined;

  // 1. Request OTP
  if (normalizedEndpoint.includes(API_ENDPOINTS.AUTH.REQUEST_OTP)) {
    const phone = (payload?.phone as string) || "+919820011223";
    return {
      success: true,
      phone,
      expiresIn: 300,
      debugOtp: "123456",
      message: "OTP sent successfully (Demo OTP: 123456)",
    } as T;
  }

  // 2. Verify OTP
  if (normalizedEndpoint.includes(API_ENDPOINTS.AUTH.VERIFY_OTP)) {
    const phone = (payload?.phone as string) || "+919820011223";
    const pendingRole =
      (typeof window !== "undefined"
        ? sessionStorage.getItem("kaamsetu_pending_role")
        : null) || "customer";

    const mockUser = {
      id: `usr-${phone.replace(/\D/g, "").slice(-4) || "demo"}`,
      phoneNumber: phone,
      role: (pendingRole === "worker" ? "worker" : "customer") as "customer" | "worker",
      status: "active",
      fullName: pendingRole === "worker" ? "Rajesh Kumar (Pro)" : "Anand Verma (Customer)",
      phoneVerified: true,
      preferredLanguage: "en",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("kaamsetu_user", JSON.stringify(mockUser));
      localStorage.setItem("kaamsetu_token", `mock-token-${Date.now()}`);
      document.cookie = `kaamsetu_user=${encodeURIComponent(JSON.stringify(mockUser))}; path=/; max-age=604800`;
    }

    return {
      user: mockUser,
      accessToken: `mock-token-${Date.now()}`,
    } as T;
  }

  // 3. Token Refresh
  if (normalizedEndpoint.includes(API_ENDPOINTS.AUTH.REFRESH)) {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("kaamsetu_user");
      if (savedUser) {
        return {
          accessToken: `mock-refreshed-token-${Date.now()}`,
        } as T;
      }
    }
    return null;
  }

  // 4. Current User Profile (/me)
  if (normalizedEndpoint === API_ENDPOINTS.USERS.ME || normalizedEndpoint === "/me") {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("kaamsetu_user");
      if (savedUser) {
        try {
          return JSON.parse(savedUser) as T;
        } catch {
          // ignore
        }
      }
    }
    return null;
  }

  // 5. Logout
  if (normalizedEndpoint.includes(API_ENDPOINTS.AUTH.LOGOUT)) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("kaamsetu_user");
      localStorage.removeItem("kaamsetu_token");
      sessionStorage.removeItem("kaamsetu_pending_phone");
      sessionStorage.removeItem("kaamsetu_pending_role");
      document.cookie = "kaamsetu_user=; path=/; max-age=0";
    }
    return { success: true } as T;
  }

  // 6. Categories List
  if (normalizedEndpoint === API_ENDPOINTS.CATEGORIES.LIST || normalizedEndpoint === "/categories") {
    return [
      { id: "plumbing", name: "Plumbing", slug: "plumbing", icon: "Droplets", basePrice: 249 },
      { id: "electrical", name: "Electrical", slug: "electrical", icon: "Zap", basePrice: 299 },
      { id: "carpentry", name: "Carpentry", slug: "carpentry", icon: "Hammer", basePrice: 349 },
      { id: "painting", name: "Painting", slug: "painting", icon: "Paintbrush", basePrice: 499 },
      { id: "appliance", name: "Appliance Repair", slug: "appliance", icon: "Wrench", basePrice: 399 },
      { id: "cleaning", name: "Deep Cleaning", slug: "cleaning", icon: "Sparkles", basePrice: 599 },
    ] as T;
  }

  // 7. Worker Offers List
  if (normalizedEndpoint.includes("/worker/offers")) {
    return [
      {
        id: "offer-201",
        jobId: "job-101",
        category: "electrical",
        title: "Ceiling Fan Regulator Sparking",
        description: "Regulator is making buzzing sounds and spark when turning on high speed.",
        approximateArea: "Lokhandwala Complex, Andheri West",
        distanceKm: 3.1,
        urgency: "IMMEDIATE",
        estimatedPrice: 350,
        expiresInSeconds: 145,
        status: "PENDING",
      },
      {
        id: "offer-202",
        jobId: "job-102",
        category: "electrical",
        title: "Geyser Power Socket Replacement",
        description: "16A geyser power socket burnt, requires heavy duty anchor replacement.",
        approximateArea: "Versova Metro Station, Andheri West",
        distanceKm: 1.8,
        urgency: "TODAY",
        estimatedPrice: 500,
        expiresInSeconds: 280,
        status: "PENDING",
      },
      {
        id: "offer-203",
        jobId: "job-103",
        category: "plumbing",
        title: "Kitchen Sink Mixer Tap Leak",
        description: "Continuous water dripping under cabinet from angle cock valve.",
        approximateArea: "Juhu Scheme, Vile Parle",
        distanceKm: 4.2,
        urgency: "STANDARD",
        estimatedPrice: 400,
        expiresInSeconds: 420,
        status: "PENDING",
      },
    ] as T;
  }

  // 8. Jobs List
  if (normalizedEndpoint === API_ENDPOINTS.JOBS.LIST || normalizedEndpoint === "/jobs") {
    return [
      {
        id: "job-101",
        title: "Tripping Main Circuit Breaker",
        category: "electrical",
        description: "Main MCB trips every 10 minutes when AC turns on.",
        status: "IN_PROGRESS",
        address: "Flat 402, Greenfield Apts, Andheri West",
        price: 450,
        createdAt: new Date().toISOString(),
      },
    ] as T;
  }

  // 9. Job Creation
  if (normalizedEndpoint === API_ENDPOINTS.JOBS.CREATE) {
    const newJobId = `job-${Date.now().toString().slice(-4)}`;
    return {
      id: newJobId,
      title: (payload?.title as string) || "Emergency Skilled Service",
      description: (payload?.description as string) || "Service request submitted via KaamSetu",
      category: (payload?.category as string) || "plumbing",
      status: "SEARCHING",
      address: (payload?.address as string) || "Customer Address, Mumbai",
      price: (payload?.estimatedBudget as number) || 450,
      createdAt: new Date().toISOString(),
    } as T;
  }

  // 10. Worker Availability
  if (normalizedEndpoint.includes(API_ENDPOINTS.WORKERS.AVAILABILITY)) {
    return {
      success: true,
      status: (payload?.status as string) || "AVAILABLE",
    } as T;
  }

  // 11. Worker Earnings
  if (normalizedEndpoint.includes("earnings")) {
    return {
      today: 1850,
      week: 9400,
      month: 38200,
      completedJobs: 14,
      pendingPayout: 4200,
      rating: 4.9,
      totalHours: 32,
      expenses: [
        { id: "exp-1", title: "Copper wire roll & insulation tape", amount: 280, date: "Today, 11:20 AM" },
        { id: "exp-2", title: "Two-wheeler fuel", amount: 350, date: "Yesterday" },
      ],
    } as T;
  }

  // 12. Notifications
  if (normalizedEndpoint.includes("notifications")) {
    return [
      {
        id: "notif-1",
        title: "Job Accepted",
        message: "Your service request has been confirmed with a certified technician.",
        read: false,
        createdAt: new Date().toISOString(),
      },
    ] as T;
  }

  // 13. Messages / Conversations
  if (normalizedEndpoint.includes("messages")) {
    return [
      {
        id: "msg-1",
        senderRole: "worker",
        senderName: "Rajesh Kumar",
        content: "Namaste, I have arrived at your apartment gate.",
        createdAt: new Date().toISOString(),
      },
    ] as T;
  }

  return null;
}
