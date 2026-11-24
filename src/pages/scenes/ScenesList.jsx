import useTranslation from "../../hooks/useTranslation";

export default function ScenesList() {
  const { t } = useTranslation();

  return (
    <div className="py-16 md:py-24 bg-bg-main text-text-main min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            {t.scenes.eyebrow}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight">
            {t.scenes.title}
          </h1>
          <p className="text-base sm:text-lg text-text-muted">
            {t.scenes.subtitle}
          </p>
        </div>

        <p
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700"
          role="status"
        >
          {t.scenes.catalogUnavailable}
        </p>
      </div>
    </div>
  );
}
