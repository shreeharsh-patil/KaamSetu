import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

interface PresignedUpload {
  uploadId: string;
  uploadUrl: string;
  key: string;
  requiredHeaders?: Record<string, string>;
}

interface CompletedUpload {
  id: string;
  key: string;
  mimeType: string;
  publicUrl?: string | null;
}

export const uploadsApi = {
  presign: (file: File) => apiClient.post<PresignedUpload>(API_ENDPOINTS.UPLOADS.PRESIGN, {
    purpose: "JOB_IMAGE",
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  }),
  complete: (uploadId: string) => apiClient.post<CompletedUpload>(API_ENDPOINTS.UPLOADS.COMPLETE, { uploadId }),
  remove: (uploadId: string) => apiClient.delete<{ message: string }>(API_ENDPOINTS.UPLOADS.DELETE(uploadId)),
};

export function putPresignedFile(
  file: File,
  upload: PresignedUpload,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", upload.uploadUrl);
    for (const [key, value] of Object.entries(upload.requiredHeaders ?? {})) request.setRequestHeader(key, value);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(`Storage upload failed (${request.status})`)));
    request.addEventListener("error", () => reject(new Error("Storage upload failed")));
    request.send(file);
  });
}
