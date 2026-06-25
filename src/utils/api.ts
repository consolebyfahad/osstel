/**
 * Unwraps `{ success, data }` API envelopes from the backend.
 */
export function unwrapApiResponse<T = unknown>(response: unknown): T {
  if (!response || typeof response !== "object") {
    return response as T;
  }

  const record = response as Record<string, unknown>;

  if (
    typeof record.success === "boolean" &&
    record.data !== undefined &&
    record.data !== null &&
    typeof record.data === "object"
  ) {
    return record.data as T;
  }

  return response as T;
}

export function getApiErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "";

  const record = error as { data?: unknown };
  if (typeof record.data === "string") return record.data;

  if (record.data && typeof record.data === "object") {
    const payload = record.data as Record<string, unknown>;
    if (typeof payload.message === "string") return payload.message;
  }

  return "";
}

export function isBlockedAccountMessage(message: string): boolean {
  return message.toLowerCase().includes("blocked");
}

export function shouldLogoutOnApiError(
  status: number | string | undefined,
  error: unknown,
): boolean {
  if (status === 401) return true;

  if (status === 403) {
    const message = getApiErrorMessage(error);
    return isBlockedAccountMessage(message);
  }

  return false;
}
