export type VerificationStatus = "pending" | "verified";

/**
 * Replace with your API call, e.g. GET /business-owners/verification?phone=...
 */
export async function checkBusinessVerification(
  _phone: string,
): Promise<VerificationStatus> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return "verified";
}
