import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FiX,
  FiTrash2,
  FiShoppingBag,
  FiArrowRight,
  FiArrowLeft,
  FiCheck,
} from "react-icons/fi";
import {
  applyServerCoupon,
  fetchCart,
  removeCourseFromCart,
  removeServerCoupon,
  setCartOpen,
} from "../../features/cart/cartSlice";
import { showToast } from "../../features/ui/toast/toastSlice";
import useTranslation from "../../hooks/useTranslation";
import PrimaryButton from "../ui/PrimaryButton";
import Backdrop from "../ui/Backbrop";

export default function CartDrawer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, dir, currentLang } = useTranslation();
  const {
    items,
    isCartOpen,
    serverCouponCode,
    serverTotals,
    serverStatus,
    serverError,
    mutationLoading,
  } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [couponCode, setCouponCode] = useState("");
  const courseItems = items;

  const closeCart = () => {
    dispatch(setCartOpen(false));
  };

  const discountAmount = serverTotals?.discountAmount || 0;

  const renderCartItem = (item) => (
    <div
      key={item.id}
      className="flex gap-4 p-3 rounded-2xl bg-bg-secondary border border-primary/5 hover:border-primary/20 transition-all duration-200"
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-20 h-20 rounded-xl object-cover border border-primary/10 shrink-0"
        />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-primary/5 border border-primary/10 shrink-0" />
      )}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-sm font-semibold text-text-main line-clamp-2">
            {item.title}
          </h4>
          <button
            type="button"
            onClick={() => handleRemoveItem(item)}
            disabled={mutationLoading}
            className="text-text-muted hover:text-red-500 transition-colors p-1"
            aria-label={`${t.cart.removeItem}: ${item.title}`}
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            ${Number(item.effectivePrice ?? item.price).toFixed(2)}
          </div>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
            {t.cart.serverCourses}
          </span>
        </div>
      </div>
    </div>
  );

  const handleRemoveItem = async (item) => {
    try {
      await dispatch(removeCourseFromCart(item.id)).unwrap();
    } catch (error) {
      dispatch(
        showToast({
          message: typeof error === "string" ? error : t.cart.requestError,
          severity: "error",
        }),
      );
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const upper = couponCode.trim().toUpperCase();

    try {
      await dispatch(applyServerCoupon(upper)).unwrap();
      dispatch(
        showToast({
          message: t.cart.couponApplied,
          severity: "success",
        })
      );
      setCouponCode("");
    } catch (error) {
      dispatch(
        showToast({
          message:
            typeof error === "string" ? error : t.cart.couponRequestError,
          severity: "error",
        })
      );
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await dispatch(removeServerCoupon()).unwrap();
    } catch (error) {
      dispatch(
        showToast({
          message:
            typeof error === "string" ? error : t.cart.couponRequestError,
          severity: "error",
        }),
      );
    }
  };

  const handleProceedCheckout = () => {
    if (mutationLoading) {
      dispatch(
        showToast({
          message: t.cart.mutationInProgress,
          severity: "error",
        }),
      );
      return;
    }

    if (serverStatus !== "ready") {
      if (serverStatus !== "loading") dispatch(fetchCart());
      dispatch(
        showToast({
          message:
            serverStatus === "error"
              ? serverError || t.cart.loadError
              : t.cart.loading,
          severity: "error",
        }),
      );
      return;
    }

    if (courseItems.length === 0) {
      dispatch(
        showToast({
          message: t.cart.noCourseItems,
          severity: "error",
        }),
      );
      return;
    }

    closeCart();
    if (!isAuthenticated) {
      dispatch(
        showToast({
          message:
            currentLang === "ar"
              ? "يرجى تسجيل الدخول أولاً لإتمام عملية الشراء والدفع."
              : "Please sign in first to proceed to checkout.",
          severity: "error",
        })
      );
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  return (
    <Backdrop
      open={isCartOpen}
      onClose={closeCart}
      ariaLabelledBy="cart-drawer-heading"
      closeLabel={t.common.close}
      zIndexClassName="z-50"
      positionClassName="items-stretch justify-end p-0"
      overlayClassName="bg-black/60 backdrop-blur-xs"
      modalClassName="!w-screen !max-w-md !h-full !rounded-none !border-0 !p-0 !bg-transparent !shadow-none !overflow-visible"
      showCloseButton={false}
      animationMode="slide"
      slideDirection={dir === "rtl" ? "left" : "right"}
      lockScroll
    >
      <div className="w-screen max-w-md bg-bg-surface border-s border-primary/10 shadow-2xl flex flex-col h-full text-text-main">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <FiShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 id="cart-drawer-heading" className="font-bold text-lg">
                  {t.cart.title}
                </h2>
                <span className="text-xs text-text-muted">
                  {items.length} {t.cart.items}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-primary/5 transition-colors"
              aria-label={t.cart.closeCart}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {serverStatus === "loading" && (
              <p className="text-sm text-text-muted" role="status">
                {t.cart.loading}
              </p>
            )}
            {serverStatus === "error" && (
              <div className="flex items-center justify-between gap-3 text-sm text-red-500" role="alert">
                <span>{serverError || t.cart.loadError}</span>
                <button
                  type="button"
                  onClick={() => dispatch(fetchCart())}
                  className="font-bold underline"
                >
                  {t.cart.retry}
                </button>
              </div>
            )}
            {items.length === 0 &&
            serverStatus !== "loading" &&
            serverStatus !== "error" ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-text-muted">
                  <FiShoppingBag className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{t.cart.empty}</h3>
                  <p className="text-sm text-text-muted">{t.cart.emptySub}</p>
                </div>
                <PrimaryButton
                  onClick={() => {
                    closeCart();
                    navigate("/courses");
                  }}
                  appearance="primary"
                  className="mt-4"
                >
                  {t.courses.title}
                </PrimaryButton>
              </div>
            ) : (
              <div className="space-y-5">
                {courseItems.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-text-muted">
                      {t.cart.serverCourses}
                    </h3>
                    {courseItems.map(renderCartItem)}
                  </section>
                )}
              </div>
            )}
          </div>

          {/* Footer & Checkout Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-primary/10 bg-bg-surface space-y-4">
              {/* Coupon Form */}
              {serverStatus === "ready" && courseItems.length > 0 && (
                serverCouponCode ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-600 dark:text-green-400">
                    <div className="flex items-center gap-2">
                      <FiCheck className="w-4 h-4" />
                      <span>
                        {t.cart.appliedCoupon.replace("{code}", serverCouponCode)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      disabled={mutationLoading}
                      className="text-text-muted hover:text-red-500 font-bold"
                      aria-label={t.cart.removeCoupon}
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <label htmlFor="cart-coupon-code" className="sr-only">
                        {t.cart.couponInputLabel}
                      </label>
                      <input
                        id="cart-coupon-code"
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder={t.cart.couponCode}
                        className="w-full h-10 px-3 text-xs rounded-xl bg-bg-secondary border border-primary/10 focus:border-primary/40 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={mutationLoading}
                      className="h-10 px-4 text-xs font-bold rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    >
                      {t.cart.applyCoupon}
                    </button>
                  </form>
                )
              )}

              {/* Price rows */}
              <div className="space-y-2 text-sm">
                {serverStatus === "ready" && (
                  <>
                    <div className="flex justify-between text-text-muted">
                      <span>{t.cart.courseSubtotal}</span>
                      <span>${Number(serverTotals?.subTotal || 0).toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>{t.cart.discount}</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-text-main pt-2 border-t border-primary/10">
                      <span>{t.cart.courseCheckoutTotal}</span>
                      <span className="text-primary">
                        ${Number(serverTotals?.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Button */}
              <PrimaryButton
                onClick={handleProceedCheckout}
                disabled={
                  mutationLoading ||
                  serverStatus !== "ready" ||
                  courseItems.length === 0
                }
                fullWidth
                appearance="primary"
                endIcon={dir === "rtl" ? <FiArrowLeft /> : <FiArrowRight />}
              >
                {t.cart.checkout}
              </PrimaryButton>
            </div>
          )}
      </div>
    </Backdrop>
  );
}
