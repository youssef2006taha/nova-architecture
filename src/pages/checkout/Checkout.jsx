import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FiLock,
  FiCheckCircle,
  FiUploadCloud,
  FiArrowRight,
  FiArrowLeft,
  FiShoppingBag,
  FiCopy,
  FiExternalLink,
  FiCheck,
} from "react-icons/fi";
import useTranslation from "../../hooks/useTranslation";
import PrimaryButton from "../../components/ui/PrimaryButton";
import CustomInput from "../../components/ui/CustomInput";
import FieldError from "../../components/ui/FieldError";
import { fetchCart } from "../../features/cart/cartSlice";
import { showToast } from "../../features/ui/toast/toastSlice";
import {
  checkoutOrderApi,
  getInstaPayInstructions,
  uploadPaymentReceiptFile,
} from "../../api/cart/cart.api";
import { validateField, validateForm } from "../../utils/validation/validateForm";
import { checkoutSchema } from "../../utils/validation/validationSchema";

const MAX_RECEIPT_SIZE = 10 * 1024 * 1024;
const PENDING_ORDER_STORAGE_PREFIX = "pendingCheckoutOrder:";
const RECEIPT_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const RECEIPT_FILE_EXTENSION = /\.(jpe?g|png|webp|pdf)$/i;

const getPendingOrderStorageKey = (userId) =>
  `${PENDING_ORDER_STORAGE_PREFIX}${encodeURIComponent(userId)}`;

const readPendingOrder = (userId) => {
  if (!userId) return { status: "unavailable", order: null };
  try {
    const savedOrder = sessionStorage.getItem(
      getPendingOrderStorageKey(userId),
    );
    if (savedOrder === null) return { status: "ready", order: null };

    let pendingOrder;
    try {
      pendingOrder = JSON.parse(savedOrder);
    } catch {
      return { status: "invalid", order: null };
    }

    if (
      !pendingOrder ||
      typeof pendingOrder.orderId !== "string" ||
      !pendingOrder.orderId.trim()
    ) {
      return { status: "invalid", order: null };
    }

    return {
      status: "ready",
      order: {
        orderId: pendingOrder.orderId.trim(),
        total:
          typeof pendingOrder.total === "number" &&
          Number.isFinite(pendingOrder.total) &&
          pendingOrder.total >= 0
            ? pendingOrder.total
            : null,
        userId,
      },
    };
  } catch {
    return { status: "error", order: null };
  }
};

const isSupportedReceiptFile = (file) =>
  RECEIPT_FILE_EXTENSION.test(file.name) &&
  (!file.type || RECEIPT_FILE_TYPES.has(file.type));

const isConfirmedOrderRejection = (error) => {
  if (error?.authSessionInvalid) return true;
  const status = error?.response?.status;
  return (
    Number.isInteger(status) &&
    status >= 400 &&
    status < 500 &&
    ![408, 409, 425].includes(status)
  );
};

export default function Checkout() {
  const { t, dir } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    items,
    serverTotals,
    serverCouponCode,
    serverStatus,
    serverError,
    mutationLoading,
  } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const userId =
    typeof user?.userId === "string" ? user.userId.trim() : "";

  const [creatingOrder, setCreatingOrder] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [instructionsRetryKey, setInstructionsRetryKey] = useState(0);
  const [instructionsData, setInstructionsData] = useState(null);
  const [instructionsStatus, setInstructionsStatus] = useState("loading");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [receiptError, setReceiptError] = useState(false);
  const [pendingOrderStorageWarningFor, setPendingOrderStorageWarningFor] =
    useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: "",
    senderDetails: "",
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [errors, setErrors] = useState({});
  const storedPendingOrder = useMemo(
    () => readPendingOrder(userId),
    [userId],
  );
  const courseItems = items;
  const subtotal = Number(serverTotals?.subTotal || 0);
  const discountAmount = Number(serverTotals?.discountAmount || 0);
  const total = Number(serverTotals?.total || 0);
  const loading = creatingOrder || uploadingReceipt;
  const pendingOrderReady =
    Boolean(userId) && storedPendingOrder.status === "ready";
  const activeCreatedOrder =
    createdOrder?.userId === userId
      ? createdOrder
      : storedPendingOrder.order;
  const pendingOrderStorageWarning =
    pendingOrderStorageWarningFor === userId;
  const checkoutTotal = activeCreatedOrder?.total ?? total;

  useEffect(() => {
    if (serverStatus === "idle") {
      dispatch(fetchCart());
    }
  }, [dispatch, serverStatus]);

  useEffect(() => {
    async function loadInstructions() {
      setInstructionsStatus("loading");
      try {
        const res = await getInstaPayInstructions();
        if (
          !res ||
          typeof res.accountHandle !== "string" ||
          !res.accountHandle.trim() ||
          typeof res.phoneNumber !== "string" ||
          !res.phoneNumber.trim() ||
          typeof res.accountName !== "string" ||
          !res.accountName.trim() ||
          typeof res.instructions !== "string" ||
          !res.instructions.trim() ||
          (res.paymentLink != null && typeof res.paymentLink !== "string")
        ) {
          throw new Error("The payment instructions response was invalid.");
        }
        setInstructionsData(res);
        setInstructionsStatus("ready");
      } catch {
        setInstructionsData(null);
        setInstructionsStatus("error");
      }
    }
    loadInstructions();
  }, [instructionsRetryKey]);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    dispatch(
      showToast({
        message: `${fieldName} ${t.checkout.copiedToClipboard}`,
        severity: "success",
      })
    );
  };

  const handleFieldChange = (field) => (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFieldBlur = (field) => () => {
    if (checkoutSchema[field]) {
      const err = validateField(checkoutSchema, formData, field);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      if (file.size > MAX_RECEIPT_SIZE) {
        setReceiptFile(null);
        setErrors((prev) => ({
          ...prev,
          receiptFile: t.checkout.receiptFileTooLarge,
        }));
        return;
      }
      if (!isSupportedReceiptFile(file)) {
        setReceiptFile(null);
        setErrors((prev) => ({
          ...prev,
          receiptFile: t.checkout.receiptFileInvalidType,
        }));
        return;
      }
      setReceiptFile(file);
      setErrors((prev) => ({ ...prev, receiptFile: "" }));
    }
  };

  const validateCheckout = () => {
    const newErrors = {};

    // Base customer validation
    const baseErrors = validateForm(checkoutSchema, formData);
    Object.assign(newErrors, baseErrors);

    if (!formData.senderDetails.trim()) {
      newErrors.senderDetails = t.checkout.senderDetailsRequired;
    }
    if (!receiptFile) {
      newErrors.receiptFile = t.checkout.receiptRequired;
    }

    const errCount = Object.keys(newErrors).filter((k) => newErrors[k]).length;
    setErrors(newErrors);
    return errCount === 0;
  };

  const uploadReceipt = async (order) => {
    if (!formData.senderDetails.trim()) {
      setErrors((previous) => ({
        ...previous,
        senderDetails: t.checkout.senderDetailsRequired,
      }));
      return;
    }
    if (!receiptFile) {
      setErrors((previous) => ({
        ...previous,
        receiptFile: t.checkout.receiptRequired,
      }));
      return;
    }
    if (
      receiptFile.size > MAX_RECEIPT_SIZE ||
      !isSupportedReceiptFile(receiptFile)
    ) {
      setErrors((previous) => ({
        ...previous,
        receiptFile:
          receiptFile.size > MAX_RECEIPT_SIZE
            ? t.checkout.receiptFileTooLarge
            : t.checkout.receiptFileInvalidType,
      }));
      return;
    }

    setUploadingReceipt(true);
    setReceiptError(false);
    try {
      const fileData = new FormData();
      fileData.append("file", receiptFile);
      fileData.append("senderDetails", formData.senderDetails);
      const response = await uploadPaymentReceiptFile(order.orderId, fileData);
      const uploadedOrderId =
        typeof response?.orderId === "string"
          ? response.orderId.trim().toLowerCase()
          : "";
      if (
        response?.succeeded !== true ||
        uploadedOrderId !== order.orderId.toLowerCase()
      ) {
        throw new Error("The receipt upload was not confirmed for this order.");
      }

      try {
        sessionStorage.removeItem(getPendingOrderStorageKey(order.userId));
        setPendingOrderStorageWarningFor(null);
      } catch {
        setPendingOrderStorageWarningFor(order.userId);
        dispatch(
          showToast({
            message: t.checkout.pendingOrderStorageCleanupError,
            severity: "error",
          }),
        );
      }
      setCreatedOrder(null);
      dispatch(
        showToast({
          message: t.checkout.receiptSubmitted,
          severity: "success",
        }),
      );
      navigate("/success", {
        state: {
          orderId: order.orderId,
          total: order.total,
          receiptSubmitted: true,
        },
      });
    } catch {
      setReceiptError(true);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleCheckout = async (event) => {
    event.preventDefault();

    if (activeCreatedOrder) {
      await uploadReceipt(activeCreatedOrder);
      return;
    }
    if (
      orderError === "uncertain" ||
      !pendingOrderReady ||
      mutationLoading ||
      serverStatus !== "ready" ||
      courseItems.length === 0
    ) {
      return;
    }
    if (instructionsStatus !== "ready") return;

    if (!validateCheckout()) {
      dispatch(
        showToast({
          message: t.checkout.validationError,
          severity: "error",
        }),
      );
      return;
    }

    setCreatingOrder(true);
    setOrderError(null);
    try {
      let response;
      try {
        response = await checkoutOrderApi();
      } catch (error) {
        setOrderError(
          isConfirmedOrderRejection(error) ? "failed" : "uncertain",
        );
        return;
      }

      const orderId =
        typeof response?.orderId === "string" ? response.orderId.trim() : "";
      if (!orderId) {
        setOrderError("uncertain");
        return;
      }

      const order = {
        orderId,
        total:
          typeof response.total === "number" && Number.isFinite(response.total)
            ? response.total
            : null,
        userId,
      };
      setCreatedOrder(order);
      try {
        sessionStorage.setItem(
          getPendingOrderStorageKey(userId),
          JSON.stringify({ orderId: order.orderId, total: order.total }),
        );
        setPendingOrderStorageWarningFor(null);
      } catch {
        setPendingOrderStorageWarningFor(userId);
      }
      await uploadReceipt(order);
    } finally {
      setCreatingOrder(false);
    }
  };

  if (
    (serverStatus === "idle" || serverStatus === "loading") &&
    !activeCreatedOrder
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted" role="status">
        {t.checkout.cartLoading}
      </div>
    );
  }

  if (serverStatus === "error" && !activeCreatedOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-text-main" role="alert">
        <p>{serverError || t.checkout.cartError}</p>
        <button
          type="button"
          onClick={() => dispatch(fetchCart())}
          className="text-sm font-bold text-primary hover:underline"
        >
          {t.cart.retry}
        </button>
      </div>
    );
  }

  if (courseItems.length === 0 && !activeCreatedOrder) {
    return (
      <div className="min-h-screen py-24 flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <FiShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold">{t.checkout.noCourseItems}</h2>
        <PrimaryButton onClick={() => navigate("/courses")} appearance="primary">
          {t.courses.title}
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="py-16 md:py-24 bg-bg-main text-text-main min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-10">
        <div className="relative space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <FiLock className="w-3.5 h-3.5" />
            <span>{t.checkout.secureNote}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            {t.checkout.title}
          </h1>
        </div>

        {activeCreatedOrder && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm" role="status">
            <p className="font-bold text-primary">
              {t.checkout.orderCreatedFor.replace(
                "{id}",
                activeCreatedOrder.orderId,
              )}
            </p>
            {receiptError && (
              <p className="mt-2 text-red-600" role="alert">
                {t.checkout.receiptUploadError}
              </p>
            )}
          </div>
        )}
        {(storedPendingOrder.status === "error" ||
          storedPendingOrder.status === "invalid") && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600" role="alert">
              {storedPendingOrder.status === "invalid"
                ? t.checkout.pendingOrderStorageCorrupted
                : t.checkout.pendingOrderStorageUnavailable}
            </p>
          )}
        {!userId && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600" role="alert">
            {t.checkout.pendingOrderUserUnavailable}
          </p>
        )}
        {pendingOrderStorageWarning && (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700" role="alert">
            {t.checkout.pendingOrderStorageWarning}
          </p>
        )}
        {orderError === "failed" && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600" role="alert">
            {t.checkout.orderCreationError}
          </p>
        )}
        {orderError === "uncertain" && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700" role="alert">
            <p>{t.checkout.orderCreationUncertain}</p>
            <button
              type="button"
              onClick={() => setOrderError(null)}
              className="mt-2 font-bold underline"
            >
              {t.checkout.retryAfterOrderHistoryCheck}
            </button>
          </div>
        )}
        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Customer & Payment Form */}
          <div className="lg:col-span-7 space-y-8">
            {/* Customer Information */}
            <div className="p-8 rounded-3xl bg-bg-surface border border-primary/10 space-y-6">
              <h2 className="text-lg font-bold uppercase tracking-wider">
                {t.checkout.customerInfo}
              </h2>

              <div className="space-y-4">
                <div className="relative">
                  <CustomInput
                    label={t.projectRequests.fullName}
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleFieldChange("fullName")}
                    onBlur={handleFieldBlur("fullName")}
                    placeholder={t.checkout.fullNamePlaceholder}
                    error={errors.fullName}
                  />
                </div>

                <div className="relative">
                  <CustomInput
                    label={t.projectRequests.email}
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleFieldChange("email")}
                    onBlur={handleFieldBlur("email")}
                    placeholder={t.checkout.emailPlaceholder}
                    error={errors.email}
                  />
                </div>

                <div className="relative">
                  <CustomInput
                    label={t.projectRequests.phone}
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleFieldChange("phone")}
                    onBlur={handleFieldBlur("phone")}
                    placeholder={t.checkout.phonePlaceholder}
                    error={errors.phone}
                  />
                </div>
              </div>
            </div>

            {/* Documented payment method */}
            <div className="p-8 rounded-3xl bg-bg-surface border border-primary/10 space-y-6">
              <h2 className="text-lg font-bold uppercase tracking-wider">
                {t.checkout.paymentMethod}
              </h2>
              <p className="text-sm font-semibold text-primary">
                {t.checkout.instapay}
              </p>
              {instructionsStatus === "loading" && (
                <p className="text-sm text-text-muted" role="status">
                  {t.checkout.loadingInstructions}
                </p>
              )}
              {instructionsStatus === "error" && (
                <div className="space-y-3 text-sm text-red-600" role="alert">
                  <p>{t.checkout.instructionsError}</p>
                  <button
                    type="button"
                    onClick={() => setInstructionsRetryKey((value) => value + 1)}
                    className="font-bold underline"
                  >
                    {t.checkout.retryInstructions}
                  </button>
                </div>
              )}
              {instructionsStatus === "ready" && instructionsData && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-bg-secondary border border-primary/15 space-y-4">
                    <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                      <div>
                        <span className="text-xs text-text-muted block">
                          {t.checkout.instaPayAccount}
                        </span>
                        <span className="font-bold text-sm text-primary">
                          {instructionsData.accountHandle}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(instructionsData.accountHandle, t.checkout.instaPayAccount)}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        {copiedField === t.checkout.instaPayAccount ? <FiCheck /> : <FiCopy />}
                        <span>{t.checkout.copy}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                      <div>
                        <span className="text-xs text-text-muted block">
                          {t.checkout.phoneNumber}
                        </span>
                        <span className="font-bold text-sm text-text-main">
                          {instructionsData.phoneNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(instructionsData.phoneNumber, t.checkout.phoneNumber)}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        {copiedField === t.checkout.phoneNumber ? <FiCheck /> : <FiCopy />}
                        <span>{t.checkout.copy}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-xs text-text-muted block">
                          {t.checkout.beneficiaryName}
                        </span>
                        <span className="font-bold text-sm text-text-main">
                          {instructionsData.accountName}
                        </span>
                      </div>
                      {instructionsData.paymentLink && (
                        <a
                          href={instructionsData.paymentLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-500 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <FiExternalLink />
                          <span>{t.checkout.openPaymentLink}</span>
                        </a>
                      )}
                    </div>
                    <p className="whitespace-pre-line text-xs leading-relaxed text-text-muted">
                      {instructionsData.instructions}
                    </p>
                  </div>
                </div>
              )}
              {(instructionsStatus === "ready" || activeCreatedOrder) && (
                <div className="space-y-5">
                  <div className="relative">
                    <CustomInput
                      label={`${t.checkout.senderDetails} *`}
                      name="senderDetails"
                      required
                      value={formData.senderDetails}
                      onChange={handleFieldChange("senderDetails")}
                      placeholder={t.checkout.senderDetailsPlaceholder}
                      error={errors.senderDetails}
                    />
                  </div>

                  <div className="relative space-y-2">
                    <label
                      htmlFor="checkout-receipt"
                      className={`block p-6 rounded-2xl border-2 border-dashed cursor-pointer text-center transition-all focus-within:ring-2 focus-within:ring-primary/50 ${
                        errors.receiptFile
                          ? "border-red-400 bg-red-400/5"
                          : receiptFile
                            ? "border-green-500/50 bg-green-500/5"
                            : "border-primary/25 bg-bg-secondary hover:border-primary/50"
                      }`}
                    >
                      <input
                        id="checkout-receipt"
                        name="receiptFile"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                        aria-label={t.checkout.uploadReceipt}
                        aria-invalid={errors.receiptFile ? "true" : undefined}
                        aria-describedby={
                          errors.receiptFile ? "checkout-receipt-error" : undefined
                        }
                        className="sr-only"
                      />
                      <p className="mb-3 text-sm font-semibold text-text-main/80">
                        {t.checkout.uploadReceipt} *
                      </p>
                      {receiptFile ? (
                        <div className="flex items-center justify-center gap-3 text-green-500">
                          <FiCheckCircle className="w-6 h-6 shrink-0" />
                          <div className="text-start">
                            <p className="text-xs font-bold text-text-main truncate max-w-xs">
                              {receiptFile.name}
                            </p>
                            <p className="text-[11px] text-text-muted">
                              {(receiptFile.size / 1024).toFixed(1)} KB — {t.checkout.changeReceipt}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FiUploadCloud className="w-8 h-8 text-primary mx-auto" />
                          <p className="text-xs font-bold text-text-main">
                            {t.checkout.uploadReceipt}
                          </p>
                          <p className="text-[11px] text-text-muted">
                            {t.checkout.receiptFileTypes}
                          </p>
                        </div>
                      )}
                    </label>
                    <FieldError
                      id="checkout-receipt-error"
                      message={errors.receiptFile}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Confirmation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-bg-surface border border-primary/10 space-y-6 sticky top-28 shadow-xl">
              <h2 className="text-lg font-bold uppercase tracking-wider">
                {t.checkout.orderSummary}
              </h2>

              <div className="space-y-3 divide-y divide-primary/5 max-h-72 overflow-y-auto pe-1">
                {courseItems.map((item) => (
                  <div key={item.id} className="pt-3 flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-14 h-14 rounded-xl object-cover border border-primary/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold line-clamp-1">{item.title}</p>
                      <p className="text-[11px] text-text-muted uppercase">
                        {t.courses.title}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-text-main">
                      ${Number(item.effectivePrice ?? item.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing breakdown */}
              <div className="pt-4 border-t border-primary/10 space-y-2 text-xs">
                {!activeCreatedOrder && serverStatus === "ready" && (
                  <>
                    <div className="flex justify-between text-text-muted">
                      <span>{t.cart.courseSubtotal}</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-500 font-bold">
                        <span>
                          {t.cart.discount}
                          {serverCouponCode ? ` (${serverCouponCode})` : ""}
                        </span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-base font-bold text-text-main pt-2 border-t border-primary/10">
                  <span>{t.cart.courseCheckoutTotal}</span>
                  <span className="text-primary text-xl font-black">
                    ${checkoutTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <PrimaryButton
                type="submit"
                loading={loading}
                disabled={
                  loading ||
                  (!activeCreatedOrder && !pendingOrderReady) ||
                  orderError === "uncertain" ||
                  mutationLoading ||
                  (!activeCreatedOrder &&
                    (instructionsStatus !== "ready" ||
                      serverStatus !== "ready" ||
                      courseItems.length === 0))
                }
                appearance="primary"
                fullWidth
                className="!py-4 font-bold text-sm"
                endIcon={dir === "rtl" ? <FiArrowLeft /> : <FiArrowRight />}
              >
                {creatingOrder
                  ? t.checkout.processing
                  : uploadingReceipt
                    ? t.checkout.receiptUploading
                    : activeCreatedOrder
                      ? t.checkout.retryReceiptUpload
                      : `${t.checkout.placeOrder} ($${total.toFixed(2)})`}
              </PrimaryButton>

              <div className="text-center">
                <span className="text-[11px] text-text-muted">
                  {t.checkout.paymentReviewNote}
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
