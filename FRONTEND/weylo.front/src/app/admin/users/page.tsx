"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "../../types/shared";
import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";
import Navigation from "../../components/ui/navigation";

export default function UsersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { getUsers, deleteUser, changeUserRole } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (
      !isLoading &&
      (!isAuthenticated ||
        (user?.role !== "Admin" && user?.role !== "SuperAdmin"))
    ) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (
      isAuthenticated &&
      (user?.role === "Admin" || user?.role === "SuperAdmin")
    ) {
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();

      if (response.success) {
        setUsers(response.data || []);
      } else {
        setError(response.error || "Failed to fetch users");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

    try {
      const response = await deleteUser(userId);

      if (response.success) {
        setSuccess("User deleted successfully");
        setUsers(users.filter((u) => u.id !== userId));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to delete user");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      const response = await changeUserRole(userId, newRole);

      if (response.success) {
        setSuccess("User role updated successfully");
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to update user role");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-main-text">
                User Management
              </h1>
              <p className="text-brown-text mt-2">
                Manage all system users and their permissions
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="bg-yellow hover:bg-yellow/90 text-main-text px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
              <button onClick={() => setError("")} className="float-right">
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              {success}
              <button onClick={() => setSuccess("")} className="float-right">
                ×
              </button>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-brown-text">
                No users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <tr key={userItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-main-text">
                                {userItem.username}
                              </div>
                              <div className="text-sm text-brown-text">
                                {userItem.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={userItem.role}
                            onChange={(e) =>
                              handleChangeRole(userItem.id, e.target.value)
                            }
                            disabled={
                              userItem.id === user?.id ||
                              userItem.role === "SuperAdmin"
                            }
                            className="text-sm text-main-text bg-gray-100 rounded px-2 py-1 disabled:opacity-50"
                          >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                            <option value="SuperAdmin">SuperAdmin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userItem.isEmailVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {userItem.isEmailVerified
                              ? "Verified"
                              : "Unverified"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brown-text">
                          {formatDate(userItem.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() =>
                              handleDeleteUser(userItem.id, userItem.username)
                            }
                            disabled={
                              userItem.id === user?.id ||
                              userItem.role === "SuperAdmin"
                            }
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
