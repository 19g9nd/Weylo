"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/ui/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const result = await forgotPassword(email);

    if (result.success) {
      setMessage("Password reset instructions sent to your email");
    } else {
      setMessage(result.error || "Failed to send reset instructions");
    }

    setIsLoading(false);
  };

  return (
    <>
    <Navigation/>
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-main-text mb-6 text-center">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-brown-text"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow focus:border-yellow"
              placeholder="Enter your email"
            />
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded ${
                message.includes("sent")
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
            className="w-full bg-yellow text-white py-2 px-4 rounded-md hover:bg-yellow-dark focus:outline-none focus:ring-2 focus:ring-yellow disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Sending..." : "Send Reset Instructions"}
          </button>
        </form>

        <button
          onClick={() => router.push("/login")}
          className="mt-4 w-full text-brown-text hover:text-main-text text-sm"
        >
          Back to Login
        </button>
      </div>
    </div>
    </>
  );
}
