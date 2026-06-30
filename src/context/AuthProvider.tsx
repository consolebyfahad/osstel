import { setInitialized } from "../../store/reducers/authSlice";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const isInitialized = useSelector(
    (state: RootState) => state.auth.isInitialized,
  );

  useEffect(() => {
    if (!isInitialized) {
      dispatch(setInitialized());
    }
  }, [dispatch, isInitialized]);

  return children;
}
