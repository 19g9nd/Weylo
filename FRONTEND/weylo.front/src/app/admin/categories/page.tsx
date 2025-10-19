"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../context/CategoriesContext";
import Navigation from "../../components/ui/navigation";
import { Category, CategoryDto } from "../../types/category";

// Компонент иконок
const CategoryIcon = ({ name }: { name: string | null }) => {
  const icons: { [key: string]: string } = {
    ticket: "🎫",
    "map-pin": "📍",
    monument: "🏛️",
    bed: "🛏️",
    landmark: "🏛️",
    tree: "🌳",
    utensils: "🍽️",
    "shopping-bag": "🛍️",
    camera: "📸",
  };

  const iconName = name || "map-pin";
  return <span className="text-2xl">{icons[iconName] || "📁"}</span>;
};

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
  ): string[] => {
    if (!googleTypes) return [];
    return googleTypes.split(",").map((type) => type.trim());
  };

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-main-text">
                🗂️ Categories Management
              </h1>
              <p className="text-brown-text mt-2 text-sm sm:text-base">
                Manage place categories and Google Places types mapping
              </p>
            </div>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(true);
                }}
                className="bg-yellow hover:bg-yellow/90 text-main-text font-bold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>➕</span>
                Add New Category
              </button>
              <button
                onClick={fetchCategories}
                className="bg-gray-200 hover:bg-gray-300 text-main-text font-bold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>🔄</span>
                Refresh
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span>⚠️</span>
                  {error}
                </span>
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
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span>✅</span>
                  {success}
                </span>
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
            <div className="bg-white rounded-xl border border-yellow/20 shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-main-text mb-6 flex items-center gap-2">
                <span>🎯</span>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-brown-text mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      placeholder="Museums & Culture"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brown-text mb-2">
                      Icon
                    </label>
                    <select
                      value={getInputValue(newCategory.icon)}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, icon: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow"
                    >
                      <option value="">Select icon...</option>
                      <option value="ticket">🎫 Entertainment</option>
                      <option value="map-pin">📍 General</option>
                      <option value="monument">🏛️ Historical</option>
                      <option value="bed">🛏️ Hotels</option>
                      <option value="landmark">🏛️ Museums</option>
                      <option value="tree">🌳 Nature</option>
                      <option value="utensils">🍽️ Restaurants</option>
                      <option value="shopping-bag">🛍️ Shopping</option>
                      <option value="camera">📸 Tourist</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-text mb-2">
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
                    placeholder="Describe what this category includes..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-text mb-2">
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
                    placeholder="museum,art_gallery,tourist_attraction"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow"
                  />
                  <p className="text-xs text-brown-text mt-2">
                    Enter Google Places API types separated by commas. These
                    will be used to automatically categorize places.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={
                      editingCategory
                        ? handleUpdateCategory
                        : handleCreateCategory
                    }
                    className="flex-1 bg-yellow hover:bg-yellow/90 text-main-text font-bold py-3 rounded-lg transition-colors"
                  >
                    {editingCategory ? "Update Category" : "Create Category"}
                  </button>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-main-text font-bold py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Categories Grid */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-main-text">
                📋 All Categories ({categories.length})
              </h2>
              {categories.length > 0 && (
                <span className="text-brown-text text-sm">
                  Click on a category to edit
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">🗂️</div>
                <h3 className="text-xl font-semibold text-main-text mb-2">
                  No Categories Yet
                </h3>
                <p className="text-brown-text mb-6">
                  Create your first category to start organizing places
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-yellow hover:bg-yellow/90 text-main-text font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  Create First Category
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-yellow/50"
                    onClick={() => startEdit(category)}
                  >
                    {/* Header with Icon */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-yellow/20 p-3 rounded-xl">
                        <CategoryIcon name={category.icon ?? null} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-main-text truncate">
                          {category.name}
                        </h3>
                        <p className="text-brown-text text-sm truncate">
                          {category.description || "No description"}
                        </p>
                      </div>
                    </div>

                    {/* Google Types */}
                    <div className="mb-4">
                      <span className="text-xs font-medium text-brown-text uppercase tracking-wide block mb-2">
                        Google Types
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {formatGoogleTypes(category.googleTypes).map(
                          (type, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-main-text px-2 py-1 rounded text-xs font-medium"
                            >
                              {type}
                            </span>
                          )
                        )}
                        {formatGoogleTypes(category.googleTypes).length ===
                          0 && (
                          <span className="text-gray-400 text-xs">
                            Not configured
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-brown-text text-xs">
                        Created:{" "}
                        {new Date(category.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(category);
                          }}
                          className="bg-yellow hover:bg-yellow/90 text-main-text px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category);
                          }}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {!loading && categories.length > 0 && (
            <div className="bg-yellow/10 rounded-xl p-6 border border-yellow/20">
              <h3 className="font-bold text-main-text mb-3">📊 Quick Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-main-text">
                    {categories.length}
                  </div>
                  <div className="text-brown-text text-sm">
                    Total Categories
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-main-text">
                    {categories.filter((c) => c.googleTypes).length}
                  </div>
                  <div className="text-brown-text text-sm">
                    With Google Types
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-main-text">
                    {categories.filter((c) => c.description).length}
                  </div>
                  <div className="text-brown-text text-sm">
                    With Description
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-main-text">
                    {categories.filter((c) => c.icon).length}
                  </div>
                  <div className="text-brown-text text-sm">With Icons</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
