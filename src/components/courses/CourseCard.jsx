import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiClock, FiShoppingBag, FiStar, FiUsers } from "react-icons/fi";
import { addCourseToCart } from "../../features/cart/cartSlice";
import { showToast } from "../../features/ui/toast/toastSlice";
import useTranslation from "../../hooks/useTranslation";

const formatPrice = (price) => `$${Number(price).toFixed(2)}`;

export default function CourseCard({
  course,
  item = course,
  type = "course",
  to,
  imageUrl,
  imageAlt,
  imageAspectClassName = "aspect-16/10",
  imageGradient = type === "course",
  title,
  description,
  categoryLabel,
  topBadge,
  bottomBadge,
  bottomBadgeIcon,
  rating,
  reviewCount,
  tags = [],
  details = [],
  footerNote,
  footerNoteIcon,
  price,
  discountPrice,
  onAddToCart,
  addToCartLabel,
  showAddToCart = type === "course" || Boolean(onAddToCart),
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, currentLang } = useTranslation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { mutationLoading } = useSelector((state) => state.cart);

  const cardItem = item || {};
  const cardTitle = title ?? cardItem.title ?? "";
  const cardImage = imageUrl ?? cardItem.thumbnailUrl ?? cardItem.imageUrl;
  const cardDescription =
    description ?? cardItem.subtitle ?? cardItem.description;
  const cardPrice = price ?? cardItem.price;
  const cardDiscountPrice = discountPrice ?? cardItem.discountPrice;
  const cardLink =
    to ??
    (type === "course" && (cardItem.slug || cardItem.id)
      ? `/courses/${cardItem.slug || cardItem.id}`
      : undefined);
  const cardCategory = categoryLabel ?? cardItem.categoryName;
  const cardTopBadge =
    topBadge ?? (type === "course" ? cardItem.level : undefined);
  const courseHours =
    cardItem.totalDurationMinutes == null
      ? null
      : Math.round(cardItem.totalDurationMinutes / 60);
  const cardBottomBadge =
    bottomBadge ??
    (courseHours == null ? undefined : `${courseHours} ${t.courses.hours}`);
  const CardBottomBadgeIcon =
    bottomBadgeIcon ?? (type === "course" && courseHours != null ? FiClock : null);
  const cardRating = rating ?? (type === "course" ? cardItem.averageRating : undefined);
  const cardReviewCount =
    reviewCount ?? (type === "course" ? cardItem.totalReviews : undefined);
  const cardFooterNote =
    footerNote ??
    (type === "course" && cardItem.enrolledStudentsCount != null
      ? `${cardItem.enrolledStudentsCount} ${t.courses.students}`
      : undefined);
  const CardFooterNoteIcon =
    footerNoteIcon ??
    (type === "course" && cardFooterNote ? FiUsers : null);
  const cardAddToCartLabel =
    addToCartLabel ?? `${t.courses.addToCart}: ${cardTitle}`;

  const handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (onAddToCart) {
      onAddToCart(cardItem);
      return;
    }

    if (type !== "course") return;

    if (!isAuthenticated) {
      dispatch(
        showToast({
          message:
            currentLang === "ar"
              ? "يرجى تسجيل الدخول أولاً للتمكن من اختيار وإضافة الكورس للسلة."
              : "Please sign in first to select and add courses to your cart.",
          severity: "error",
        }),
      );
      navigate("/login", {
        state: { from: `/courses/${cardItem.slug || cardItem.id}` },
      });
      return;
    }

    try {
      await dispatch(addCourseToCart(cardItem.id)).unwrap();
      dispatch(
        showToast({
          message: `${cardTitle} ${t.courses.addedToCart}`,
          severity: "success",
        }),
      );
    } catch (error) {
      dispatch(
        showToast({
          message: typeof error === "string" ? error : t.cart.requestError,
          severity: "error",
        }),
      );
    }
  };

  const image = (
    <div
      className={`relative ${imageAspectClassName} overflow-hidden bg-bg-secondary`}
    >
      <img
        src={cardImage}
        alt={imageAlt ?? cardTitle}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      {imageGradient && (
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
      )}
      {cardTopBadge && (
        <span className="absolute top-3 start-3 px-3 py-1 rounded-full text-[11px] font-bold bg-bg-main/90 backdrop-blur-md text-text-main border border-primary/10 shadow-sm">
          {cardTopBadge}
        </span>
      )}
      {cardBottomBadge && (
        <span className="absolute bottom-3 end-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-black/60 backdrop-blur-md text-white flex items-center gap-1.5">
          {CardBottomBadgeIcon && (
            <CardBottomBadgeIcon className="w-3 h-3 text-primary" />
          )}
          {cardBottomBadge}
        </span>
      )}
    </div>
  );

  return (
    <article className="group flex flex-col bg-bg-surface border border-primary/10 rounded-3xl overflow-hidden hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
      {cardLink ? (
        <Link to={cardLink} className="block">
          {image}
        </Link>
      ) : (
        image
      )}

      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {(cardCategory || cardRating != null) && (
            <div className="flex items-center justify-between text-xs text-text-muted">
              {cardCategory ? (
                <span className="font-semibold text-primary uppercase tracking-wider text-[11px]">
                  {cardCategory}
                </span>
              ) : (
                <span />
              )}
              {cardRating != null && (
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <FiStar className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{cardRating}</span>
                  {cardReviewCount != null && (
                    <span className="text-text-muted font-normal text-[11px]">
                      ({cardReviewCount})
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {cardLink ? (
            <Link
              to={cardLink}
              className="block font-bold text-base md:text-lg text-text-main group-hover:text-primary transition-colors line-clamp-2 leading-snug"
            >
              {cardTitle}
            </Link>
          ) : (
            <h3 className="font-bold text-base md:text-lg text-text-main group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {cardTitle}
            </h3>
          )}

          {cardDescription && (
            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
              {cardDescription}
            </p>
          )}

          {tags.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/5 text-primary border border-primary/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {details.length > 0 && (
            <div className="pt-2 text-[11px] text-text-muted space-y-1">
              {details.map(({ label, value }) => (
                <div key={label}>
                  <strong>{label}:</strong> {value}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-primary/10 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-text-main">
                {formatPrice(cardDiscountPrice ?? cardPrice)}
              </span>
              {cardDiscountPrice != null &&
                Number(cardDiscountPrice) < Number(cardPrice) && (
                  <span className="text-xs text-text-muted line-through">
                    {formatPrice(cardPrice)}
                  </span>
                )}
            </div>
            {cardFooterNote && (
              <div className="flex items-center gap-1 text-[11px] text-text-muted mt-0.5">
                {CardFooterNoteIcon && (
                  <CardFooterNoteIcon className="w-3 h-3 text-primary" />
                )}
                <span>{cardFooterNote}</span>
              </div>
            )}
          </div>

          {showAddToCart && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={type === "course" && !onAddToCart && mutationLoading}
              className="p-3 rounded-2xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-inverse transition-all duration-200 border border-primary/20 hover:border-primary shadow-xs"
              title={cardAddToCartLabel}
              aria-label={cardAddToCartLabel}
            >
              <FiShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
