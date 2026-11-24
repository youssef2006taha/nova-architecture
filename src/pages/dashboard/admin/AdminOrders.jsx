import { useEffect, useRef, useState } from "react";
import {
  approveAdminOrder,
  getPendingAdminOrders,
  rejectAdminOrder,
} from "../../../api/admin/admin.api";
import useTranslation from "../../../hooks/useTranslation";
import AdminRejectionForm from "./AdminRejectionForm";
import { getAdminErrorMessage } from "./adminDashboardUtils";

export default function AdminOrders() {
  const { t, currentLang } = useTranslation();
  const mountedRef = useRef(true);
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState({ key: null, orders: [], error: null });
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const loading = result.key !== retryKey;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getPendingAdminOrders({ signal: controller.signal })
      .then((orders) => {
        if (controller.signal.aborted) return;
        if (
          !Array.isArray(orders) ||
          orders.some(
            (order) =>
              order?.orderId == null ||
                typeof order.orderId !== "string" ||
                !order.orderId ||
              typeof order.studentEmail !== "string" ||
                order.amount == null ||
                (typeof order.amount === "string" && !order.amount.trim()) ||
              !Number.isFinite(Number(order.amount)) ||
                typeof order.orderStatus !== "string" ||
                typeof order.paymentStatus !== "string" ||
              !Array.isArray(order.items) ||
              order.items.some(
                (item) => typeof item?.courseTitle !== "string",
              ) ||
              (order.receiptImageUrl != null &&
                typeof order.receiptImageUrl !== "string"),
          )
        ) {
          setResult({
            key: retryKey,
            orders: [],
            error: { type: "invalid" },
          });
          return;
        }
        setResult({ key: retryKey, orders, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setResult({
          key: retryKey,
          orders: [],
          error: { type: "load", status: error?.response?.status },
        });
      });

    return () => controller.abort();
  }, [retryKey]);

  const refresh = () => setRetryKey((value) => value + 1);

  const handleApprove = async (orderId) => {
    setBusyOrderId(orderId);
    setActionError("");
    setActionSuccess("");
    try {
      await approveAdminOrder(orderId);
      if (!mountedRef.current) return;
      setActionSuccess(t.dashboard.paymentApprovalSuccess);
      refresh();
    } catch (error) {
      if (mountedRef.current) {
        setActionError(
          getAdminErrorMessage(
            error,
            t.dashboard.adminActionError,
            t.dashboard,
          ),
        );
      }
    } finally {
      if (mountedRef.current) setBusyOrderId(null);
    }
  };

  const handleReject = async (orderId) => {
    if (!rejectionReason.trim()) {
      setActionError(t.dashboard.adminReasonRequired);
      return;
    }
    setBusyOrderId(orderId);
    setActionError("");
    setActionSuccess("");
    try {
      await rejectAdminOrder(orderId, rejectionReason.trim());
      if (!mountedRef.current) return;
      setRejectingOrderId(null);
      setRejectionReason("");
      setActionSuccess(t.dashboard.paymentRejectionSuccess);
      refresh();
    } catch (error) {
      if (mountedRef.current) {
        setActionError(
          getAdminErrorMessage(
            error,
            t.dashboard.adminActionError,
            t.dashboard,
          ),
        );
      }
    } finally {
      if (mountedRef.current) setBusyOrderId(null);
    }
  };

  const loadError =
    result.error?.type === "invalid"
      ? t.dashboard.adminInvalidOrders
      : getAdminErrorMessage(
          { response: { status: result.error?.status } },
          t.dashboard.adminLoadError,
          t.dashboard,
        );
  const orderStatusLabels = new Map([
    ["Paid", t.dashboard.orderStatusPaid],
    ["PendingVerification", t.dashboard.orderStatusPendingVerification],
  ]);

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">{t.dashboard.adminOrders}</h2>
        <p className="mt-1 text-sm text-text-muted">
          {t.dashboard.pendingPaymentReview}
        </p>
      </div>
      {actionError && (
        <p className="text-sm text-red-500" role="alert">{actionError}</p>
      )}
      {actionSuccess && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          {actionSuccess}
        </p>
      )}
      {loading ? (
        <p className="py-10 text-center text-text-muted" role="status">
          {t.dashboard.adminLoading}
        </p>
      ) : result.error ? (
        <div className="space-y-3 py-10 text-center" role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={refresh} className="font-bold text-primary hover:underline">
            {t.dashboard.retry}
          </button>
        </div>
      ) : result.orders.length === 0 ? (
        <p className="py-10 text-center text-text-muted">
          {t.dashboard.noPendingOrders}
        </p>
      ) : (
        <div className="space-y-4">
          {result.orders.map((order) => {
            return (
              <article
                key={order.orderId}
                className="space-y-4 rounded-2xl border border-primary/10 bg-bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">
                      {t.dashboard.orderNumber}:{" "}
                      <span className="break-all">{order.orderId}</span>
                    </h3>
                    <p className="mt-1 break-all text-sm text-text-muted">
                      {order.studentEmail}
                    </p>
                    <p className="mt-1 break-words text-sm">
                      {order.items.map((item) => item.courseTitle).filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-bold text-primary">
                      {Number(order.amount).toLocaleString(currentLang)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {orderStatusLabels.get(
                        order.paymentStatus || order.orderStatus,
                      ) ||
                        order.paymentStatus ||
                        order.orderStatus}
                    </p>
                  </div>
                </div>
                {order.receiptImageUrl && (
                  <p className="text-sm text-text-muted" role="note">
                    {t.dashboard.receiptPreviewUnavailable}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyOrderId === order.orderId}
                    onClick={() => handleApprove(order.orderId)}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-inverse disabled:opacity-50"
                  >
                    {t.dashboard.approvePayment}
                  </button>
                  <button
                    type="button"
                    disabled={busyOrderId === order.orderId}
                    onClick={() => {
                      setRejectingOrderId(
                        rejectingOrderId === order.orderId ? null : order.orderId,
                      );
                      setRejectionReason("");
                      setActionError("");
                      setActionSuccess("");
                    }}
                    className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-500 disabled:opacity-50"
                  >
                    {t.dashboard.rejectPayment}
                  </button>
                </div>
                {rejectingOrderId === order.orderId && (
                  <AdminRejectionForm
                    value={rejectionReason}
                    onChange={setRejectionReason}
                    onSubmit={() => handleReject(order.orderId)}
                    disabled={busyOrderId === order.orderId}
                    reasonLabel={t.dashboard.rejectionReason}
                    confirmLabel={t.dashboard.confirmRejection}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
