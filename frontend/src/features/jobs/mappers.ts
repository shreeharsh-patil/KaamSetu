import type { ApiJobOfferView, ApiJobView, CreateJobApiRequest, Job, JobCreationFormState, JobOffer, JobPresentationStatus, JobStatus } from "./types";

export function mapJobCreationFormToApi(form: JobCreationFormState, now = new Date()): CreateJobApiRequest {
  if (form.longitude === undefined || form.latitude === undefined) throw new Error("Confirm the service location before publishing");
  const preferredTime = (() => {
    if (form.timingOption === "SCHEDULED") {
      if (!form.scheduledAt) throw new Error("Choose a scheduled service time");
      return new Date(form.scheduledAt);
    }
    const date = new Date(now);
    if (form.timingOption === "ASAP") date.setMinutes(date.getMinutes() + 30);
    if (form.timingOption === "TODAY") date.setHours(Math.max(date.getHours() + 2, 18), 0, 0, 0);
    if (form.timingOption === "TOMORROW") { date.setDate(date.getDate() + 1); date.setHours(9, 0, 0, 0); }
    return date;
  })();
  if (Number.isNaN(preferredTime.getTime()) || preferredTime <= now) throw new Error("Preferred time must be in the future");
  return {
    categoryId: form.categoryId,
    requiredSkills: form.requiredSkills,
    title: form.title.trim(),
    description: form.description.trim(),
    source: form.source ?? "APP",
    location: { type: "Point", coordinates: [form.longitude, form.latitude] },
    address: { line: [form.addressLine.trim(), form.locality.trim()].filter(Boolean).join(", "), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim() },
    preferredTime: preferredTime.toISOString(),
    urgency: form.urgency,
    ...(form.estimatedPrice ? { estimatedPrice: form.estimatedPrice } : {}),
    images: form.images,
    publishImmediately: true,
  };
}

export function mapApiJobToView(job: ApiJobView): Job {
  return {
    id: job.id,
    categoryId: job.category?.id ?? job.categoryId,
    requiredSkills: job.requiredSkills ?? [],
    customer: { id: job.customer.id, name: job.customer.displayName, phone: job.customer.phoneNumber },
    worker: job.assignedWorker ? { id: job.assignedWorker.id, name: job.assignedWorker.displayName, phone: job.assignedWorker.phoneNumber, avatarUrl: job.assignedWorker.profilePhotoUrl ?? undefined, rating: job.assignedWorker.rating.average, totalReviews: job.assignedWorker.rating.count, skills: job.assignedWorker.skills, isVerified: job.assignedWorker.verificationStatus === "VERIFIED" } : undefined,
    category: job.category.name,
    title: job.title,
    description: job.description,
    urgency: job.urgency,
    preferredTime: job.preferredTime,
    location: { addressLine: job.address.line, locality: job.address.line.split(",").at(-1)?.trim() || job.address.city, city: job.address.city, state: job.address.state, pincode: job.address.pincode, longitude: job.location.coordinates[0], latitude: job.location.coordinates[1] },
    images: job.images,
    status: job.status,
    estimatedPrice: job.estimatedPrice,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function mapApiOfferToView(offer: ApiJobOfferView): JobOffer {
  return { id: offer.id, jobId: offer.jobId, category: offer.job.category.name, title: offer.job.title, description: offer.job.description ?? "", urgency: offer.job.urgency, approximateLocality: offer.job.approximateLocality, distanceKm: offer.distanceKm, preferredTime: offer.job.preferredTime, estimatedAmount: offer.job.estimatedAmount ?? undefined, expiresAt: offer.expiresAt, status: offer.status };
}

export function getJobPresentationStatus(status: JobStatus): JobPresentationStatus {
  if (status === "OPEN" || status === "MATCHING") return "SEARCHING";
  if (status === "OFFERED") return "WAITING_FOR_ACCEPTANCE";
  if (status === "ACCEPTED") return "WORKER_ASSIGNED";
  if (status === "EN_ROUTE") return "TRAVELLING";
  return status;
}
