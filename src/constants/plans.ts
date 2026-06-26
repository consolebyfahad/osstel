import type { SubscriptionPlanId } from "@/types/subscription";

export type PlanFeature =
  | "tenant_management"
  | "room_management"
  | "rent_tracking"
  | "reports"
  | "notifications"
  | "expense_tracking"
  | "complaints"
  | "payment_proof"
  | "support"
  | "rent_reminders"
  | "data_export"
  | "multi_hostel"
  | "advanced_reports"
  | "priority_support";

export type PlanLimits = {
  maxHostels: number;
  maxRooms: number;
  maxTenants: number | null;
};

export type PlanDefinition = {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  limits: PlanLimits;
  features: Record<PlanFeature, boolean>;
};

export const PLAN_FEATURES = {
  tenant_management: "tenant_management",
  room_management: "room_management",
  rent_tracking: "rent_tracking",
  reports: "reports",
  notifications: "notifications",
  expense_tracking: "expense_tracking",
  complaints: "complaints",
  payment_proof: "payment_proof",
  support: "support",
  rent_reminders: "rent_reminders",
  data_export: "data_export",
  multi_hostel: "multi_hostel",
  advanced_reports: "advanced_reports",
  priority_support: "priority_support",
} as const;

export const PLANS: Record<SubscriptionPlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    limits: {
      maxHostels: 1,
      maxRooms: 10,
      maxTenants: null,
    },
    features: {
      tenant_management: true,
      room_management: true,
      rent_tracking: true,
      reports: false,
      notifications: false,
      expense_tracking: false,
      complaints: false,
      payment_proof: false,
      support: false,
      rent_reminders: false,
      data_export: false,
      multi_hostel: false,
      advanced_reports: false,
      priority_support: false,
    },
  },
  standard: {
    id: "standard",
    name: "Standard",
    price: 1999,
    limits: {
      maxHostels: 1,
      maxRooms: 25,
      maxTenants: null,
    },
    features: {
      tenant_management: true,
      room_management: true,
      rent_tracking: true,
      reports: true,
      notifications: true,
      expense_tracking: true,
      complaints: true,
      payment_proof: true,
      support: true,
      rent_reminders: true,
      data_export: true,
      multi_hostel: false,
      advanced_reports: false,
      priority_support: false,
    },
  },
  premium: {
    id: "premium",
    name: "Pro",
    price: 2999,
    limits: {
      maxHostels: 5,
      maxRooms: 75,
      maxTenants: null,
    },
    features: {
      tenant_management: true,
      room_management: true,
      rent_tracking: true,
      reports: true,
      notifications: true,
      expense_tracking: true,
      complaints: true,
      payment_proof: true,
      support: true,
      rent_reminders: true,
      data_export: true,
      multi_hostel: true,
      advanced_reports: true,
      priority_support: true,
    },
  },
};

const UPGRADE_LABELS: Record<SubscriptionPlanId, string> = {
  free: "Standard",
  standard: "Pro",
  premium: "Pro",
};

export function normalizePlanId(
  plan?: string | null,
): SubscriptionPlanId {
  if (plan === "basic") return "standard";
  if (plan === "standard" || plan === "premium") return plan;
  return "free";
}

export function getPlanDefinition(planId?: string | null): PlanDefinition {
  return PLANS[normalizePlanId(planId)];
}

export function getUpgradePlanLabel(planId?: string | null): string {
  return UPGRADE_LABELS[normalizePlanId(planId)];
}
