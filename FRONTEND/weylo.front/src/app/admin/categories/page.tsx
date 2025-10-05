"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../context/CategoriesContext";
import Navigation from "../../components/ui/navigation";
import { Category, CategoryDto } from "../../types/category";

export default function CategoriesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { getCategories, createCategory, updateCategory, deleteCategory } =
    useCategories();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [newCategory, setNewCategory] = useState<CategoryDto>({
    name: "",
    description: null,
    icon: null,
    googleTypes: null,
  });

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
      fetchCategories();
    }
  }, [isAuthenticated, user]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories();

      if (response.success) {
        setCategories(response.data || []);
      } else {
        setError(response.error || "Failed to fetch categories");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      setError("Please enter a category name");
      return;
    }

    try {
      // Ensure we send proper null values instead of empty strings
      const categoryData: CategoryDto = {
        name: newCategory.name.trim(),
        description: newCategory.description?.trim() || null,
        icon: newCategory.icon?.trim() || null,
        googleTypes: newCategory.googleTypes?.trim() || null,
      };

      const response = await createCategory(categoryData);

      if (response.success) {
        setSuccess(`Category "${newCategory.name}" created successfully`);
        resetForm();
        setShowAddForm(false);
        fetchCategories();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(response.error || "Failed to create category");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategory.name.trim()) {
      setError("Please enter a category name");
      return;
    }

    try {
      // Ensure we send proper null values instead of empty strings
      const categoryData: CategoryDto = {
        name: newCategory.name.trim(),
        description: newCategory.description?.trim() || null,
        icon: newCategory.icon?.trim() || null,
        googleTypes: newCategory.googleTypes?.trim() || null,
      };

      const response = await updateCategory(editingCategory.id, categoryData);

      if (response.success) {
        setSuccess(`Category "${newCategory.name}" updated successfully`);
        resetForm();
        setEditingCategory(null);
        fetchCategories();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(response.error || "Failed to update category");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (
      !confirm(
        `Are you sure you want to delete category "${category.name}"? This action cannot be undone.`
      )
    )
      return;

    try {
      const response = await deleteCategory(category.id);

      if (response.success) {
        setSuccess(`Category "${category.name}" deleted successfully`);
        setCategories(categories.filter((c) => c.id !== category.id));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to delete category");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      googleTypes: category.googleTypes || "",
    });
  };

  const resetForm = () => {
    setNewCategory({
      name: "",
      description: null,
      icon: null,
      googleTypes: null,
    });
    setEditingCategory(null);
  };

  const formatGoogleTypes = (
    googleTypes: string | null | undefined
  ): string => {
    if (!googleTypes) return "Not set";
    return googleTypes
      .split(",")
      .map((type) => type.trim())
      .join(", ");
  };

  // Helper function to safely get input values
  const getInputValue = (value: string | null | undefined): string => {
    return value || "";
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
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-main-text">
                Categories Management
              </h1>
              <p className="text-brown-text mt-1 sm:mt-2 text-sm sm:text-base">
                Manage place categories and Google Places types mapping
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(true);
                }}
                className="flex-1 sm:flex-none bg-yellow hover:bg-yellow/90 text-main-text px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Add Category
              </button>
              <button
                onClick={fetchCategories}
                className="flex-1 sm:flex-none bg-gray-200 hover:bg-gray-300 text-main-text px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 sm:mb-6 text-sm">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={() => setError("")}
                  className="text-lg font-bold hover:text-red-900 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 sm:mb-6 text-sm">
              <div className="flex justify-between items-center">
                <span>{success}</span>
                <button
                  onClick={() => setSuccess("")}
                  className="text-lg font-bold hover:text-green-900 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Add/Edit Category Form */}
          {(showAddForm || editingCategory) && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-main-text mb-3 sm:mb-4">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brown-text mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      placeholder="Enter category name (e.g., Museums, Restaurants)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brown-text mb-1">
                      Icon
                    </label>
                    <input
                      type="text"
                      value={getInputValue(newCategory.icon)}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, icon: e.target.value })
                      }
                      placeholder="Icon name or URL"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-text mb-1">
                    Description
                  </label>
                  <textarea
                    value={getInputValue(newCategory.description)}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter category description"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-text mb-1">
                    Google Places Types
                  </label>
                  <input
                    type="text"
                    value={getInputValue(newCategory.googleTypes)}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        googleTypes: e.target.value,
                      })
                    }
                    placeholder="museum,tourist_attraction (comma-separated)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow text-sm"
                  />
                  <p className="text-xs text-brown-text mt-1">
                    Enter Google Places API types separated by commas. Example:
                    museum,art_gallery,tourist_attraction
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={
                      editingCategory
                        ? handleUpdateCategory
                        : handleCreateCategory
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    {editingCategory ? "Update Category" : "Create Category"}
                  </button>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-main-text px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Categories Table/Cards */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12 text-brown-text text-sm sm:text-base px-4">
                No categories found. Add your first category to get started.
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                          Google Types
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
                      {categories.map((category) => (
                        <tr key={category.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {category.icon && (
                                <span className="mr-3 text-lg">
                                  {category.icon}
                                </span>
                              )}
                              <div>
                                <div className="text-sm font-medium text-main-text">
                                  {category.name}
                                </div>
                                {category.icon && (
                                  <div className="text-xs text-brown-text">
                                    {category.icon}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-brown-text max-w-xs">
                              {category.description || "No description"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className="text-sm text-brown-text max-w-xs font-mono bg-gray-50 p-2 rounded"
                              title={category.googleTypes || ""}
                            >
                              {formatGoogleTypes(category.googleTypes)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-brown-text">
                              {new Date(
                                category.createdAt
                              ).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => startEdit(category)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Edit category"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete category"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4 p-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            {category.icon && (
                              <span className="mr-2 text-lg">
                                {category.icon}
                              </span>
                            )}
                            <h3 className="font-semibold text-main-text text-lg">
                              {category.name}
                            </h3>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-brown-text font-medium">
                              Description:
                            </span>
                            <div className="text-main-text mt-1">
                              {category.description || "No description"}
                            </div>
                          </div>

                          <div>
                            <span className="text-brown-text font-medium">
                              Google Types:
                            </span>
                            <div className="text-main-text font-mono text-xs mt-1 bg-gray-50 p-2 rounded">
                              {formatGoogleTypes(category.googleTypes)}
                            </div>
                          </div>

                          <div>
                            <span className="text-brown-text font-medium">
                              Created:
                            </span>
                            <div className="text-main-text">
                              {new Date(
                                category.createdAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => startEdit(category)}
                            className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 px-3 rounded-md font-medium transition-colors text-sm border border-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 px-3 rounded-md font-medium transition-colors text-sm border border-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Statistics */}
          {!loading && categories.length > 0 && (
            <div className="mt-4 sm:mt-6 text-sm text-brown-text text-center sm:text-left">
              Total categories: <strong>{categories.length}</strong>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
