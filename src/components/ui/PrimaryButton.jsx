import { Button, CircularProgress } from "@mui/material";

const roundedMap = {
  none: "!rounded-none",
  sm: "!rounded-sm",
  md: "!rounded-md",
  lg: "!rounded-lg",
  xl: "!rounded-xl",
  "2xl": "!rounded-2xl",
  full: "!rounded-full",
};

const appearanceMap = {
  primary: `
    group relative overflow-hidden
    bg-linear-to-r from-primary to-bg-ball-1 !text-primary-inverse
    shadow-lg shadow-primary/30
    hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40
    active:translate-y-0 active:scale-[0.98]
    disabled:!opacity-60 disabled:!shadow-none
  `,
  danger: `
    !text-red-500 dark:!text-red-400 !bg-red-500/10 !border !border-red-500/20
    hover:!bg-red-500/20 hover:!border-red-500/40
    active:scale-[0.98]
    disabled:!opacity-60
  `,
  outline: `
    !text-text-main !bg-transparent !border !border-primary/25
    hover:!bg-primary-light hover:!border-primary/50
    active:scale-[0.98]
    disabled:!opacity-60
  `,
  icon: `
    !min-w-0 !p-2.5 !text-text-muted !bg-transparent
    hover:!bg-primary-light hover:!text-primary
    active:scale-95
    disabled:!opacity-60
  `,
};

function PrimaryButton({
  children,
  loading = false,
  loadingText,
  startIcon,
  endIcon,
  appearance = "primary",
  fullWidth = false,
  className = "",
  disabled = false,
  rounded = "xl",
  ...props
}) {
  const isPrimary = appearance === "primary";
  const isIcon = appearance === "icon";

  return (
    <Button
      disableRipple
      disableElevation
      {...props}
      type={props.type || "button"}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      startIcon={loading ? null : startIcon}
      endIcon={loading ? null : endIcon}
      className={`
        ${roundedMap[rounded] || roundedMap.xl}
        ${isIcon ? "" : "!px-5 !py-2.5"}
        !capitalize !font-semibold !leading-normal !outline-none
        !transition-all !duration-200
        focus-visible:ring-4 focus-visible:ring-primary/30 !gap-2
        [&_.MuiButton-startIcon]:!m-0 [&_.MuiButton-endIcon]:!m-0
        ${appearanceMap[appearance] || appearanceMap.primary}
        ${className}
      `}
    >
      {/* shimmer sweep */}
      {isPrimary && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
      )}

      <span className="relative inline-flex items-center gap-2">
        {loading && (
          <CircularProgress
            size={18}
            thickness={5}
            color="inherit"
          />
        )}
        {loading ? loadingText || children : children}
      </span>
    </Button>
  );
}

export default PrimaryButton;