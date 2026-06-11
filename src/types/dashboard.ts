import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type DashboardStat = {
  id: string;
  title: string;
  value: number | string;
  iconName: ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  iconBackgroundColor: string;
};

export type CollectionBannerData = {
  label: string;
  totalAmount: number | string;
  pendingAmount: number | string;
  complaintsOpen: number | string;
  currency?: string;
  gradientColors?: [string, string];
};

export type QuickAction = {
  id: string;
  label: string;
  iconName: ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  iconBackgroundColor: string;
};

export type RecentActivity = {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
};
