"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import YellowButton from "./yellowButton";

export default function Navigation() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { label: "Destinations", path: "/map", icon: "📍" },
    ...(isAuthenticated
      ? [{ label: "Dashboard", path: "/dashboard", icon: "📊" }]
      : []),
    ...(isAuthenticated &&
    (user?.role === "Admin" || user?.role === "SuperAdmin")
      ? [{ label: "Admin", path: "/admin", icon: "⚙️" }]
      : []),
    { label: "About", path: "/about", icon: "ℹ️" },
    { label: "Contact", path: "/contact", icon: "✉️" },
  ];

  if (isLoading) {
    return (
      <nav
        className={`bg-white sticky top-0 z-40 transition-all duration-300 ${
          isScrolled ? "shadow-lg py-3" : "shadow-md py-4"
        } px-6`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-8 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-20 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Main Navigation Bar */}
      <nav
        className={`bg-white sticky top-0 z-40 transition-all duration-300 ${
          isScrolled ? "shadow-lg py-3" : "shadow-md py-4"
        } px-4 sm:px-6 lg:px-8`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <button
              onClick={() => navigateTo("/")}
              className="flex items-center group"
            >
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent cursor-pointer">
                Weylo
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigateTo(item.path)}
                className="cursor-pointer text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
              </button>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border border-gray-300">
                    <span className="text-gray-600 font-medium text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-700 text-sm font-medium">
                    Welcome, {user.username}
                  </span>
                </div>
                <YellowButton className="cursor-pointer" onClick={handleLogout}>Sign Out</YellowButton>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigateTo("/login")}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  Sign In
                </button>
                <YellowButton onClick={() => navigateTo("/register")}>
                  Get Started
                </YellowButton>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span
                  className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${
                    isMobileMenuOpen
                      ? "rotate-45 translate-y-0.5"
                      : "-translate-y-1"
                  }`}
                ></span>
                <span
                  className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${
                    isMobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                ></span>
                <span
                  className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${
                    isMobileMenuOpen
                      ? "-rotate-45 -translate-y-0.5"
                      : "translate-y-1"
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Side Panel */}
        <div
          className={`absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-2xl transform transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <button
              onClick={() => navigateTo("/")}
              className="flex items-center group"
            >
              <span className="text-xl font-bold text-gray-900">Weylo</span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label="Close menu"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* User Info */}
          {isAuthenticated && user && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border border-blue-300">
                  <span className="text-blue-600 font-medium text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-600">Welcome back!</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              <button
                onClick={() => navigateTo("/")}
                className="w-full cursor-pointer flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-blue-50 transition-colors duration-200 group"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <span className="text-lg">🏠</span>
                </div>
                <span className="text-gray-700 font-medium">Home</span>
              </button>

              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigateTo(item.path)}
                  className="w-full flex cursor-pointer items-center space-x-3 p-3 text-left rounded-lg hover:bg-blue-50 transition-colors duration-200 group"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <span className="text-gray-700 font-medium">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </nav>

          {/* Auth Section */}
          <div className="p-6 border-t border-gray-200">
            {isAuthenticated ? (
              <YellowButton fullWidth  className="cursor-pointer" onClick={handleLogout}>
                Sign Out
              </YellowButton>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => navigateTo("/login")}
                  className="w-full text-gray-700 border border-gray-300 hover:border-blue-600 hover:text-blue-600 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Sign In
                </button>
                <YellowButton fullWidth onClick={() => navigateTo("/register")}>
                  Create Account
                </YellowButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
