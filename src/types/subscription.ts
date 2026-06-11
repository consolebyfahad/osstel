export type SubscriptionPlanId = "free" | "standard" | "premium";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "Rs 0",
    description: "Get started with the basics",
    features: ["Up to 5 rooms", "Basic rent tracking", "1 admin user"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 999,
    priceLabel: "Rs 999",
    description: "For growing hostels",
    features: [
      "Up to 20 rooms",
      "Tenant management",
      "Rent reminders",
      "Export reports",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 1999,
    priceLabel: "Rs 1,999",
    description: "Full power for large hostels",
    features: [
      "Unlimited rooms",
      "Advanced analytics",
      "Multi-admin access",
      "Priority support",
    ],
  },
];
