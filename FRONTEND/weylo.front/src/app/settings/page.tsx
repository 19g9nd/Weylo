"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/ui/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-main-text">Settings</h1>
            <p className="text-brown-text mt-2">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Account Information */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-main-text mb-4">
              Account Information
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <label className="text-sm font-medium text-brown-text">Email</label>
                  <p className="text-main-text">{user?.email || "Not available"}</p>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <label className="text-sm font-medium text-brown-text">Username</label>
                  <p className="text-main-text">{user?.username || "Not available"}</p>
                </div>
                <button
                  onClick={() => router.push("/change-username")}
                  className="text-yellow hover:text-yellow-dark font-medium text-sm"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-main-text mb-4">
              Security & Authentication
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0">
                <div>
                  <h3 className="font-medium text-main-text">Password</h3>
                  <p className="text-sm text-brown-text">
                    Change your password to keep your account secure
                  </p>
                </div>
                <button
                  onClick={() => router.push("/change-password")}
                  className="bg-yellow text-white px-4 py-2 rounded-md hover:bg-yellow-dark transition-colors font-medium"
                >
                  Change Password
                </button>
              </div>
              
              <div className="flex justify-between items-center py-4">
                <div>
                  <h3 className="font-medium text-main-text">Email Verification</h3>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-brown-text">Status: </span>
                    <span className={`text-sm font-medium ml-1 ${
                      user?.isEmailVerified 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`}>
                      {user?.isEmailVerified ? "Verified" : "Not Verified"}
                    </span>
                  </div>
                </div>
                {!user?.isEmailVerified && (
                  <button
                    onClick={() => {
                      // Add resend verification logic here
                      console.log("Resend verification email");
                    }}
                    className="text-yellow hover:text-yellow-dark font-medium text-sm"
                  >
                    Resend Email
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-main-text mb-4">
              Account Actions
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-medium text-main-text">Sign Out</h3>
                  <p className="text-sm text-brown-text">
                    Sign out of your account on this device
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors font-medium"
                >
                  Sign Out
                </button>
              </div>
              
              <div className="flex justify-between items-center py-4">
                <div>
                  <h3 className="font-medium text-red-600">Delete Account</h3>
                  <p className="text-sm text-brown-text">
                    Permanently delete your account and all data
                  </p>
                </div>
                <button
                  onClick={() => {
                    //TODO: Add delete account 
                    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                      console.log("Delete account");
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-brown-text hover:text-main-text transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}