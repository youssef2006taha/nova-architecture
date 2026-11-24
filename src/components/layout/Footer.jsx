import { Link } from "react-router-dom";
import { FiMail, FiArrowUpRight } from "react-icons/fi";
import useTranslation from "../../hooks/useTranslation";

export default function Footer() {
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-secondary border-t border-primary/10 pt-20 pb-10 text-text-main">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="https://horizons-cdn.hostinger.com/80049975-2119-4454-aeed-b9393e3ea99d/1d4528a5019fd7a392477d2b6ef6d82a.png"
                alt="Archviz Nova"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <span className="font-extrabold tracking-widest text-xl text-text-main">
                ARCHVIZ<span className="text-primary font-black ml-1">NOVA</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed max-w-sm">
              {t.footer.tagline}
            </p>

          </div>

          {/* Pillar Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-main">
              {t.footer.platform}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/courses"
                  className="text-text-muted hover:text-primary transition-colors flex items-center gap-1 group"
                >
                  <span>{t.nav.courses}</span>
                  <FiArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  to="/3d-scenes"
                  className="text-text-muted hover:text-primary transition-colors flex items-center gap-1 group"
                >
                  <span>{t.nav.scenes}</span>
                  <FiArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  to="/furniture"
                  className="text-text-muted hover:text-primary transition-colors flex items-center gap-1 group"
                >
                  <span>{t.nav.furniture}</span>
                  <FiArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  to="/project-requests"
                  className="text-text-muted hover:text-primary transition-colors flex items-center gap-1 group"
                >
                  <span>{t.nav.projectRequests}</span>
                  <FiArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-main">
              {t.footer.support}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-text-muted hover:text-primary transition-colors"
                >
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="text-text-muted hover:text-primary transition-colors"
                >
                  {t.nav.dashboard}
                </Link>
              </li>
              <li>
                <span className="text-text-muted">
                  {t.footer.terms}
                </span>
              </li>
              <li>
                <span className="text-text-muted">
                  {t.footer.privacy}
                </span>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-main">
              {t.footer.contact}
            </h4>
            <div className="space-y-2.5 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-primary shrink-0" />
                <a
                  href="mailto:contact@archviznova.com"
                  className="text-xs hover:text-primary transition-colors"
                >
                  contact@archviznova.com
                </a>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {t.footer.availability}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted gap-4">
          <p>© {currentYear} Archviz Nova / KLOV. {t.footer.rights}</p>
          <div className="flex items-center gap-4">
            <span>{t.footer.builtFor}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
