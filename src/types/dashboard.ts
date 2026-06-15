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

export type DashboardActivity = {
  id: string;
  type: string;
  title: string;
  description: string;
  amount?: number;
  resident?: { name: string };
  room?: { roomNumber: string };
  createdAt: string;
};

export type DashboardActivitiesResponse = {
  hostel: { id: string; name: string };
  activities: DashboardActivity[];
};

export type GetDashboardActivitiesParams = {
  hostelId: string;
  limit?: number;
};

export function formatActivityTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function mapDashboardActivities(
  activities: DashboardActivity[] = [],
): RecentActivity[] {
  return activities.map((activity) => ({
    id: activity.id,
    title: activity.title,
    description: activity.description,
    timestamp: formatActivityTime(activity.createdAt),
  }));
}

export type HostelDashboardItem = {
  hostel: {
    id: string;
    name: string;
  };
  rooms: {
    totalRooms: number;
    totalBedrooms: number;
    occupied: number;
    vacant: number;
    occupiedBeds: number;
    vacantBeds: number;
  };
  monthlyCollection: {
    month: number;
    year: number;
    expected: number;
    collected: number;
    pending: number;
  };
  pending: {
    amount: number;
    count: number;
  };
  complaints: {
    total: number;
    open: number;
    resolved: number;
    breakdown: {
      open: number;
      in_progress: number;
      resolved: number;
    };
  };
};

export type DashboardResponse = {
  hostels: HostelDashboardItem[];
};

export function aggregateDashboard(hostels: HostelDashboardItem[] = []) {
  const totals = {
    totalRooms: 0,
    totalBedrooms: 0,
    occupiedBeds: 0,
    vacantBeds: 0,
    collected: 0,
    pending: 0,
    expected: 0,
    complaintsOpen: 0,
    month: 0,
    year: 0,
  };

  for (const item of hostels) {
    totals.totalRooms += item.rooms.totalRooms;
    totals.totalBedrooms += item.rooms.totalBedrooms;
    totals.occupiedBeds += item.rooms.occupiedBeds;
    totals.vacantBeds += item.rooms.vacantBeds;
    totals.collected += item.monthlyCollection.collected;
    totals.pending += item.monthlyCollection.pending;
    totals.expected += item.monthlyCollection.expected;
    totals.complaintsOpen += item.complaints.open;

    if (!totals.month && item.monthlyCollection.month) {
      totals.month = item.monthlyCollection.month;
      totals.year = item.monthlyCollection.year;
    }
  }

  return totals;
}
