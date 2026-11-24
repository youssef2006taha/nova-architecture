export default function AdminRejectionForm({
  value,
  onChange,
  onSubmit,
  disabled,
  reasonLabel,
  confirmLabel,
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={reasonLabel}
        placeholder={reasonLabel}
        className="min-w-0 flex-1 rounded-xl border border-primary/15 bg-bg-main px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={onSubmit}
        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {confirmLabel}
      </button>
    </div>
  );
}
