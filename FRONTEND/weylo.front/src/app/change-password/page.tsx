"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/ui/navigation";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const { user, changePassword } = useAuth();
  const router = useRouter();

  // Handle authentication check in useEffect (client-side only)
  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      setIsChecking(false);
    }
  }, [user, router]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation
    if (newPassword !== confirmNewPassword) {
      setMessage("New passwords do not match");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setMessage(passwordError);
      return;
    }

    if (currentPassword === newPassword) {
      setMessage("New password must be different from current password");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword: newPassword,
      });

      if (result.success) {
        setMessage("Password changed successfully!");
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");

        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setMessage(result.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Change password error:", error);
      setMessage("An unexpected error occurred. Please try again.");
    }

    setIsLoading(false);
  };

  // Show loading state while checking authentication
  if (isChecking || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-main-text">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-main-text mb-6 text-center">
            Change Password
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-brown-text">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow focus:border-yellow"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-brown-text">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow focus:border-yellow"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-brown-text">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow focus:border-yellow"
                disabled={isLoading}
              />
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded ${
                  message.includes("successfully")
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow text-white py-2 px-4 rounded-md hover:bg-yellow-dark focus:outline-none focus:ring-2 focus:ring-yellow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Changing..." : "Change Password"}
            </button>
          </form>

          <button
            onClick={() => router.back()}
            className="mt-4 w-full text-brown-text hover:text-main-text text-sm disabled:opacity-50"
            disabled={isLoading}
          >
            Back to Settings
          </button>
        </div>
      </div>
    </>
  );
}