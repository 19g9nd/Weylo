"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "../../components/ui/navigation";
import { useAuth } from "../../context/AuthContext";
import { citiesService } from "../../services/citiesService";
import { countriesService } from "../../services/countriesService";
import { City, CreateCityRequest } from "../../types/city";
import { SupportedCountry } from "../../types/country";

export default function CitiesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<SupportedCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCity, setNewCity] = useState<CreateCityRequest>({
    name: "",
    latitude: 0,
    longitude: 0,
    countryId: 0,
    googlePlaceId: "",
  });

  const router = useRouter();

  // 🔒 Access control
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
      fetchCities();
      fetchCountries();
    }
  }, [isAuthenticated, user]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await citiesService.getCities();
      if (response.success) {
        setCities(response.data || []);
      } else {
        setError(response.error || "Failed to load cities");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await countriesService.getAllCountries();
      if (response.success) {
        setCountries(response.data || []);
      }
    } catch {
      // ignore silently
    }
  };

  const handleCreateCity = async () => {
    if (!newCity.name.trim() || !newCity.countryId) {
      setError("Please enter a city name and select a country");
      return;
    }

    try {
      const response = await citiesService.createCity(newCity);
      if (response.success) {
        setSuccess(`City "${newCity.name}" created successfully`);
        setNewCity({
          name: "",
          latitude: 0,
          longitude: 0,
          countryId: 0,
          googlePlaceId: "",
        });
        setShowAddForm(false);
        fetchCities();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(response.error || "Failed to create city");
      }
    } catch {
      setError("Network error occurred");
    }
  };

  const handleDeleteCity = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete city "${name}"?`)) return;
    try {
      const response = await citiesService.deleteCity(id);
      if (response.success) {
        setCities(cities.filter((c) => c.id !== id));
        setSuccess(`City "${name}" deleted successfully`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to delete city");
      }
    } catch {
      setError("Network error occurred");
    }
  };

  const handleMergeDuplicates = async () => {
    if (!confirm("Merge duplicate cities automatically?")) return;
    try {
      setLoading(true);
      const response = await citiesService.mergeDuplicates();
      if (response.success) {
        setSuccess(
          `Merged ${
            response.data?.mergedCount || 0
          } duplicate cities successfully`
        );
        fetchCities();
      } else {
        setError(response.error || "Failed to merge duplicates");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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
                Cities Management
              </h1>
              <p className="text-brown-text mt-1 text-sm sm:text-base">
                Manage cities, countries and geographical coordinates
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-yellow hover:bg-yellow/90 text-main-text px-3 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Add City
              </button>
              <button
                onClick={handleMergeDuplicates}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Merge Duplicates
              </button>
              <button
                onClick={fetchCities}
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
              <button onClick={() => setError("")}>×</button>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm flex justify-between">
              <span>{success}</span>
              <button onClick={() => setSuccess("")}>×</button>
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-main-text mb-3">
                Add New City
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="City name (e.g., Paris)"
                  value={newCity.name}
                  onChange={(e) =>
                    setNewCity({ ...newCity, name: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow"
                />
                <select
                  value={newCity.countryId || ""}
                  onChange={(e) =>
                    setNewCity({
                      ...newCity,
                      countryId: Number(e.target.value),
                    })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow"
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={newCity.latitude}
                  onChange={(e) =>
                    setNewCity({
                      ...newCity,
                      latitude: parseFloat(e.target.value),
                    })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={newCity.longitude}
                  onChange={(e) =>
                    setNewCity({
                      ...newCity,
                      longitude: parseFloat(e.target.value),
                    })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow"
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleCreateCity}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Create City
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-main-text px-4 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4 flex justify-between items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city..."
              className="border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-yellow"
            />
          </div>

          {/* Cities Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow"></div>
              </div>
            ) : filteredCities.length === 0 ? (
              <div className="text-center py-12 text-brown-text">
                No cities found.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                      Coordinates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                      Google Place ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCities.map((city) => (
                    <tr key={city.id}>
                      <td className="px-6 py-4 text-sm font-medium text-main-text">
                        {city.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-brown-text">
                        {city.countryName || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-brown-text font-mono">
                        {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-sm text-brown-text font-mono truncate max-w-xs">
                        {city.googlePlaceId}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleDeleteCity(city.id, city.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-4 text-sm text-brown-text">
            Total cities: <strong>{filteredCities.length}</strong>
          </div>
        </div>
      </div>
    </>
  );
}
