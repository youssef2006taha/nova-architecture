import { Navigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import useTranslation from "../../hooks/useTranslation";
import { getDashboardNavigationRoles } from "../../utils/auth/roles";

export default function DashboardLanding() {
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const availableDashboards = getDashboardNavigationRoles(user);

  if (availableDashboards.length === 0) {
    return <Navigate to="/" replace />;
  }

  if (availableDashboards.length === 1) {
    return <Navigate to={availableDashboards[0].path} replace />;
  }

  return (
    <main className="min-h-screen bg-bg-main py-16 text-text-main md:py-24">
      <div className="container mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
        <div>
          <h1 className="text-2xl font-black">{t.dashboard.chooseDashboard}</h1>
          <p className="mt-2 text-sm text-text-muted">
            {t.dashboard.chooseDashboardDescription}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableDashboards.map(({ role, path, label }) => (
            <Link
              key={role}
              to={path}
              className="rounded-2xl border border-primary/10 bg-bg-surface p-6 font-bold transition hover:border-primary/40 hover:bg-primary/5"
            >
              {t.nav[label]}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
