import { lazy, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import { fetchSession } from "./features/authentication/auth/thunk/fetchSession";
import { sessionExpired } from "./features/authentication/auth/authSlice";
import ProtectedRoute from "./utils/ProtectedRoute";
import Toast from "./components/ui/Toast";
import useTranslation from "./hooks/useTranslation";

const MainLayout = lazy(() => import("./components/layout/MainLayout"));
const Home = lazy(() => import("./pages/home/Home"));
const CoursesList = lazy(() => import("./pages/courses/CoursesList"));
const CourseDetail = lazy(() => import("./pages/courses/CourseDetail"));
const ScenesList = lazy(() => import("./pages/scenes/ScenesList"));
const FurnitureList = lazy(() => import("./pages/furniture/FurnitureList"));
const ProjectRequests = lazy(() => import("./pages/projectRequests/ProjectRequests"));
const About = lazy(() => import("./pages/about/About"));
const Checkout = lazy(() => import("./pages/checkout/Checkout"));
const Success = lazy(() => import("./pages/checkout/Success"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const DashboardLanding = lazy(() => import("./pages/dashboard/DashboardLanding"));
const InstructorDashboard = lazy(() => import("./pages/dashboard/InstructorDashboard"));
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

function App() {
  const { theme } = useSelector((state) => state.ui);
  const { dir, current } = useSelector((state) => state.lang);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchSession());
  }, [dispatch]);

  useEffect(() => {
    const handleSessionExpired = () => dispatch(sessionExpired());
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [dispatch]);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.theme !== theme) root.dataset.theme = theme;
    if (root.classList.contains("dark") !== (theme === "dark")) {
      root.classList.toggle("dark", theme === "dark");
    }
    if (root.dir !== dir) root.dir = dir;
    const language = current === "ar" ? "ar" : "en";
    if (root.lang !== language) root.lang = language;
  }, [theme, dir, current]);

  return (
    <>
      <Suspense
        fallback={
          <div
            className="min-h-screen flex items-center justify-center bg-bg-main text-text-muted"
            role="status"
          >
            {t.common.loadingPage}
          </div>
        }
      >
        <Routes>
          {/* Authentication Routes */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />

          <Route path="/" element={<MainLayout />}>
            {/* Public Platform Routes matching Archviz Nova */}
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="courses" element={<CoursesList />} />
            <Route path="courses/:slug" element={<CourseDetail />} />
            <Route path="3d-scenes" element={<ScenesList />} />
            <Route path="furniture" element={<FurnitureList />} />
            <Route path="project-requests" element={<ProjectRequests />} />
            <Route path="about" element={<About />} />
            <Route path="success" element={<Success />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="checkout" element={<Checkout />} />
              <Route path="dashboard" element={<DashboardLanding />} />
              <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
                <Route path="dashboard/student" element={<Dashboard />} />
                <Route path="dashboard/downloads" element={<Dashboard />} />
                <Route path="dashboard/orders" element={<Dashboard />} />
              </Route>
              <Route
                element={
                  <ProtectedRoute allowedRoles={["Instructor", "Admin"]} />
                }
              >
                <Route
                  path="dashboard/instructor"
                  element={<InstructorDashboard />}
                />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
                <Route path="dashboard/admin/*" element={<AdminDashboard />} />
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
      <Toast />
    </>
  );
}

export default App;
