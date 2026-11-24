import { useId, useState } from "react";
import { InputBase, InputAdornment, IconButton } from "@mui/material";

import MailIcon from "@mui/icons-material/Mail";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SearchIcon from "@mui/icons-material/Search";

import FieldError from "./FieldError";
import useTranslation from "../../hooks/useTranslation";

const fieldsConfig = {
  username: {
    label: "Username",
    type: "text",
    placeholder: "Enter Username",
    icon: <PersonIcon className="!text-[20px]" />,
  },
  email: {
    label: "Email",
    type: "email",
    placeholder: "Enter Email",
    icon: <MailIcon className="!text-[20px]" />,
  },
  password: {
    label: "Password",
    type: "password",
    placeholder: "Enter Password",
    icon: <LockIcon className="!text-[20px]" />,
  },
  phone: {
    label: "Phone",
    type: "tel",
    placeholder: "Enter Phone Number",
    icon: <PhoneIcon className="!text-[20px]" />,
  },
  text: { label: "", type: "text", placeholder: "", icon: null },
  search: {
    label: "",
    type: "search",
    placeholder: "Search...",
    icon: <SearchIcon className="!text-[20px]" />,
  },
};

function CustomInput({
  field = "text",
  name = "",
  label,
  placeholder,
  type,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  wrapperClassName = "",
  className = "",
  inputPropsClassName = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();
  const autoId = useId();
  const inputId = props.id || autoId;
  const errorId = `${inputId}-error`;
  const {
    inputProps: suppliedInputProps = {},
    "aria-describedby": suppliedDescription,
    ...inputBaseProps
  } = props;
  const describedBy = [
    suppliedInputProps["aria-describedby"],
    suppliedDescription,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const config = fieldsConfig[field] || fieldsConfig.text;

  const finalLabel = label || config.label;
  const finalPlaceholder = placeholder || config.placeholder;
  const finalType =
    field === "password"
      ? showPassword
        ? "text"
        : "password"
      : type || config.type;

  return (
    <div className={`relative flex flex-col gap-2 ${wrapperClassName}`}>
      {finalLabel && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-text-main/60 dark:text-text-main/90"
        >
          {finalLabel}
          {required && (
            <span aria-hidden="true" className="ml-1 text-red-400">
              *
            </span>
          )}
        </label>
      )}

      <InputBase
        id={inputId}
        name={name}
        type={finalType}
        required={required}
        placeholder={finalPlaceholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        startAdornment={
          config.icon ? (
            <InputAdornment position="start">
              <span className="text-text-muted/45">{config.icon}</span>
            </InputAdornment>
          ) : null
        }
        endAdornment={
          field === "password" ? (
            <InputAdornment position="end">
              <IconButton
                type="button"
                disableRipple
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword ? t.auth.hidePassword : t.auth.showPassword
                }
                aria-pressed={showPassword}
                className="!text-text-muted hover:!text-text-main"
              >
                {showPassword ? (
                  <VisibilityIcon className="!text-[20px]" />
                ) : (
                  <VisibilityOffIcon className="!text-[20px]" />
                )}
              </IconButton>
            </InputAdornment>
          ) : null
        }
        className={`
          !w-full !h-11 !bg-primary/4 !px-3 !py-2.5 !border !rounded-md
          ${error ? "!border-red-400" : "!border-primary/7"}
          focus-within:!ring-2 focus-within:!ring-primary/30 dark:focus-within:!ring-primary/70
          !transition-all !duration-200 !gap-2
          [&_.MuiInputAdornment-positionStart]:!m-0
          [&_.MuiInputAdornment-positionEnd]:!m-0
          ${className}
        `}
        inputProps={{
          ...suppliedInputProps,
          "aria-invalid": error ? "true" : undefined,
          "aria-describedby": describedBy,
          className: `${suppliedInputProps.className || ""} !p-0 !text-sm !text-text-main placeholder:!text-text-muted [&::-webkit-search-cancel-button]:!hidden ${inputPropsClassName}`,
        }}
        {...inputBaseProps}
      />

      <FieldError id={errorId} message={error} />
    </div>
  );
}

export default CustomInput;















