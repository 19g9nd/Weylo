"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function Navigation() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-blue-600">Weylo</span>
        </div>
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      {/* Logo */}
      <div className="flex items-center">
        <span
          className="text-2xl font-bold text-blue-600 cursor-pointer"
          onClick={() => router.push("/")}
        >
          Weylo
        </span>
      </div>

      {/* Menu Links */}
      <div className="hidden md:flex space-x-8">
        <span
          className="text-main-text cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => router.push("/map")}
        >
          Destinations
        </span>
        <span
          className="text-main-text cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => router.push("/")}
        >
          Experiences
        </span>
        {isAuthenticated && (
          <span
            className="text-main-text cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </span>
        )}
        <span
          className="text-main-text cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => router.push("/about")}
        >
          About
        </span>
        <span
          className="text-main-text cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => router.push("/contact")}
        >
          Contact
        </span>
      </div>

      {/* Auth Buttons or User Info */}
      <div className="flex items-center space-x-4">
        {isAuthenticated && user ? (
          <>
            <span className="text-main-text text-sm hidden md:block">
              Welcome, {user.username}!
            </span>
            <button
              onClick={handleLogout}
              className="bg-yellow hover:bg-yellow/90 text-main-text px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push("/login")}
              className="text-main-text hover:text-blue-600 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/register")}
              className="bg-yellow hover:bg-yellow/90 text-main-text px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
