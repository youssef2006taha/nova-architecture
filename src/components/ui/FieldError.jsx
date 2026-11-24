function FieldError({ id, message }) {
  if (!message) return null;

  return (
    <div className="absolute right-4 bottom-0 z-10 max-w-[calc(100%-2rem)] translate-y-1/2">
      <p
        id={id}
        role="alert"
        className="whitespace-normal break-words rounded-2xl border border-red-400/40 bg-bg-surface px-2 py-0.5 text-xs leading-relaxed text-red-400"
      >
        {message}
      </p>
    </div>
  );
}

export default FieldError;
