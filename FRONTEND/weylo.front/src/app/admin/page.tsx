"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/ui/navigation";

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (
      !isAuthenticated ||
      (user?.role !== "Admin" && user?.role !== "SuperAdmin")
    ) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow"></div>
      </div>
    );
  }

  if (
    !isAuthenticated ||
    (user?.role !== "Admin" && user?.role !== "SuperAdmin")
  ) {
    return null;
  }

  const adminCards = [
    {
      href: "/admin/users",
      title: "User Management",
      description: "Manage users, roles and permissions",
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      ),
      bgColor: "bg-blue-100",
    },
    {
      href: "/admin/countries",
      title: "Countries",
      description: "Manage supported countries and geographical bounds",
      icon: (
        <svg
          className="w-8 h-8 text-purple-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z"
            clipRule="evenodd"
          />
        </svg>
      ),
      bgColor: "bg-purple-100",
    },
    {
      href: "/admin/cities",
      title: "Cities Management",
      description: "Manage cities, locations and points of interest",
      icon: (
        <svg
          className="w-8 h-8 text-indigo-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      bgColor: "bg-indigo-100",
    },
    {
      href: "/admin/categories",
      title: "Place Categories",
      description: "Manage place categories and types",
      icon: (
        <svg
          className="w-8 h-8 text-teal-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
      bgColor: "bg-teal-100",
    },
    {
      href: "/admin/places",
      title: "Place Management",
      description: "Manage all places and their details",
      icon: (
        <svg
          className="w-8 h-8 text-green-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
      bgColor: "bg-green-100",
    },
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-main-text mb-8">
            Admin Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminCards.map((card, index) => (
              <Link
                key={index}
                href={card.href}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow block"
              >
                <div className="text-center">
                  <div
                    className={`${card.bgColor} p-3 rounded-full inline-block mb-4`}
                  >
                    {card.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-main-text mb-2">
                    {card.title}
                  </h2>
                  <p className="text-brown-text">{card.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}