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
