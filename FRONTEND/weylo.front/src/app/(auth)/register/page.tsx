"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { RegisterDto } from "../../types/auth";
import { validateRegistrationForm } from "../../utils/validation";
import Navigation from "../../components/ui/navigation";

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterDto>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // Add this flag

  const { register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if authenticated AND not currently in registration process
    if (!isLoading && isAuthenticated && !isRegistering) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, isRegistering, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") return setAcceptTerms(checked);

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name] || errors.general) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        delete copy.general;
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateRegistrationForm(formData);
    const newErrors = { ...validation.errors };

    if (!acceptTerms) newErrors.terms = "You must accept terms of service";

    if (!validation.isValid || !acceptTerms) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setIsRegistering(true); // Set registration flag
    setErrors({});
    
    try {
      const response = await register(formData);

      if (response.success) {
        // Navigate to email verification page
        router.push(
          "/verify-email?email=" + encodeURIComponent(formData.email)
        );
      } else {
        setErrors({ general: response.error || "Registration failed" });
        setIsRegistering(false); // Reset flag on error
      }
    } catch {
      setErrors({ general: "Unexpected error occurred" });
      setIsRegistering(false); // Reset flag on error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="registration-container">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="registration-container">
        <div className="registration-form">
          <div className="text-center mb-6">
            <div className="bg-indigo-600 text-white font-bold text-xl px-4 py-2 inline-block rounded-lg mb-4">
              Weylo
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{" "}
              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                sign in to your account
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-red-50 p-3 text-sm text-red-700 rounded-md">
                {errors.general}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`form-input ${
                  errors.email ? "form-input-error" : ""
                }`}
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                className={`form-input ${
                  errors.username ? "form-input-error" : ""
                }`}
              />
              {errors.username && (
                <p className="error-message">{errors.username}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="password-container">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
                  className={`form-input ${
                    errors.password ? "form-input-error" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="password-toggle"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="error-message">{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <div className="password-container">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className={`form-input ${
                    errors.confirmPassword ? "form-input-error" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="password-toggle"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="error-message">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="checkbox-container">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={handleChange}
                className="checkbox-input"
              />
              <label
                htmlFor="acceptTerms"
                className="text-sm font-medium text-gray-700"
              >
                I agree to the terms of service
              </label>
            </div>
            {errors.terms && <p className="error-message">{errors.terms}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? "Registering..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}