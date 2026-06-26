import {
  getPlanDefinition,
  normalizePlanId,
  type PlanFeature,
} from "@/constants/plans";
import {
  canAddHostel,
  canAddRoom,
  canAddTenant,
  getUsageFromDashboard,
  hasFeature,
  type SubscriptionCheck,
  type SubscriptionUsage,
} from "@/utils/subscription";
import { guardSubscription } from "@/utils/subscriptionAlert";
import type { SubscriptionPlanId } from "@/types/subscription";
import { useGetDashboardQuery, useGetMeQuery } from "../../store/api";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

export function useSubscription() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isManager = user?.role === "manager";
  const isResident = user?.role === "resident";

  const { data: meData } = useGetMeQuery(undefined, {
    skip: !user?.accessToken,
  });

  const planId: SubscriptionPlanId = useMemo(() => {
    if (isResident) {
      return normalizePlanId(
        meData?.user?.managerPlan ?? user?.managerPlan ?? "free",
      );
    }

    return normalizePlanId(
      meData?.user?.subscriptionPlan ?? user?.subscriptionPlan,
    );
  }, [
    isResident,
    meData?.user?.managerPlan,
    meData?.user?.subscriptionPlan,
    user?.managerPlan,
    user?.subscriptionPlan,
  ]);

  const residentFeatures = meData?.user?.planFeatures ?? user?.planFeatures;

  const { data: dashboardData } = useGetDashboardQuery(undefined, {
    skip: !isManager,
  });

  const usage = useMemo<SubscriptionUsage>(() => {
    if (meData?.user.subscriptionUsage) {
      return meData.user.subscriptionUsage;
    }

    return getUsageFromDashboard(
      dashboardData?.hostels ?? [],
      meData?.user.hostels?.length,
    );
  }, [
    dashboardData?.hostels,
    meData?.user.hostels?.length,
    meData?.user.subscriptionUsage,
  ]);

  const plan = useMemo(() => getPlanDefinition(planId), [planId]);

  const checkFeature = (feature: PlanFeature): SubscriptionCheck => {
    if (isResident && residentFeatures) {
      const allowed = Boolean(residentFeatures[feature]);
      if (allowed) {
        return { allowed: true };
      }

      return {
        allowed: false,
        message:
          "This feature is not available on your hostel's current plan. Please contact your hostel manager.",
      };
    }

    return hasFeature(planId, feature);
  };

  const checkAddHostel = (): SubscriptionCheck =>
    canAddHostel(planId, usage.hostels);

  const checkAddRoom = (): SubscriptionCheck =>
    canAddRoom(planId, usage.rooms);

  const checkAddTenant = (): SubscriptionCheck =>
    canAddTenant(planId, usage.tenants);

  const guardAddHostel = (onAllowed: () => void) =>
    guardSubscription(checkAddHostel(), onAllowed);

  const guardAddRoom = (onAllowed: () => void) =>
    guardSubscription(checkAddRoom(), onAllowed);

  const guardAddTenant = (onAllowed: () => void) =>
    guardSubscription(checkAddTenant(), onAllowed);

  const guardFeature = (feature: PlanFeature, onAllowed: () => void) =>
    guardSubscription(checkFeature(feature), onAllowed);

  return {
    planId,
    plan,
    usage,
    isManager,
    isResident,
    residentFeatures,
    checkAddHostel,
    checkAddRoom,
    checkAddTenant,
    checkFeature,
    guardAddHostel,
    guardAddRoom,
    guardAddTenant,
    guardFeature,
  };
}
