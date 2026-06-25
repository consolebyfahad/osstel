export type SubscriptionPlanId = "free" | "standard" | "premium";

export interface TrialInfo {
  active: boolean;
  plan: SubscriptionPlanId;
  endsAt: string;
  daysRemaining: number;
}

export interface SubscriptionPeriodInfo {
  active: boolean;
  plan: SubscriptionPlanId;
  startedAt: string | null;
  expiresAt: string;
  daysRemaining: number;
  canRenew: boolean;
}

export type PlanRequestStatus = "pending" | "approved" | "rejected" | string;

export interface ApiPlan {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  features: string[];
}

export interface PlansResponse {
  plans: ApiPlan[];
}

export interface PlanUpgradeRequest {
  id: string;
  currentPlan: SubscriptionPlanId;
  requestedPlan: SubscriptionPlanId;
  status: PlanRequestStatus;
  note?: string;
  createdAt: string;
}

export interface PlanRequestResponse {
  currentPlan: SubscriptionPlanId;
  request: PlanUpgradeRequest | null;
  canRenew?: boolean;
  subscription?: SubscriptionPeriodInfo | null;
}

export interface SubmitPlanRequestBody {
  plan: SubscriptionPlanId;
  note?: string;
}

export interface SubmitPlanRequestResponse {
  request: PlanUpgradeRequest;
}

export const PLAN_ORDER: Record<SubscriptionPlanId, number> = {
  free: 0,
  standard: 1,
  premium: 2,
};

export function canUpgradeTo(
  currentPlan: SubscriptionPlanId,
  targetPlan: SubscriptionPlanId,
): boolean {
  return PLAN_ORDER[targetPlan] > PLAN_ORDER[currentPlan];
}

export function canRequestPlan(
  currentPlan: SubscriptionPlanId,
  targetPlan: SubscriptionPlanId,
  options?: {
    canRenew?: boolean;
    basePlan?: SubscriptionPlanId;
  },
): boolean {
  if (
    options?.canRenew &&
    options.basePlan &&
    targetPlan === options.basePlan
  ) {
    return true;
  }
  return canUpgradeTo(currentPlan, targetPlan);
}

export function getPlanDisplayName(planId: SubscriptionPlanId): string {
  if (planId === "free") return "Free";
  if (planId === "standard") return "Starter";
  return "Pro";
}

export function formatPlanPrice(price: number): string {
  if (price === 0) return "Free Forever";
  return `Rs ${price.toLocaleString()}/month`;
}

export type PlanCardVariant = "free" | "standard" | "premium";

export function getPlanVariant(planId: SubscriptionPlanId): PlanCardVariant {
  return planId;
}
