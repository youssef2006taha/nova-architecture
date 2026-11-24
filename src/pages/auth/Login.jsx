import { FiArrowRight, FiArrowLeft, FiCheck } from "react-icons/fi";
import LogoIcon from "./components/LogoIcon";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import { showToast } from "../../features/ui/toast/toastSlice";
import { login } from "../../features/authentication/auth/thunk/loginThunk";
import { validateField, validateForm } from "../../utils/validation/validateForm";
import { loginSchema } from "../../utils/validation/validationSchema";

import CustomInput from "../../components/ui/CustomInput";
import BallsBackground from "../../components/common/BallsBackground";
import PrimaryButton from "../../components/ui/PrimaryButton";
import useTranslation from "../../hooks/useTranslation";
import AuthControls from "./components/AuthControls";

/* Staggered entrance helper */
const delay = (ms) => ({ animationDelay: `${ms}ms` });

const isInternalPath = (path) =>
  typeof path === "string" &&
  path.startsWith("/") &&
  !path.startsWith("//") &&
  !path.startsWith("/\\");

const getReturnTo = (location) => {
  const from = location.state?.from;
  if (typeof from === "string" && isInternalPath(from)) return from;
  if (from && typeof from === "object" && isInternalPath(from.pathname)) {
    return `${from.pathname}${from.search || ""}${from.hash || ""}`;
  }

  const queryReturnTo = new URLSearchParams(location.search).get("returnTo");
  return isInternalPath(queryReturnTo) ? queryReturnTo : "/home";
};

export default function Login() {

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t, dir } = useTranslation();
  const { loading, sessionStatus, isAuthenticated } = useSelector((state) => state.auth);
  const isRestoringSession =
    sessionStatus === "idle" || sessionStatus === "loading";

  const [errors, setErrors] = useState({});
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const returnTo = getReturnTo(location);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, navigate, returnTo]);

  const handleValidation = () => {
    const errs = validateForm(loginSchema, loginData, t.auth.validation);

    setErrors(errs);
    return errs.count === 0;
  };

  const handleFieldBlur = (field) => {
    const fieldError = validateField(loginSchema, loginData, field, t.auth.validation);

    setErrors((prev) => ({
      ...prev,
      [field]: fieldError,
    }));
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    const nextData = { ...loginData, [field]: value };

    setLoginData(nextData);
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const signIn = async (event) => {
    event.preventDefault();

    if (isRestoringSession) return;

    if (!handleValidation()) {
      return;
    }

    try {
      await dispatch(
        login({
          ...loginData,
          email: loginData.email.trim(),
          rememberMe,
        }),
      ).unwrap();
      dispatch(showToast({ message: t.auth.login.success, severity: "success" }));
    } catch (error) {
      dispatch(
        showToast({
          message: typeof error === "string" ? error : t.auth.login.failure,
          severity: "error",
        }),
      );
    }
  };

  return (
    <main
      dir={dir}
      className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-bg-layout px-4 py-section-padding font-text"
    >
      <AuthControls />
      <BallsBackground grid />

      <div className="w-full max-w-md">
        {/* ---------- Animated logo ---------- */}
        <div
          className="mb-8 flex animate-fade-up motion-reduce:animate-none flex-col items-center"
          style={delay(0)}
        >
          <LogoIcon />

          <h1 className="mt-7 bg-linear-to-r from-text-main via-primary to-text-main bg-clip-text font-heading text-3xl font-bold text-transparent">
            {t.auth.login.title}
          </h1>
          <p className="mt-2 text-center text-sm text-text-muted">
            {t.auth.login.subtitle}
          </p>
        </div>

        {/* ---------- Form ---------- */}
        <div
          className="animate-fade-up motion-reduce:animate-none rounded-3xl border border-primary/10 bg-bg-surface/70 p-card-padding shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-8"
          style={delay(120)}
        >
          <form className="space-y-6" onSubmit={signIn} noValidate>
            <div className="animate-fade-up motion-reduce:animate-none" style={delay(200)}>
              <CustomInput
                field="email"
                name="email"
                value={loginData.email}
                onChange={handleFieldChange("email")}
                onBlur={() => handleFieldBlur("email")}
                error={errors.email}
                required
                autoComplete="username"
                label={t.auth.fields.email}
                placeholder={t.auth.fields.emailPlaceholder}
              />
            </div>

            <div className="animate-fade-up motion-reduce:animate-none" style={delay(280)}>
              <CustomInput
                field="password"
                name="password"
                value={loginData.password}
                onChange={handleFieldChange("password")}
                onBlur={() => handleFieldBlur("password")}
                error={errors.password}
                required
                autoComplete="current-password"
                label={t.auth.fields.password}
                placeholder={t.auth.fields.passwordPlaceholder}
              />
            </div>

            <div
              className="flex animate-fade-up motion-reduce:animate-none items-center justify-between"
              style={delay(360)}
            >
              <label className="flex cursor-pointer items-center gap-2.5 select-none">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span className="grid size-5 place-items-center rounded-md border border-primary/30 bg-bg-surface text-transparent transition peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-inverse peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20">
                  <FiCheck className="size-3.5" />
                </span>
                <span className="text-sm text-text-muted">{t.auth.login.rememberMe}</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-primary transition hover:text-primary-hover"
              >
                {t.auth.login.forgotPassword}
              </Link>
            </div>

            {/* Submit */}
            <PrimaryButton
              type="submit"
              fullWidth
              loading={loading || isRestoringSession}
              endIcon={dir === "rtl" ? <FiArrowLeft /> : <FiArrowRight />}
              className="!h-12 animate-fade-up motion-reduce:animate-none"
              style={delay(440)}
            >
              {isRestoringSession
                ? t.auth.restoringSession
                : loading
                  ? t.auth.login.signingIn
                  : t.auth.login.submit}
            </PrimaryButton>
          </form>
        </div>

        {/* Footer */}
        <p
          className="mt-6 animate-fade-up motion-reduce:animate-none text-center text-sm text-text-muted"
          style={delay(520)}
        >
          {t.auth.login.noAccount}{" "}
          <Link
            to="/register"
            className="font-semibold text-primary transition hover:text-primary-hover"
          >
            {t.auth.login.createAccount}
          </Link>
        </p>
      </div>
    </main>
  );
}