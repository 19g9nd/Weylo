"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "../../components/ui/navigation";
import { useAuth } from "../../context/AuthContext";
import { placesService } from "../../services/placesService";
import { citiesService } from "../../services/citiesService";
import { categoriesService } from "../../services/categoriesService";
import { BasePlace } from "../../types/place";
import { City } from "../../types/city";
import { Category } from "../../types/category";

interface EditPlaceForm {
  name: string;
  categoryId: number;
  cachedAddress: string;
  cachedDescription: string;
  cachedImageUrl: string;
  cachedRating: number | null;
  cityId: number;
}

export default function PlacesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [places, setPlaces] = useState<BasePlace[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<BasePlace[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<number | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "city">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Statistics
  const [showStats, setShowStats] = useState(false);

  // Edit modal
  const [editingPlace, setEditingPlace] = useState<BasePlace | null>(null);
  const [editForm, setEditForm] = useState<EditPlaceForm>({
    name: "",
    categoryId: 0,
    cachedAddress: "",
    cachedDescription: "",
    cachedImageUrl: "",
    cachedRating: null,
    cityId: 0,
  });

  const router = useRouter();

  // Access control
  useEffect(() => {
    if (
      !isLoading &&
      (!isAuthenticated ||
        (user?.role !== "Admin" && user?.role !== "SuperAdmin"))
    ) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Fetch initial data
  useEffect(() => {
    if (
      isAuthenticated &&
      (user?.role === "Admin" || user?.role === "SuperAdmin")
    ) {
      fetchData();
    }
  }, [isAuthenticated, user]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [places, search, selectedCity, selectedCategory, sortBy, sortDirection]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [placesData, citiesData, categoriesData] = await Promise.all([
        placesService.getCatalogue(),
        citiesService.getCities(),
        categoriesService.getCategories(),
      ]);

      setPlaces(placesData);
      if (citiesData.success) setCities(citiesData.data || []);
      if (categoriesData.success) setCategories(categoriesData.data || []);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...places];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.displayName.toLowerCase().includes(searchLower) ||
          p.formattedAddress?.toLowerCase().includes(searchLower) ||
          p.city?.toLowerCase().includes(searchLower)
      );
    }

    // City filter
    if (selectedCity !== "all") {
      filtered = filtered.filter((p) => p.cityId === selectedCity);
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case "rating":
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case "city":
          comparison = (a.city || "").localeCompare(b.city || "");
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    setFilteredPlaces(filtered);
  };

  const handleEditClick = (place: BasePlace) => {
    setEditingPlace(place);
    setEditForm({
      name: place.displayName,
      categoryId: place.categoryId || 0,
      cachedAddress: place.formattedAddress || "",
      cachedDescription: "", // Not in BasePlace, will be loaded from backend
      cachedImageUrl: place.photos?.[0]?.getURI() || "",
      cachedRating: place.rating || null,
      cityId: place.cityId || 0,
    });
  };

  const handleUpdatePlace = async () => {
    if (!editingPlace) return;

    if (!editForm.name.trim()) {
      setError("Place name is required");
      return;
    }

    try {
      const updateData: any = {};
      
      // Only send changed fields
      if (editForm.name !== editingPlace.displayName) {
        updateData.name = editForm.name;
      }
      
      if (editForm.categoryId !== editingPlace.categoryId) {
        updateData.categoryId = editForm.categoryId;
      }
      
      if (editForm.cachedAddress !== editingPlace.formattedAddress) {
        updateData.cachedAddress = editForm.cachedAddress;
      }
      
      // Always send description and image as they might not be in BasePlace
      if (editForm.cachedDescription) {
        updateData.cachedDescription = editForm.cachedDescription;
      }
      
      if (editForm.cachedImageUrl !== (editingPlace.photos?.[0]?.getURI() || "")) {
        updateData.cachedImageUrl = editForm.cachedImageUrl;
      }

      const response = await placesService.adminUpdatePlace(
        editingPlace.backendId,
        updateData
      );

      if (response.success) {
        setSuccess(`Place "${editForm.name}" updated successfully`);
        setEditingPlace(null);
        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to update place");
      }
    } catch (err) {
      setError("Error updating place");
    }
  };

  const handleDeletePlace = async (backendId: number, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone if the place is used in routes or favourites.`
      )
    )
      return;

    try {
      const deleted = await placesService.deletePlace(backendId);

      if (deleted) {
        setPlaces(places.filter((p) => p.backendId !== backendId));
        setSuccess(`Place "${name}" deleted successfully`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(
          "Cannot delete place. It may be used in routes or favourites."
        );
      }
    } catch (err) {
      setError("Error deleting place");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCity("all");
    setSelectedCategory("all");
    setSortBy("name");
    setSortDirection("asc");
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
                Places Management
              </h1>
              <p className="text-brown-text mt-1 text-sm sm:text-base">
                Manage destinations, categories, and place information
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowStats(!showStats)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                {showStats ? "Hide Stats" : "Show Stats"}
              </button>
              <button
                onClick={fetchData}
                className="bg-gray-200 hover:bg-gray-300 text-main-text px-3 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm flex justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="font-bold text-lg"
              >
                ×
              </button>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm flex justify-between">
              <span>{success}</span>
              <button
                onClick={() => setSuccess("")}
                className="font-bold text-lg"
              >
                ×
              </button>
            </div>
          )}

          {/* Statistics Dashboard */}
          {showStats && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-main-text mb-4">
                Places Statistics
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium">Total Places</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">{places.length}</div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium">With Ratings</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {places.filter(p => p.rating).length}
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm text-yellow-600 font-medium">Average Rating</div>
                  <div className="text-2xl font-bold text-yellow-900 mt-1">
                    {(places.reduce((sum, p) => sum + (p.rating || 0), 0) / 
                      (places.filter(p => p.rating).length || 1)).toFixed(1)} ⭐
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm text-purple-600 font-medium">Cities</div>
                  <div className="text-2xl font-bold text-purple-900 mt-1">
                    {new Set(places.map(p => p.cityId)).size}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-main-text mb-3">Top Categories</h3>
                  <div className="space-y-2">
                    {Object.entries(
                      places.reduce((acc, p) => {
                        const cat = p.category || "Unknown";
                        acc[cat] = (acc[cat] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span className="text-sm text-main-text">{category}</span>
                          <span className="text-sm font-semibold text-brown-text">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-main-text mb-3">Top Cities</h3>
                  <div className="space-y-2">
                    {Object.entries(
                      places.reduce((acc, p) => {
                        const city = p.city || "Unknown";
                        acc[city] = (acc[city] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([city, count]) => (
                        <div key={city} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span className="text-sm text-main-text">{city}</span>
                          <span className="text-sm font-semibold text-brown-text">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editingPlace && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold text-main-text mb-4">
                  Edit Place: {editingPlace.displayName}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1">
                      Place Name *
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1">
                      Category
                    </label>
                    <select
                      value={editForm.categoryId || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          categoryId: Number(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1">
                      City
                    </label>
                    <select
                      value={editForm.cityId || ""}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-sm cursor-not-allowed"
                    >
                      <option value="">Select city</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name} ({city.countryName})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-brown-text mt-1">
                      City cannot be changed for existing places
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editForm.cachedAddress}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          cachedAddress: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1">
                      Description
                    </label>
                    <textarea
                      value={editForm.cachedDescription}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          cachedDescription: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={editForm.cachedImageUrl}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          cachedImageUrl: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                    />
                    {editForm.cachedImageUrl && (
                      <img
                        src={editForm.cachedImageUrl}
                        alt="Preview"
                        className="mt-2 w-32 h-32 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1">
                      Rating
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={editForm.cachedRating || ""}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-sm cursor-not-allowed"
                    />
                    <p className="text-xs text-brown-text mt-1">
                      Rating is managed by Google Places data
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Google Place ID:</strong>{" "}
                      {editingPlace.placeId}
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      <strong>Coordinates:</strong> {editingPlace.location.lat},{" "}
                      {editingPlace.location.lng}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleUpdatePlace}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingPlace(null)}
                    className="bg-gray-200 hover:bg-gray-300 text-main-text px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-main-text">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-brown-text mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search places..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brown-text mb-1">
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) =>
                    setSelectedCity(
                      e.target.value === "all" ? "all" : Number(e.target.value)
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                >
                  <option value="all">All Cities</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name} ({city.countryName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-brown-text mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(
                      e.target.value === "all" ? "all" : Number(e.target.value)
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-brown-text mb-1">
                  Sort By
                </label>
                <select
                  value={`${sortBy}-${sortDirection}`}
                  onChange={(e) => {
                    const [field, dir] = e.target.value.split("-");
                    setSortBy(field as "name" | "rating" | "city");
                    setSortDirection(dir as "asc" | "desc");
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="rating-desc">Rating (High-Low)</option>
                  <option value="rating-asc">Rating (Low-High)</option>
                  <option value="city-asc">City (A-Z)</option>
                  <option value="city-desc">City (Z-A)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Places Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow"></div>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="text-center py-12 text-brown-text">
                No places found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        Place
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        City
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPlaces.map((place) => (
                      <tr key={place.backendId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-main-text">
                          <div>
                            <div className="font-semibold">{place.displayName}</div>
                            {place.photos?.[0] && (
                              <img
                                src={place.photos[0].getURI()}
                                alt={place.displayName}
                                className="mt-2 w-16 h-16 object-cover rounded"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-brown-text">
                          {place.category || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-brown-text">
                          <div>
                            <div>{place.city || "—"}</div>
                            <div className="text-xs text-gray-500">
                              {place.country}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-brown-text">
                          {place.rating ? (
                            <span className="inline-flex items-center">
                              ⭐ {place.rating.toFixed(1)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-brown-text max-w-xs truncate">
                          {place.formattedAddress || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium space-x-3">
                          <button
                            onClick={() => handleEditClick(place)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeletePlace(place.backendId, place.displayName)
                            }
                            className="text-red-600 hover:text-red-900"
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

          <div className="mt-4 text-sm text-brown-text flex justify-between">
            <span>
              Showing: <strong>{filteredPlaces.length}</strong> places
              {search || selectedCity !== "all" || selectedCategory !== "all"
                ? ` (filtered from ${places.length})`
                : ""}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}