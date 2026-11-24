import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { showToast } from "../features/ui/toast/toastSlice";
import { fetchSession } from "../features/authentication/auth/thunk/fetchSession";
import useTranslation from "../hooks/useTranslation";
import { userHasRole } from "./auth/roles";

export default function ProtectedRoute({ allowedRoles }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { t, dir } = useTranslation();
  const { sessionStatus, isAuthenticated, user } = useSelector(
    (state) => state.auth,
  );
  const showedAuthToast = useRef(false);

  useEffect(() => {
    if (
      sessionStatus === "ready" &&
      !isAuthenticated &&
      !showedAuthToast.current
    ) {
      showedAuthToast.current = true;
      dispatch(
        showToast({
          message: t.auth.authenticationRequired,
          severity: "error",
        }),
      );
    }
  }, [dispatch, isAuthenticated, sessionStatus, t.auth.authenticationRequired]);

  if (sessionStatus === "idle" || sessionStatus === "loading") {
    return <h1 role="status">{t.auth.restoringSession}</h1>;
  }

  if (sessionStatus === "error") {
    return (
      <div
        dir={dir}
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-main px-4 text-center text-text-main"
      >
        <p>{t.auth.sessionUnavailable}</p>
        <button
          type="button"
          onClick={() => dispatch(fetchSession())}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-inverse"
        >
          {t.auth.retrySession}
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (
    allowedRoles?.length &&
    !allowedRoles.some((role) => userHasRole(user, role))
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}