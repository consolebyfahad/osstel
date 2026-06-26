import {
  getPlanDefinition,
  getUpgradePlanLabel,
  normalizePlanId,
  type PlanFeature,
} from "@/constants/plans";
import type { SubscriptionPlanId } from "@/types/subscription";

export type SubscriptionCheck = {
  allowed: boolean;
  message?: string;
};

export type SubscriptionUsage = {
  hostels: number;
  rooms: number;
  tenants: number;
};

function buildLimitMessage(
  resource: "hostel" | "room" | "tenant",
  planId: SubscriptionPlanId,
  limit: number,
): string {
  const plan = getPlanDefinition(planId);
  const upgradePlan = getUpgradePlanLabel(planId);

  return `You have reached the maximum ${resource} limit for the ${plan.name} plan (${limit}). Upgrade to ${upgradePlan} to add more ${resource}s.`;
}

export function canAddHostel(
  userPlan: SubscriptionPlanId | string | null | undefined,
  currentHostels: number,
): SubscriptionCheck {
  const planId = normalizePlanId(userPlan);
  const limit = getPlanDefinition(planId).limits.maxHostels;

  if (currentHostels >= limit) {
    return {
      allowed: false,
      message: buildLimitMessage("hostel", planId, limit),
    };
  }

  return { allowed: true };
}

export function canAddRoom(
  userPlan: SubscriptionPlanId | string | null | undefined,
  currentRooms: number,
): SubscriptionCheck {
  const planId = normalizePlanId(userPlan);
  const limit = getPlanDefinition(planId).limits.maxRooms;

  if (currentRooms >= limit) {
    return {
      allowed: false,
      message: buildLimitMessage("room", planId, limit),
    };
  }

  return { allowed: true };
}

export function canAddTenant(
  _userPlan: SubscriptionPlanId | string | null | undefined,
  _currentTenants: number,
): SubscriptionCheck {
  return { allowed: true };
}

export function hasFeature(
  userPlan: SubscriptionPlanId | string | null | undefined,
  featureName: PlanFeature,
): SubscriptionCheck {
  const planId = normalizePlanId(userPlan);
  const allowed = getPlanDefinition(planId).features[featureName];

  if (allowed) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: `This feature is available in a higher plan. Upgrade to ${getUpgradePlanLabel(planId)} to continue.`,
  };
}

export function getUsageFromDashboard(
  hostels: {
    rooms?: { totalRooms?: number; occupiedBeds?: number };
  }[] = [],
  hostelCount?: number,
): SubscriptionUsage {
  let rooms = 0;
  let tenants = 0;

  for (const item of hostels) {
    rooms += item.rooms?.totalRooms ?? 0;
    tenants += item.rooms?.occupiedBeds ?? 0;
  }

  return {
    hostels: hostelCount ?? hostels.length,
    rooms,
    tenants,
  };
}
