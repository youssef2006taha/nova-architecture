//* Auth ==========

export const loginSchema = {
  email: {
    required: true,
    type: "email",
    requiredMessage: "Email is required.",
    errorMessage: "Please enter a valid email address.",
    requiredMessageKey: "requiredEmail",
    errorMessageKey: "invalidEmail",
  },
  password: {
    required: true,
    // type: "password",
    requiredMessage: "Password is required.",
    requiredMessageKey: "requiredPassword",
    // errorMessage: "Password must be at least 6 characters without spaces.",
  },
};

export const registerSchema = {
  fullName: {
    required: true,
    type: "name",
    requiredMessage: "Full name is required.",
    errorMessage: "Please enter a valid full name.",
    requiredMessageKey: "requiredName",
    errorMessageKey: "invalidName",
  },
  email: {
    required: true,
    type: "email",
    requiredMessage: "Email is required.",
    errorMessage: "Please enter a valid email address.",
    requiredMessageKey: "requiredEmail",
    errorMessageKey: "invalidEmail",
  },
  password: {
    required: true,
    type: "password",
    requiredMessage: "Password is required.",
    errorMessage: "Password must be at least 6 characters without spaces.",
    requiredMessageKey: "requiredPassword",
    errorMessageKey: "invalidPassword",
  },
};

export const sendOtpSchema = {
  email: {
    required: true,
    type: "email",
    requiredMessage: "Email is required.",
    errorMessage: "Please enter a valid email address.",
    requiredMessageKey: "requiredEmail",
    errorMessageKey: "invalidEmail",
  },
};

export const resetPasswordSchema = {
  otpCode: {
    required: true,
    type: "otp",
    requiredMessage: "OTP is required.",
    errorMessage: "OTP must be 6 digits.",
    requiredMessageKey: "requiredOtp",
    errorMessageKey: "invalidOtp",
  },
  newPassword: {
    required: true,
    type: "password",
    requiredMessage: "Password is required.",
    errorMessage: "Password must be at least 6 characters without spaces.",
    requiredMessageKey: "requiredPassword",
    errorMessageKey: "invalidPassword",
  },
  confirmPassword: {
    required: true,
    type: "password",
    match: "newPassword",
    requiredMessage: "Please confirm your password.",
    errorMessage: "Passwords do not match.",
    requiredMessageKey: "requiredConfirmPassword",
    errorMessageKey: "passwordsMatch",
  },
};

export const checkoutSchema = {
  fullName: {
    required: true,
    type: "name",
    requiredMessage: "Full name is required.",
    errorMessage: "Full name must be at least 3 characters.",
  },
  email: {
    required: true,
    type: "email",
    requiredMessage: "Email is required.",
    errorMessage: "Please enter a valid email address.",
  },
  phone: {
    required: true,
    type: "phone",
    requiredMessage: "Phone number is required.",
    errorMessage: "Please enter a valid phone number.",
  },
};

//* Users ==========

export const createUserSchema = {
  username: {
    required: true,
    type: "username",
    requiredMessage: "Username is required.",
    errorMessage: "Please enter a valid username.",
  },
  email: {
    required: true,
    type: "email",
    requiredMessage: "Email is required.",
    errorMessage: "Please enter a valid email address.",
  },
  password: {
    required: true,
    type: "password",
    requiredMessage: "Password is required.",
    errorMessage: "Password must be at least 6 characters without spaces.",
  },
  phone: {
    required: false,
    type: "phone",
    errorMessage: "Please enter a valid phone number.",
  },
};

export const editUserSchema = {
  username: {
    required: true,
    type: "username",
    requiredMessage: "Username is required.",
    errorMessage: "Please enter a valid username.",
  },
  phone: {
    required: false,
    type: "phone",
    errorMessage: "Please enter a valid phone number.",
  },
  avatar: {
    required: false,
  },
};

//* Products ==========

export const createProductSchema = {
  name: {
    required: true,
    type: "name",
    requiredMessage: "Product name is required.",
    errorMessage: "Please enter a valid product name (3 to 100 characters).",
  },
  shortDescription: {
    required: true,
    type: "shortDescription",
    requiredMessage: "Short description is required.",
    errorMessage: "Short description must be between 10 and 200 characters.",
  },
  description: {
    required: true,
    type: "description",
    requiredMessage: "Description is required.",
    errorMessage: "Description must be between 20 and 5000 characters.",
  },
  price: {
    required: true,
    type: "price",
    requiredMessage: "Price is required.",
    errorMessage: "Please enter a valid price.",
  },
  discountPrice: {
    required: false,
    type: "discountPrice",
    errorMessage: "Please enter a valid discount price.",
  },
  stock: {
    required: true,
    type: "stock",
    requiredMessage: "Stock quantity is required.",
    errorMessage: "Please enter a valid stock number.",
  },
  sku: {
    required: false,
    type: "sku",
    errorMessage: "SKU must be 3 to 50 alphanumeric characters.",
  },
  category: {
    required: true,
    type: "category",
    requiredMessage: "Please select a category.",
    errorMessage: "Invalid category selection.",
  },
  subcategory: {
    required: false,
    type: "subcategory",
    errorMessage: "Invalid subcategory selection.",
  },
  brand: {
    required: false,
    type: "brand",
    errorMessage: "Invalid brand name.",
  },
  tags: {
    required: false,
  },
  tag: {
    required: false,
    type: "tag",
    errorMessage: "Invalid tag.",
  },
  featured: {
    required: false,
  },
  isActive: {
    required: false,
  }
};