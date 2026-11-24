import { Link, Navigate, useLocation } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import PrimaryButton from "../../components/ui/PrimaryButton";
import useTranslation from "../../hooks/useTranslation";

export default function Success() {
  const { t } = useTranslation();
  const location = useLocation();
  const { orderId, total, receiptSubmitted } = location.state || {};

  if (
    typeof orderId !== "string" ||
    !orderId.trim() ||
    receiptSubmitted !== true
  ) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <div className="min-h-screen py-24 flex items-center justify-center bg-bg-main text-text-main p-4">
      <div className="max-w-md w-full p-8 sm:p-12 rounded-3xl bg-bg-surface border border-primary/20 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 flex items-center justify-center mx-auto">
          <FiCheckCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase">
            {t.checkout.orderCreated}
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            {t.checkout.receiptSubmitted}
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            {t.checkout.paymentPendingReview}
          </p>
          <p className="text-sm font-bold">
            {t.checkout.orderNumber}: {orderId}
          </p>
          {Number.isFinite(total) && (
            <p className="text-sm text-text-muted">${total.toFixed(2)}</p>
          )}
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Link to="/dashboard">
            <PrimaryButton appearance="primary" fullWidth className="!py-3.5 font-bold">
              {t.nav.dashboard}
            </PrimaryButton>
          </Link>

          <Link
            to="/courses"
            className="w-full py-3 rounded-xl text-xs font-bold border border-primary/15 hover:bg-primary/5 text-text-main transition-colors block"
          >
            {t.checkout.continueBrowsing}
          </Link>
        </div>
      </div>
    </div>
  );
}

