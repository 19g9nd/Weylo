"use client";

import { useRouter } from "next/navigation";
import Navigation from "../components/ui/navigation";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold text-main-text mb-6">Settings</h1>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-main-text mb-4">
              Security
            </h2>

            <button
              onClick={() => router.push("/change-password")}
              className="bg-yellow text-white px-4 py-2 rounded-md hover:bg-yellow-dark transition-colors"
            >
              Change Password
            </button>

            <p className="text-sm text-brown-text mt-2">
              You will receive an email with password reset instructions
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
