import { useGetMeQuery } from "../../store/api";
import type { HostelConnectionStatus } from "@/types/connection";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

export function useHostelConnection() {
  const authUser = useSelector((state: RootState) => state.auth.user);
  const isResident = authUser?.role === "resident";
  const { data: meData } = useGetMeQuery(undefined, {
    skip: !isResident || !authUser?.accessToken,
  });

  const profile = meData?.user ?? authUser;
  const status: HostelConnectionStatus =
    profile?.hostelConnectionStatus ??
    (profile?.hostel || profile?.room || profile?.tenancyId
      ? "active"
      : "not_connected");

  const isConnected = status === "active";
  const isPending = status === "pending";
  const isNotConnected = status === "not_connected";

  return {
    status,
    isConnected,
    isPending,
    isNotConnected,
    pendingJoinRequest: profile?.pendingJoinRequest ?? null,
    hostel: profile?.hostel ?? null,
    room: profile?.room ?? null,
  };
}
