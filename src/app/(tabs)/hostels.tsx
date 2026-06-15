import { ManagerAccessDenied } from "@/components/auth/ManagerGuard";
import HostelsList from "@/components/HostelsList";
import { vs } from "@constants/fonts";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

export default function HostelsTab() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isManager = user?.role === "manager";

  if (!isManager) {
    return (
      <ManagerAccessDenied
        title="Hostels"
        description="Hostel management is available for managers only."
      />
    );
  }

  return <HostelsList listBottomPadding={vs(110)} />;
}
