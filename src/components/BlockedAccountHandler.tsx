import { registerBlockedAccountHandler } from "@/utils/blockedAccount";
import { showBlockedAccountAlert } from "@/utils/blockedAccountActions";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store/store";

export default function BlockedAccountHandler() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    return registerBlockedAccountHandler(() => showBlockedAccountAlert(dispatch));
  }, [dispatch]);

  return null;
}
