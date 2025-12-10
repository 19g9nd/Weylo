export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEmail = (email: string): string | null => {
  if (!email) return "Email is required";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid email format";

  return null;
};

export const validatePassword = (
  password: string,
  minLength = 6
): string | null => {
  if (!password) return "Password is required";

  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  }

  // Optional additional checks
  // if (!/(?=.*[a-z])/.test(password)) return 'Password must contain a lowercase letter';
  // if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain an uppercase letter';
  // if (!/(?=.*\d)/.test(password)) return 'Password must contain a number';

  return null;
};

export const validateUsername = (username: string): string | null => {
  if (!username) return "Username is required";

  if (username.length < 3) return "Username must be at least 3 characters long";
  if (username.length > 50) return "Username cannot exceed 50 characters";

  // Allowed characters check
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return "Username can only contain letters, numbers, dashes, and underscores";
  }

  return null;
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword) return "Password confirmation is required";

  if (password !== confirmPassword) return "Passwords do not match";

  return null;
};

// Comprehensive registration form validation
export const validateRegistrationForm = (data: {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const usernameError = validateUsername(data.username);
  if (usernameError) errors.username = usernameError;

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;

  const confirmPasswordError = validateConfirmPassword(
    data.password,
    data.confirmPassword
  );
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Login form validation
export const validateLoginForm = (data: {
  email: string;
  password: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  if (!data.password) errors.password = "Password is required";

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Reset password form validation
export const validateResetPasswordForm = (data: {
  newPassword: string;
  confirmNewPassword: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  const passwordError = validatePassword(data.newPassword);
  if (passwordError) errors.newPassword = passwordError;

  const confirmPasswordError = validateConfirmPassword(
    data.newPassword,
    data.confirmNewPassword
  );
  if (confirmPasswordError) errors.confirmNewPassword = confirmPasswordError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};