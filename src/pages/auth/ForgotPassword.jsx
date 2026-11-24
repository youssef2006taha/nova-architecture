import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowRight, FiArrowLeft, FiKey } from "react-icons/fi";

import BallsBackground from "../../components/common/BallsBackground";
import CustomInput from "../../components/ui/CustomInput";
import PrimaryButton from "../../components/ui/PrimaryButton";
import LogoIcon from "./components/LogoIcon";
import { sendOtp } from "../../features/authentication/auth/thunk/sendOtpThunk";
import { showToast } from "../../features/ui/toast/toastSlice";
import { validateField, validateForm } from "../../utils/validation/validateForm";
import { sendOtpSchema } from "../../utils/validation/validationSchema";
import useTranslation from "../../hooks/useTranslation";
import AuthControls from "./components/AuthControls";

const delay = (ms) => ({ animationDelay: `${ms}ms` });

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sendOtpLoading } = useSelector((state) => state.auth);
  const { t, dir } = useTranslation();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = { email };
    const validationErrors = validateForm(sendOtpSchema, formData, t.auth.validation);
    setErrors(validationErrors);

    if (validationErrors.count > 0) return;

    const normalizedEmail = email.trim();
    try {
      await dispatch(sendOtp(normalizedEmail)).unwrap();
      dispatch(
        showToast({
          message: t.auth.forgotPassword.success,
          severity: "success",
        }),
      );
      navigate("/reset-password");
    } catch (error) {
      dispatch(
        showToast({
          message:
            typeof error === "string"
              ? error
              : t.auth.forgotPassword.failure,
          severity: "error",
        }),
      );
    }
  };

  return (
    <main dir={dir} className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-bg-layout px-4 py-section-padding font-text">
      <AuthControls />
      <BallsBackground grid />

      <div className="w-full max-w-md">
        <div
          className="mb-8 flex animate-fade-up motion-reduce:animate-none flex-col items-center"
          style={delay(0)}
        >
          <LogoIcon icon={FiKey} />
          <h1 className="mt-7 bg-linear-to-r from-text-main via-primary to-text-main bg-clip-text text-center font-heading text-3xl font-bold text-transparent">
            {t.auth.forgotPassword.title}
          </h1>
          <p className="mt-2 max-w-sm text-center text-sm leading-6 text-text-muted">
            {t.auth.forgotPassword.subtitle}
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
              <CustomInput
                field="email"
                name="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (errors.email) {
                    setErrors((previous) => ({
                      ...previous,
                      email: validateField(sendOtpSchema, {
                        email: event.target.value,
                      }, "email", t.auth.validation),
                    }));
                  }
                }}
                onBlur={() =>
                  setErrors((previous) => ({
                    ...previous,
                    email: validateField(sendOtpSchema, { email }, "email", t.auth.validation),
                  }))
                }
                error={errors.email}
                label={t.auth.fields.email}
                placeholder={t.auth.fields.emailPlaceholder}
                autoComplete="email"
                required
              />
            </div>

            <PrimaryButton
              type="submit"
              fullWidth
              loading={sendOtpLoading}
              endIcon={dir === "rtl" ? <FiArrowLeft /> : <FiArrowRight />}
              className="!h-12 animate-fade-up motion-reduce:animate-none"
              style={delay(280)}
            >
              {t.auth.forgotPassword.submit}
            </PrimaryButton>
          </form>
        </div>

        <p
          className="mt-6 animate-fade-up motion-reduce:animate-none text-center text-sm text-text-muted"
          style={delay(360)}
        >
          {t.auth.forgotPassword.alreadyCode}{" "}
          <Link
            to="/reset-password"
            className="font-semibold text-primary transition hover:text-primary-hover"
          >
            {t.auth.forgotPassword.verifyCode}
          </Link>
        </p>
        <p className="mt-3 text-center text-sm">
          <Link
            to="/login"
            className="font-semibold text-text-muted transition hover:text-primary"
          >
            {t.auth.forgotPassword.backToSignIn}
          </Link>
        </p>
      </div>
    </main>
  );
}
