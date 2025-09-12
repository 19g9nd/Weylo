"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/ui/navigation";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, resendVerificationEmail } =
    useAuth();
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResendingEmail(true);
    setVerificationMessage("");

    try {
      const response = await resendVerificationEmail(user.email);
      if (response.success) {
        setVerificationMessage("Verification email sent! Check your inbox.");
      } else {
        setVerificationMessage(
          response.error || "Failed to send verification email."
        );
      }
    } catch (error) {
      setVerificationMessage(
        "Failed to send verification email. Please try again."
      );
    } finally {
      setIsResendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect via useEffect
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />
      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Email Verification Banner */}
          {!user.isEmailVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Email verification required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Please verify your email address to access all features.
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleResendVerification}
                      disabled={isResendingEmail}
                      className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isResendingEmail
                        ? "Sending..."
                        : "Resend verification email"}
                    </button>
                  </div>
                  {verificationMessage && (
                    <div className="mt-2">
                      <p
                        className={`text-sm ${
                          verificationMessage.includes("sent")
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {verificationMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Content */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-main-text">Dashboard</h1>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.isEmailVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user.isEmailVerified ? "Verified" : "Unverified"}
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="bg-gray-50 px-4 py-5 sm:p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-main-text mb-4">
                    Profile Information
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-brown-text">
                        User ID
                      </dt>
                      <dd className="text-sm text-main-text font-mono">
                        {user.id}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-brown-text">
                        Username
                      </dt>
                      <dd className="text-sm text-main-text">
                        {user.username}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-brown-text">
                        Email
                      </dt>
                      <dd className="text-sm text-main-text">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-brown-text">
                        Email Status
                      </dt>
                      <dd className="text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isEmailVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isEmailVerified ? "Verified" : "Not Verified"}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 px-4 py-5 sm:p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-main-text mb-4">
                    Account Details
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-brown-text">
                        Member since
                      </dt>
                      <dd className="text-sm text-main-text">
                        {formatDate(user.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-brown-text">
                        Account Status
                      </dt>
                      <dd className="text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-main-text mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <button
                    onClick={() => router.push("/settings")}
                    className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-yellow focus:outline-none focus:ring-2 focus:ring-yellow transition-colors"
                  >
                    <svg
                      className="mx-auto h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="mt-2 block text-sm font-medium text-main-text">
                      Edit Profile
                    </span>
                    <span className="mt-1 block text-xs text-brown-text">
                      Update your information
                    </span>
                  </button>

                  <button
                    onClick={() => router.push("/settings")}
                    className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-yellow focus:outline-none focus:ring-2 focus:ring-yellow transition-colors"
                  >
                    <svg
                      className="mx-auto h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="mt-2 block text-sm font-medium text-main-text">
                      Settings
                    </span>
                    <span className="mt-1 block text-xs text-brown-text">
                      Manage preferences
                    </span>
                  </button>

                  <button
                    onClick={() => router.push("/contact")}
                    className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-yellow focus:outline-none focus:ring-2 focus:ring-yellow transition-colors"
                  >
                    <svg
                      className="mx-auto h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="mt-2 block text-sm font-medium text-main-text">
                      Help
                    </span>
                    <span className="mt-1 block text-xs text-brown-text">
                      Get support
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
