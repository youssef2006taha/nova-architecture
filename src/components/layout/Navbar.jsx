import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import {
  FiShoppingBag,
  FiSun,
  FiMoon,
  FiGlobe,
  FiMenu,
  FiX,
  FiLogOut,
  FiGrid,
  FiDownload,
  FiPackage,
  FiChevronDown,
} from "react-icons/fi";
import {
  closeMobileMenu,
  toggleMobileMenu,
  toggleTheme,
} from "../../features/ui/uiSlice";
import { toggleLanguage } from "../../features/lang/langSlice";
import {
  clearServerCart,
  fetchCart,
  toggleCart,
} from "../../features/cart/cartSlice";
import { logout } from "../../features/authentication/auth/thunk/logoutThunk";
import useTranslation from "../../hooks/useTranslation";
import PrimaryButton from "../ui/PrimaryButton";
import {
  getDashboardNavigationRoles,
  userHasRole,
} from "../../utils/auth/roles";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, currentLang } = useTranslation();

  const { theme, isMobileMenuOpen } = useSelector((state) => state.ui);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);

  const mobileMenuRef = useRef(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const availableDashboards = getDashboardNavigationRoles(user);
  const hasStudentDashboard = userHasRole(user, "Student");

  const totalCartCount = items.reduce(
    (acc, item) => acc + (item.quantity || 1),
    0
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    } else {
      dispatch(clearServerCart());
    }
  }, [dispatch, isAuthenticated]);

  useLayoutEffect(() => {
    const menu = mobileMenuRef.current;
    if (!menu) return undefined;

    if (isMobileMenuOpen) {
      gsap.set(menu, { visibility: "visible" });
    }

    const animation = gsap.to(menu, {
      height: isMobileMenuOpen ? "auto" : 0,
      duration: 0.35,
      ease: isMobileMenuOpen ? "power2.out" : "power2.in",
      onComplete: () => {
        if (!isMobileMenuOpen) gsap.set(menu, { visibility: "hidden" });
      },
    });

    return () => animation.kill();
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: t.nav.courses, path: "/courses" },
    { name: t.nav.scenes, path: "/3d-scenes" },
    { name: t.nav.furniture, path: "/furniture" },
    { name: t.nav.projectRequests, path: "/project-requests" },
    { name: t.nav.about, path: "/about" },
  ];

  const handleLogout = () => {
    dispatch(logout());
    setUserDropdownOpen(false);
    navigate("/");
  };

  return (
    <header
      className={`sticky py-1 top-0 z-50 w-full transition-all duration-300 border-b ${
        scrolled
          ? "bg-bg-main/95 backdrop-blur-md shadow-lg shadow-black/5 border-primary/15"
          : "bg-bg-main/90 backdrop-blur-sm border-primary/10"
      }`}
    >
      <div className="container px-4 sm:px-6 h-20 md:h-22 flex items-center justify-between max-w-7xl">
        {/* Brand Logo - clean and uncluttered */}
        <Link
          to="/"
          className="flex items-center gap-3 group flex-shrink-0 hover:opacity-90 transition-opacity"
        >
          <img
            src="https://horizons-cdn.hostinger.com/80049975-2119-4454-aeed-b9393e3ea99d/1d4528a5019fd7a392477d2b6ef6d82a.png"
            alt="Archviz Nova"
            className="h-20 w-auto object-contain"
          />
          <div className="hidden sm:flex lg:hidden flex-col">
            <span className="font-black text-xl tracking-widest text-text-main group-hover:text-primary transition-colors">
              ARCHVIZ<span className="text-primary ml-1">NOVA</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold -mt-1">
              {t.nav.brandSubtitle}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label={t.nav.primaryNavigation}
          className="hidden lg:flex items-center gap-4 xl:gap-7"
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `text-[10px] xl:text-xs font-semibold uppercase tracking-wider transition-all duration-200 hover:text-primary whitespace-nowrap ${
                  isActive
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-text-muted hover:text-text-main"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Action Controls & User Menu */}
        <div className="min-h-10 flex gap-2 sm:gap-2">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => dispatch(toggleTheme())}
            className="h-full aspect-square cursor-pointer bg-bg-surface p-2.5 rounded-xl text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
            aria-label={
              theme === "dark" ? t.nav.switchToLight : t.nav.switchToDark
            }
            aria-pressed={theme === "light"}
          >
            {theme === "dark" ? (
              <FiSun className="w-5 h-4" />
            ) : (
              <FiMoon className="w-4 h-4" />
            )}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => dispatch(toggleLanguage())}
            className="cursor-pointer bg-bg-surface flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
            aria-label={t.nav.switchLanguage}
          >
            <FiGlobe className="w-3.5 h-3.5" />
            <span className="uppercase">{currentLang === "ar" ? "EN" : "عربي"}</span>
          </button>

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={() => dispatch(toggleCart())}
            className="cursor-pointer relative px-2.5 rounded-xl text-text-main hover:text-primary hover:bg-primary/5 border border-primary/10 transition-colors"
            aria-label={t.nav.cart}
          >
            <FiShoppingBag className="w-5 h-5" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-inverse rounded-full text-[11px] font-bold flex items-center justify-center shadow-md animate-pulse">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Authentication State */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
                aria-controls={userDropdownOpen ? "user-navigation-menu" : undefined}
                aria-label={user?.fullName || user?.email || t.nav.dashboard}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary text-primary-inverse flex items-center justify-center text-xs font-bold">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
                <span className="text-xs font-bold max-w-[100px] truncate hidden sm:inline-block">
                  {user?.fullName || user?.email?.split("@")[0]}
                </span>
                <FiChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div id="user-navigation-menu" className="absolute end-0 mt-2 w-56 rounded-2xl bg-bg-surface border border-primary/15 shadow-2xl py-2 z-50 text-text-main animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-primary/10">
                    <p className="text-xs font-bold text-text-main truncate">
                      {user?.fullName || t.nav.user}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {user?.email}
                    </p>
                  </div>

                  {availableDashboards.map(({ role, path, label }) => (
                    <Link
                      key={role}
                      to={path}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-muted transition-colors hover:bg-primary/5 hover:text-text-main"
                    >
                      <FiGrid className="h-4 w-4 text-primary" />
                      <span>{t.nav[label]}</span>
                    </Link>
                  ))}

                  {hasStudentDashboard && (
                    <>
                      <Link
                        to="/dashboard/downloads"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-muted transition-colors hover:bg-primary/5 hover:text-text-main"
                      >
                        <FiDownload className="h-4 w-4 text-primary" />
                        <span>{t.nav.myDownloads}</span>
                      </Link>
                      <Link
                        to="/dashboard/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-muted transition-colors hover:bg-primary/5 hover:text-text-main"
                      >
                        <FiPackage className="h-4 w-4 text-primary" />
                        <span>{t.nav.myOrders}</span>
                      </Link>
                    </>
                  )}

                  <div className="border-t border-primary/10 my-1" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors text-start"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>{t.nav.logout}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
              <Link
                to="/login"
                className="h-full flex items-center bg-bg-secondary hover:bg-primary-active/15 rounded-xl px-4 text-xs font-bold uppercase tracking-wider text-text-main hover:text-primary transition-colors"
              >
                {t.nav.login}
              </Link>
              <PrimaryButton
                onClick={() => navigate("/register")}
                appearance="primary"
                className="!py-2 !px-4 !text-xs font-bold"
              >
                {t.nav.register}
              </PrimaryButton>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => dispatch(toggleMobileMenu())}
            className="lg:hidden p-2 rounded-xl text-text-main hover:text-primary hover:bg-primary/5"
            aria-label={isMobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-menu"
          >
            {isMobileMenuOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-navigation-menu"
        ref={mobileMenuRef}
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
        style={{ height: 0, visibility: "hidden" }}
        className="absolute inset-x-0 top-full z-50 w-full overflow-hidden border-b border-primary/15 bg-bg-surface shadow-xl lg:hidden"
      >
          <div className="max-h-[calc(100dvh-5rem)] overflow-y-auto px-6 py-6">
            <nav aria-label={t.nav.mobileNavigation} className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => dispatch(closeMobileMenu())}
                  className={({ isActive }) =>
                    `text-sm font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-text-muted hover:text-text-main hover:bg-primary/5"
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {!isAuthenticated && (
              <div className="pt-4 mt-4 border-t border-primary/10 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => dispatch(closeMobileMenu())}
                  className="w-full py-2.5 text-center text-sm font-bold rounded-xl border border-primary/20 text-text-main hover:bg-primary/5 transition-colors"
                >
                  {t.nav.login}
                </Link>
                <PrimaryButton
                  onClick={() => {
                    dispatch(closeMobileMenu());
                    navigate("/register");
                  }}
                  appearance="primary"
                  fullWidth
                >
                  {t.nav.register}
                </PrimaryButton>
              </div>
            )}
          </div>
      </div>
    </header>
  );
}
