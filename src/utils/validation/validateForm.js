import { regex } from "./regex.js";

const getFieldError = (rules, enteredData, data = {}, messages) => {
  const value = String(enteredData ?? "").trim();

  //* required ??
  if (rules.required && !value) {
    return (messages && rules.requiredMessageKey && messages[rules.requiredMessageKey]) ||
      rules.requiredMessage || "This field is required.";
  }
  if (!rules.required && !value) {
    return "";
  }

  if (rules.match && value !== String(data[rules.match] ?? "").trim()) {
    return (messages && rules.errorMessageKey && messages[rules.errorMessageKey]) ||
      rules.errorMessage || "Values do not match.";
  }

  //* regex ??
  const targetRegex = regex[rules.type];
  const validationValue = rules.type === "password" ? String(enteredData ?? "") : value;
  if (targetRegex && !targetRegex.test(validationValue)) {
    return (messages && rules.errorMessageKey && messages[rules.errorMessageKey]) ||
      rules.errorMessage || "Invalid value.";
  }

  return "";
};

export const validateField = (schema, data = {}, field, messages) => {
  const rules = schema[field];
  if (!rules) return "";
  const fieldValue = data[field];

  if (Array.isArray(fieldValue)) {
    if (rules.required && fieldValue.length === 0) {
      return rules.requiredMessage || "This field is required.";
    }

    for (const el of fieldValue) {
      const error = getFieldError(rules, el, data, messages);
      if (error) return error;
    }

    return "";
  }

  return getFieldError(rules, fieldValue, data, messages);
};

export const validateForm = (schema, data = {}, messages) => {
  let errors = {
    count: 0,
    general: "",
  };

  Object.entries(schema).forEach(([key]) => {
    errors[key] = validateField(schema, data, key, messages);

    if (errors[key]) errors.count++;
  });

  return errors;
};