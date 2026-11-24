import { FiGlobe, FiMoon, FiSun } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { toggleLanguage } from "../../../features/lang/langSlice";
import { toggleTheme } from "../../../features/ui/uiSlice";
import useTranslation from "../../../hooks/useTranslation";

export default function AuthControls() {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.ui);
  const { t, currentLang } = useTranslation();

  return (
    <div className="absolute end-4 top-4 z-20 flex items-center gap-2" aria-label={t.auth.language}>
      <button
        type="button"
        onClick={() => dispatch(toggleTheme())}
        className="grid size-10 place-items-center rounded-xl border border-primary/15 bg-bg-surface/80 text-text-muted shadow-sm backdrop-blur-xl transition hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        aria-label={t.auth.theme}
        title={t.auth.theme}
      >
        {theme === "dark" ? <FiSun className="size-4" /> : <FiMoon className="size-4" />}
      </button>
      <button
        type="button"
        onClick={() => dispatch(toggleLanguage())}
        className="flex h-10 items-center gap-1.5 rounded-xl border border-primary/15 bg-bg-surface/80 px-3 text-xs font-bold text-text-muted shadow-sm backdrop-blur-xl transition hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        aria-label={t.auth.language}
        title={t.auth.language}
      >
        <FiGlobe className="size-4" />
        <span>{currentLang === "ar" ? "EN" : "عربي"}</span>
      </button>
    </div>
  );
}
