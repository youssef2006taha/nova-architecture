import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import OtpInput from "react-otp-input";
import { FiArrowRight, FiArrowLeft, FiLock } from "react-icons/fi";

import BallsBackground from "../../components/common/BallsBackground";
import CustomInput from "../../components/ui/CustomInput";
import FieldError from "../../components/ui/FieldError";
import PrimaryButton from "../../components/ui/PrimaryButton";
import LogoIcon from "./components/LogoIcon";
import { resetPassword } from "../../features/authentication/auth/thunk/resetPasswordThunk";
import { showToast } from "../../features/ui/toast/toastSlice";
import { validateField, validateForm } from "../../utils/validation/validateForm";
import { resetPasswordSchema } from "../../utils/validation/validationSchema";
import useTranslation from "../../hooks/useTranslation";
import AuthControls from "./components/AuthControls";

const delay = (ms) => ({ animationDelay: `${ms}ms` });

export default function ResetPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { passwordResetEmail, resetPasswordLoading } = useSelector(
    (state) => state.auth,
  );
  const { t, dir } = useTranslation();
  const [formData, setFormData] = useState({
    otpCode: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const handleFieldChange = (field) => (event) => {
    const nextData = { ...formData, [field]: event.target.value };
    setFormData(nextData);

    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: validateField(resetPasswordSchema, nextData, field, t.auth.validation),
      }));
    }

    if (field === "newPassword" && errors.confirmPassword) {
      setErrors((previous) => ({
        ...previous,
        confirmPassword: validateField(
          resetPasswordSchema,
          nextData,
          "confirmPassword",
          t.auth.validation,
        ),
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm(resetPasswordSchema, formData, t.auth.validation);
    setErrors(validationErrors);

    if (validationErrors.count > 0) return;

    try {
      await dispatch(
        resetPassword({
          email: passwordResetEmail.trim(),
          otpCode: formData.otpCode,
          newPassword: formData.newPassword,
        }),
      ).unwrap();
      dispatch(
        showToast({
          message: t.auth.resetPassword.success,
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
              : t.auth.resetPassword.failure,
          severity: "error",
        }),
      );
    }
  };

  if (!passwordResetEmail) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <main dir={dir} className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-bg-layout px-4 py-section-padding font-text">
      <AuthControls />
      <BallsBackground grid />

      <div className="w-full max-w-md">
        <div
          className="mb-8 flex animate-fade-up motion-reduce:animate-none flex-col items-center"
          style={delay(0)}
        >
          <LogoIcon icon={FiLock} />
          <h1 className="mt-7 bg-linear-to-r from-text-main via-primary to-text-main bg-clip-text text-center font-heading text-3xl font-bold text-transparent">
            {t.auth.resetPassword.title}
          </h1>
          <p className="mt-2 max-w-sm text-center text-sm leading-6 text-text-muted">
            {t.auth.resetPassword.subtitle}
          </p>
        </div>

        <div
          className="animate-fade-up motion-reduce:animate-none rounded-3xl border border-primary/10 bg-bg-surface/70 p-card-padding shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-8"
          style={delay(120)}
        >
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div
              className="animate-fade-up motion-reduce:animate-none"
              style={delay(200)}
            >
              <label className="mb-2 block text-sm font-semibold text-text-main/60 dark:text-text-main/90">
                {t.auth.resetPassword.otpLabel}
                <span className="ml-1 text-red-400">*</span>
              </label>
              <OtpInput
                value={formData.otpCode}
                onChange={(otpCode) => {
                  const nextData = { ...formData, otpCode };
                  setFormData(nextData);
                  if (errors.otpCode) {
                    setErrors((previous) => ({
                      ...previous,
                      otpCode: validateField(
                        resetPasswordSchema,
                        nextData,
                        "otpCode",
                        t.auth.validation,
                      ),
                    }));
                  }
                }}
                numInputs={6}
                inputType="tel"
                shouldAutoFocus
                skipDefaultStyles
                containerStyle="flex justify-center gap-2 sm:gap-3"
                renderInput={(inputProps, index) => (
                  <input
                    {...inputProps}
                    aria-label={`${t.auth.resetPassword.otpDigit} ${index + 1}`}
                    aria-invalid={Boolean(errors.otpCode)}
                    onBlur={() =>
                      setErrors((previous) => ({
                        ...previous,
                        otpCode: validateField(
                          resetPasswordSchema,
                          formData,
                          "otpCode",
                          t.auth.validation,
                        ),
                      }))
                    }
                    className={`!size-11 rounded-xl border bg-primary/4 text-center text-lg font-semibold text-text-main outline-none transition focus:ring-2 focus:ring-primary/30 sm:!size-12 ${
                      errors.otpCode
                        ? "border-red-400"
                        : "border-primary/15 focus:border-primary/40"
                    }`}
                  />
                )}
              />
              <FieldError message={errors.otpCode} />
            </div>

            <div
              className="animate-fade-up motion-reduce:animate-none"
              style={delay(280)}
            >
              <CustomInput
                field="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleFieldChange("newPassword")}
                onBlur={() =>
                  setErrors((previous) => ({
                    ...previous,
                    newPassword: validateField(
                      resetPasswordSchema,
                      formData,
                      "newPassword",
                      t.auth.validation,
                    ),
                  }))
                }
                error={errors.newPassword}
                label={t.auth.resetPassword.newPassword}
                placeholder={t.auth.resetPassword.newPasswordPlaceholder}
                autoComplete="new-password"
                required
              />
            </div>

            <div
              className="animate-fade-up motion-reduce:animate-none"
              style={delay(360)}
            >
              <CustomInput
                field="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleFieldChange("confirmPassword")}
                onBlur={() =>
                  setErrors((previous) => ({
                    ...previous,
                    confirmPassword: validateField(
                      resetPasswordSchema,
                      formData,
                      "confirmPassword",
                      t.auth.validation,
                    ),
                  }))
                }
                error={errors.confirmPassword}
                label={t.auth.resetPassword.confirmPassword}
                placeholder={t.auth.resetPassword.confirmPasswordPlaceholder}
                autoComplete="new-password"
                required
              />
            </div>

            <PrimaryButton
              type="submit"
              fullWidth
              loading={resetPasswordLoading}
              endIcon={dir === "rtl" ? <FiArrowLeft /> : <FiArrowRight />}
              className="!h-12 animate-fade-up motion-reduce:animate-none"
              style={delay(440)}
            >
              {t.auth.resetPassword.submit}
            </PrimaryButton>
          </form>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link
            to="/login"
            className="font-semibold text-text-muted transition hover:text-primary"
          >
            {t.auth.resetPassword.backToSignIn}
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-text-muted">
          {t.auth.resetPassword.needCode}{" "}
          <Link
            to="/forgot-password"
            className="font-semibold text-primary transition hover:text-primary-hover"
          >
            {t.auth.resetPassword.sendAnother}
          </Link>
        </p>
      </div>
    </main>
  );
}
