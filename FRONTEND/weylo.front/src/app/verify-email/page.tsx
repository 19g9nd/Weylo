"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const { verifyEmail, resendVerificationEmail, user, isAuthenticated } =
    useAuth();

  useEffect(() => {
    if (token) {
      verifyEmailToken(token);
    } else if (email) {
      setStatus("idle");
      setMessage(
        `We've sent a verification email to ${email}. Please check your inbox and click the verification link.`
      );
    }
  }, [token, email]);

  const verifyEmailToken = async (verificationToken: string) => {
    setStatus("verifying");
    try {
      const response = await verifyEmail(verificationToken);
      if (response.success) {
        setStatus("success");
        setMessage(
          "Email verified successfully! You can now access all features."
        );
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(
          response.error ||
            "Verification failed. The link may be invalid or expired."
        );
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred during verification. Please try again.");
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      const response = await resendVerificationEmail(email);
      if (response.success) {
        setStatus("success");
        setMessage(
          "Verification email sent! Please check your inbox for the new verification link."
        );
      } else {
        setStatus("error");
        setMessage(
          response.error ||
            "Failed to resend verification email. Please try again later."
        );
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        "Failed to resend verification email. Please check your connection and try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleContinueToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="bg-indigo-600 text-white font-bold text-xl px-4 py-2 inline-block rounded-lg mb-4">
            Weylo
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
          {email && (
            <p className="mt-2 text-sm text-gray-600">Sent to: {email}</p>
          )}
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status === "verifying" && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-green-600 mb-6">{message}</p>

              {token ? (
                // If we just verified via token, show redirect message
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Redirecting to dashboard in 3 seconds...
                  </p>
                  <button
                    onClick={handleContinueToDashboard}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Continue to Dashboard
                  </button>
                </div>
              ) : isAuthenticated ? (
                // If user is logged in but we just sent a new verification email
                <div className="space-y-4">
                  <button
                    onClick={handleContinueToDashboard}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Continue to Dashboard
                  </button>
                  <p className="text-sm text-gray-600">
                    You can continue using the app while your email is being
                    verified.
                  </p>
                </div>
              ) : (
                // If user is not logged in, show login link
                <Link
                  href="/login"
                  className="inline-block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Go to Login
                </Link>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-red-600 mb-6">{message}</p>

              <div className="space-y-4">
                {email && (
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isResending ? "Sending..." : "Resend Verification Email"}
                  </button>
                )}

                {isAuthenticated ? (
                  <button
                    onClick={handleContinueToDashboard}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Continue to Dashboard
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="block w-full text-center px-4 py-2 text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                  >
                    Back to Login
                  </Link>
                )}
              </div>
            </div>
          )}

          {status === "idle" && !token && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <p className="text-gray-600 mb-6">{message}</p>

              <div className="space-y-4">
                {email && (
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isResending ? "Sending..." : "Resend Verification Email"}
                  </button>
                )}

                {isAuthenticated ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleContinueToDashboard}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Continue to Dashboard
                    </button>
                    <p className="text-sm text-gray-600">
                      You can use the app while your email is being verified.
                    </p>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="block w-full text-center px-4 py-2 text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                  >
                    Back to Login
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
