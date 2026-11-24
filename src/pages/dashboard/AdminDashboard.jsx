import { Navigate, Link, useLocation } from "react-router-dom";
import useTranslation from "../../hooks/useTranslation";
import AdminOverview from "./admin/AdminOverview";
import AdminOrders from "./admin/AdminOrders";
import AdminCourses from "./admin/AdminCourses";
import AdminCustomers from "./admin/AdminCustomers";

const sections = [
  { id: "overview", label: "overview" },
  { id: "orders", label: "adminOrders" },
  { id: "courses", label: "adminCourses" },
  { id: "customers", label: "adminUsers" },
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const location = useLocation();
  const section = location.pathname.split("/")[3] || "overview";
  const activeSection = sections.find((item) => item.id === section);

  if (!activeSection) {
    return <Navigate to="/dashboard/admin" replace />;
  }

  const content = {
    overview: <AdminOverview />,
    orders: <AdminOrders />,
    courses: <AdminCourses />,
    customers: <AdminCustomers />,
  }[section];

  return (
    <main className="min-h-screen bg-bg-main py-16 text-text-main md:py-24">
      <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6">
        <h1 className="text-2xl font-black">{t.nav.adminDashboard}</h1>
        <nav
          aria-label={t.dashboard.adminNavigation}
          className="flex flex-wrap gap-2 border-b border-primary/10 pb-4"
        >
          {sections.map((item) => {
            const path =
              item.id === "overview"
                ? "/dashboard/admin"
                : `/dashboard/admin/${item.id}`;
            return (
              <Link
                key={item.id}
                to={path}
                aria-current={section === item.id ? "page" : undefined}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  section === item.id
                    ? "bg-primary text-primary-inverse"
                    : "text-text-muted hover:bg-primary/5 hover:text-text-main"
                }`}
              >
                {t.dashboard[item.label]}
              </Link>
            );
          })}
        </nav>
        {content}
      </div>
    </main>
  );
}
