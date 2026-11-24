import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import BallsBackground from "../../components/common/BallsBackground";
import CustomInput from "../../components/ui/CustomInput";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { FiArrowRight, FiArrowLeft, FiUserPlus } from "react-icons/fi";
import LogoIcon from "./components/LogoIcon";
import { register } from "../../features/authentication/auth/thunk/registerThunk";
import { showToast } from "../../features/ui/toast/toastSlice";
import { validateField, validateForm } from "../../utils/validation/validateForm";
import { registerSchema } from "../../utils/validation/validationSchema";
import useTranslation from "../../hooks/useTranslation";
import AuthControls from "./components/AuthControls";

/* Staggered entrance helper */
const delay = (ms) => ({ animationDelay: `${ms}ms` });

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registerLoading } = useSelector((state) => state.auth);
  const { t, dir } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const handleFieldChange = (field) => (event) => {
    const nextData = { ...formData, [field]: event.target.value };
    setFormData(nextData);

    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: validateField(registerSchema, nextData, field, t.auth.validation),
      }));
    }
  };

  const handleFieldBlur = (field) => {
    setErrors((previous) => ({
      ...previous,
      [field]: validateField(registerSchema, formData, field, t.auth.validation),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm(registerSchema, formData, t.auth.validation);
    setErrors(validationErrors);

    if (validationErrors.count > 0) return;

    try {
      await dispatch(
        register({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      ).unwrap();
      dispatch(
        showToast({
          message: t.auth.register.success,
          severity: "success",
        }),
      );
      navigate("/login", { replace: true });
    } catch (error) {
      dispatch(
        showToast({
          message:
            typeof error === "string"
              ? error
              : t.auth.register.failure,
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
      <BallsBackground grid />
      <AuthControls />

      <div className="w-full max-w-md">
        <div
          className="mb-8 flex animate-fade-up motion-reduce:animate-none flex-col items-center"
          style={delay(0)}
        >
          <LogoIcon icon={FiUserPlus} />

          <h1 className="mt-7 bg-linear-to-r from-text-main via-primary to-text-main bg-clip-text font-heading text-3xl font-bold text-transparent">
            {t.auth.register.title}
          </h1>
          <p className="mt-2 text-center text-sm text-text-muted">
            {t.auth.register.subtitle}
          </p>
        </div>

        {/* ---------- Form ---------- */}
        <div
          className="animate-fade-up motion-reduce:animate-none rounded-3xl border border-primary/10 bg-bg-surface/70 p-card-padding shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-8"
          style={delay(120)}
        >
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="animate-fade-up motion-reduce:animate-none" style={delay(200)}>
              <CustomInput
                field="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleFieldChange("fullName")}
                onBlur={() => handleFieldBlur("fullName")}
                error={errors.fullName}
                label={t.auth.register.fullName}
                placeholder={t.auth.register.fullNamePlaceholder}
                autoComplete="name"
                required
              />
            </div>

            <div className="animate-fade-up motion-reduce:animate-none" style={delay(280)}>
              <CustomInput
                field="email"
                name="email"
                value={formData.email}
                onChange={handleFieldChange("email")}
                onBlur={() => handleFieldBlur("email")}
                error={errors.email}
                label={t.auth.fields.email}
                placeholder={t.auth.fields.emailPlaceholder}
                autoComplete="email"
                required
              />
            </div>

            <div className="animate-fade-up motion-reduce:animate-none" style={delay(360)}>
              <CustomInput
                field="password"
                name="password"
                value={formData.password}
                onChange={handleFieldChange("password")}
                onBlur={() => handleFieldBlur("password")}
                error={errors.password}
                label={t.auth.fields.password}
                placeholder={t.auth.fields.passwordPlaceholder}
                autoComplete="new-password"
                required
              />
            </div>

            {/* Submit */}
            <PrimaryButton
              type="submit"
              fullWidth
              loading={registerLoading}
              endIcon={dir === "rtl" ? <FiArrowLeft /> : <FiArrowRight />}
              className="!h-12 animate-fade-up motion-reduce:animate-none"
              style={delay(520)}
            >
              {t.auth.register.submit}
            </PrimaryButton>
          </form>
        </div>

        {/* Footer */}
        <p
          className="mt-6 animate-fade-up motion-reduce:animate-none text-center text-sm text-text-muted"
          style={delay(600)}
        >
          {t.auth.register.hasAccount}{" "}
          <Link
            to="/login"
            className="font-semibold text-primary transition hover:text-primary-hover"
          >
            {t.auth.register.signIn}
          </Link>
        </p>
      </div>
    </main>
  );
}