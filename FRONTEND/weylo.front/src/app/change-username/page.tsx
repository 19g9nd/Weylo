"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/ui/navigation";

export default function ChangeUsernamePage() {
  const [newUsername, setNewUsername] = useState("");
  const [confirmNewUsername, setConfirmNewUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { user, changeUsername } = useAuth();
  const router = useRouter();

  const validateUsername = (username: string): string | null => {
    if (username.length < 6) {
      return "Username must be at least 6 characters long";
    }
    if (username.length > 20) {
      return "Username must be no more than 20 characters long";
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return "Username can only contain letters, numbers, dots, hyphens, and underscores";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation
    if (newUsername !== confirmNewUsername) {
      setMessage("Usernames do not match");
      return;
    }

    const usernameError = validateUsername(newUsername);
    if (usernameError) {
      setMessage(usernameError);
      return;
    }

    if (user?.username === newUsername.trim()) {
      setMessage("New username must be different from current username");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const result = await changeUsername(newUsername.trim());

      if (result.success) {
        setMessage("Username changed successfully!");
        // Clear form
        setNewUsername("");
        setConfirmNewUsername("");

        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setMessage(result.error || "Failed to change username");
      }
    } catch (error) {
      console.error("Change username error:", error);
      setMessage("An unexpected error occurred. Please try again.");
    }

    setIsLoading(false);
  };

  // Redirect if not authenticated
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-main-text mb-6 text-center">
            Change Username
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-brown-text">
                Current Username
              </label>
              <input
                type="text"
                value={user?.username || ""}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-brown-text">
                New Username
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow focus:border-yellow"
                disabled={isLoading}
                placeholder="Enter new username"
              />
              <p className="text-xs text-gray-500 mt-1">
                6-20 characters. Letters, numbers, dots, hyphens, and
                underscores only
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-brown-text">
                Confirm New Username
              </label>
              <input
                type="text"
                value={confirmNewUsername}
                onChange={(e) => setConfirmNewUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow focus:border-yellow"
                disabled={isLoading}
                placeholder="Confirm new username"
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
              disabled={
                isLoading || !newUsername.trim() || !confirmNewUsername.trim()
              }
              className="w-full bg-yellow text-white py-2 px-4 rounded-md hover:bg-yellow-dark focus:outline-none focus:ring-2 focus:ring-yellow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Changing..." : "Change Username"}
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
