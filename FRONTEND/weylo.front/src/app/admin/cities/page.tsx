"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "../../components/ui/navigation";
import { useAuth } from "../../context/AuthContext";
import { citiesService, CityDetailsResponse } from "../../services/citiesService";
import { countriesService } from "../../services/countriesService";
import { City, CreateCityRequest, UpdateCityRequest } from "../../types/city";
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
  const [cityNameInput, setCityNameInput] = useState("");
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [detectedCityDetails, setDetectedCityDetails] = useState<CityDetailsResponse | null>(null);
  const [newCity, setNewCity] = useState<CreateCityRequest>({
    name: "",
    latitude: 0,
    longitude: 0,
    countryId: 0,
    googlePlaceId: "",
  });

  // Edit form state
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editForm, setEditForm] = useState<UpdateCityRequest>({
    name: "",
    latitude: 0,
    longitude: 0,
    countryId: 0,
    googlePlaceId: "",
  });

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'countryName'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  // 🆕 Fetch city details from name
  const handleFetchCityDetails = async () => {
    if (!cityNameInput.trim()) {
      setError("Please enter a city name");
      return;
    }

    try {
      setIsFetchingDetails(true);
      setError("");
      const response = await citiesService.fetchCityDetails({
        cityName: cityNameInput.trim(),
      });

      if (response.success && response.data) {
        setDetectedCityDetails(response.data);

        if (response.data.cityExists && response.data.existingCity) {
          setError(`City "${response.data.existingCity.name}" already exists in ${response.data.existingCity.countryName}`);
        } else if (response.data.countryNotSupported) {
          setError(response.data.message);
        } else if (response.data.cityDetails) {
          // Auto-fill the form with detected details
          setNewCity({
            name: response.data.cityDetails.name,
            latitude: response.data.cityDetails.latitude,
            longitude: response.data.cityDetails.longitude,
            countryId: response.data.cityDetails.countryId,
            googlePlaceId: response.data.cityDetails.googlePlaceId,
          });
          setSuccess(`City details fetched! Review and create.`);
          setTimeout(() => setSuccess(""), 3000);
        }
      } else {
        setError(response.error || "Failed to fetch city details");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setIsFetchingDetails(false);
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
        setCityNameInput("");
        setDetectedCityDetails(null);
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

  // 🆕 Edit functionality
  const handleEditClick = (city: City) => {
    setEditingCity(city);
    setEditForm({
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      countryId: city.countryId,
      googlePlaceId: city.googlePlaceId || "",
    });
  };

  const handleUpdateCity = async () => {
    if (!editingCity) return;
    
    if (!editForm.name.trim() || !editForm.countryId) {
      setError("Please enter a city name and select a country");
      return;
    }

    try {
      const response = await citiesService.updateCity(editingCity.id, editForm);
      if (response.success) {
        setSuccess(`City "${editForm.name}" updated successfully`);
        setEditingCity(null);
        fetchCities();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to update city");
      }
    } catch {
      setError("Network error occurred");
    }
  };

  const handleCancelEdit = () => {
    setEditingCity(null);
    setEditForm({
      name: "",
      latitude: 0,
      longitude: 0,
      countryId: 0,
      googlePlaceId: "",
    });
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

  // 🆕 Sorting functionality
  const handleSort = (field: 'name' | 'countryName') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredCities = cities
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aVal = sortField === 'name' ? a.name : (a.countryName || '');
      const bVal = sortField === 'name' ? b.name : (b.countryName || '');
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

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
              <button onClick={() => setError("")} className="font-bold text-lg">×</button>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm flex justify-between">
              <span>{success}</span>
              <button onClick={() => setSuccess("")} className="font-bold text-lg">×</button>
            </div>
          )}

          {/* Edit Form Modal */}
          {editingCity && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold text-main-text mb-4">
                  Edit City: {editingCity.name}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1">
                      City Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1">
                      Country
                    </label>
                    <select
                      value={editForm.countryId || ""}
                      onChange={(e) => setEditForm({ ...editForm, countryId: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                    >
                      <option value="">Select a country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editForm.latitude}
                      onChange={(e) => setEditForm({ ...editForm, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm font-mono"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-main-text mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editForm.longitude}
                      onChange={(e) => setEditForm({ ...editForm, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm font-mono"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-main-text mb-1">
                      Google Place ID
                    </label>
                    <input
                      type="text"
                      value={editForm.googlePlaceId}
                      onChange={(e) => setEditForm({ ...editForm, googlePlaceId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleUpdateCity}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-200 hover:bg-gray-300 text-main-text px-4 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Form with Auto-Detection */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-main-text mb-3">
                Add New City
              </h2>

              {/* Step 1: City Name Input with Auto-Fetch */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-main-text mb-2">
                  Step 1: Enter City Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter city name (e.g., Paris, Tokyo, New York)"
                    value={cityNameInput}
                    onChange={(e) => setCityNameInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFetchCityDetails()}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                  />
                  <button
                    onClick={handleFetchCityDetails}
                    disabled={isFetchingDetails || !cityNameInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                  >
                    {isFetchingDetails ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Fetching...
                      </span>
                    ) : (
                      "Fetch Details"
                    )}
                  </button>
                </div>
                <p className="text-xs text-brown-text mt-1">
                  The system will automatically fetch coordinates and country from Google
                </p>
              </div>

              {/* Step 2: Review and Edit Details */}
              {detectedCityDetails?.cityDetails && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-main-text mb-3">
                    Step 2: Review & Create
                  </label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 font-medium mb-2">
                      ✓ City details fetched from Google
                    </p>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Detected:</strong> {detectedCityDetails.cityDetails.formattedAddress}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-brown-text mb-1">City Name</label>
                      <input
                        type="text"
                        value={newCity.name}
                        onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-brown-text mb-1">Country</label>
                      <select
                        value={newCity.countryId || ""}
                        onChange={(e) => setNewCity({ ...newCity, countryId: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm"
                      >
                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-brown-text mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={newCity.latitude}
                        onChange={(e) => setNewCity({ ...newCity, latitude: parseFloat(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-brown-text mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={newCity.longitude}
                        onChange={(e) => setNewCity({ ...newCity, longitude: parseFloat(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-brown-text mb-1">Google Place ID</label>
                      <input
                        type="text"
                        value={newCity.googlePlaceId}
                        onChange={(e) => setNewCity({ ...newCity, googlePlaceId: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleCreateCity}
                  disabled={!newCity.name || !newCity.countryId}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Create City
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setCityNameInput("");
                    setDetectedCityDetails(null);
                    setNewCity({
                      name: "",
                      latitude: 0,
                      longitude: 0,
                      countryId: 0,
                      googlePlaceId: "",
                    });
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-main-text px-4 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        onClick={() => handleSort('name')}
                        className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          City
                          {sortField === 'name' && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('countryName')}
                        className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          Country
                          {sortField === 'countryName' && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
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
                      <tr key={city.id} className="hover:bg-gray-50">
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
                          {city.googlePlaceId || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium space-x-3">
                          <button
                            onClick={() => handleEditClick(city)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
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
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-brown-text">
            Total cities: <strong>{filteredCities.length}</strong>
            {search && ` (filtered from ${cities.length})`}
          </div>
        </div>
      </div>
    </>
  );
}