import { useId } from "react";
import { FiChevronDown } from "react-icons/fi";
import FieldError from "./FieldError";

function CustomSelect({
  name = "",
  label,
  placeholder = "",
  options = [],
  value,
  onChange,
  onBlur,
  error,
  required = false,
  wrapperClassName = "",
  className = "",
  children,
  ...props
}) {
  const autoId = useId();
  const selectId = props.id || autoId;
  const errorId = `${selectId}-error`;
  const isPlaceholder = value === "";

  return (
    <div className={`relative flex flex-col gap-2 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-semibold text-text-main/60 dark:text-text-main/90"
        >
          {label}
          {required && (
            <span aria-hidden="true" className="ml-1 text-red-400">
              *
            </span>
          )}
        </label>
      )}

      <div className="group relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`
            h-11 w-full cursor-pointer appearance-none rounded-md border bg-primary/4
            ps-3 pe-10 text-sm outline-none transition-all duration-200
            ${isPlaceholder ? "text-text-muted" : "text-text-main"}
            ${error ? "border-red-400" : "border-primary/7 hover:border-primary/25"}
            focus:border-primary/40 focus:ring-2 focus:ring-primary/30 dark:focus:ring-primary/70
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-bg-surface text-text-muted">
              {placeholder}
            </option>
          )}

          {options.length > 0
            ? options.map((opt) => {
                const optValue = typeof opt === "object" ? opt.value : opt;
                const optLabel = typeof opt === "object" ? opt.label : opt;
                return (
                  <option
                    key={optValue}
                    value={optValue}
                    className="bg-bg-surface text-text-main capitalize"
                  >
                    {optLabel}
                  </option>
                );
              })
            : children}
        </select>

        <FiChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-text-muted/60 transition duration-200 group-focus-within:rotate-180 group-focus-within:text-primary" />
      </div>

      <FieldError id={errorId} message={error} />
    </div>
  );
}

export default CustomSelect;