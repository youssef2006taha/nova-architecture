import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "../cart/CartDrawer";
import { useDispatch, useSelector } from "react-redux";
import { closeMobileMenu } from "../../features/ui/uiSlice";
import useTranslation from "../../hooks/useTranslation";

function MainLayout() {
  const dispatch = useDispatch();
  const isMobileMenuOpen = useSelector((state) => state.ui.isMobileMenuOpen);
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen bg-bg-main text-text-main transition-colors duration-200">
      <Navbar />
      <div className="relative isolate flex flex-1 flex-col">
        {isMobileMenuOpen && (
          <button
            type="button"
            aria-label={t.nav.closeMenu}
            onClick={() => dispatch(closeMobileMenu())}
            className="absolute inset-0 z-40 cursor-pointer bg-black/50 backdrop-blur-sm"
          />
        )}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
        <Footer />
      </div>
      <CartDrawer />
    </div>
  );
}

export default MainLayout;
