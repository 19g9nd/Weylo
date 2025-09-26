"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  countriesService,
  SupportedCountry,
} from "../../services/countriesService";
import Navigation from "../../components/ui/navigation";

export default function CountriesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [countries, setCountries] = useState<SupportedCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkAddForm, setShowBulkAddForm] = useState(false);
  const [newCountryName, setNewCountryName] = useState("");
  const [bulkCountryNames, setBulkCountryNames] = useState("");
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
      fetchCountries();
    }
  }, [isAuthenticated, user]);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const response = await countriesService.getAllCountries();

      if (response.success) {
        setCountries(response.data || []);
      } else {
        setError(response.error || "Failed to fetch countries");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCountry = async () => {
    if (!newCountryName.trim()) {
      setError("Please enter a country name");
      return;
    }

    try {
      const response = await countriesService.createCountry(
        newCountryName.trim()
      );

      if (response.success) {
        setSuccess(`Country "${newCountryName}" created successfully`);
        setNewCountryName("");
        setShowAddForm(false);
        fetchCountries();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(response.error || "Failed to create country");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkCountryNames.trim()) {
      setError("Please enter country names");
      return;
    }

    const names = bulkCountryNames
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (names.length === 0) {
      setError("Please enter at least one country name");
      return;
    }

    try {
      const response = await countriesService.bulkCreateCountries(names);

      if (response.success) {
        const result = response.data!;
        setSuccess(`Successfully created ${result.successCount} countries`);

        if (result.errors.length > 0) {
          setError(`Some errors occurred: ${result.errors.join(", ")}`);
        }

        setBulkCountryNames("");
        setShowBulkAddForm(false);
        fetchCountries();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(response.error || "Failed to create countries");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  const handleRefreshData = async (countryId: number, countryName: string) => {
    try {
      const response = await countriesService.refreshCountryData(countryId);

      if (response.success) {
        setSuccess(`Country data for "${countryName}" refreshed successfully`);
        fetchCountries();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to refresh country data");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  const handleDeleteCountry = async (
    countryId: number,
    countryName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete country "${countryName}"? This action cannot be undone.`
      )
    )
      return;

    try {
      const response = await countriesService.deleteCountry(countryId);

      if (response.success) {
        setSuccess(`Country "${countryName}" deleted successfully`);
        setCountries(countries.filter((c) => c.id !== countryId));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to delete country");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  const formatBounds = (country: SupportedCountry) => {
    return `N:${country.northBound.toFixed(2)}, S:${country.southBound.toFixed(
      2
    )}, E:${country.eastBound.toFixed(2)}, W:${country.westBound.toFixed(2)}`;
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-main-text">
                Countries Management
              </h1>
              <p className="text-brown-text mt-2">
                Manage supported countries and their geographical bounds
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Bulk Add
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-yellow hover:bg-yellow/90 text-main-text px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add Country
              </button>
              <button
                onClick={fetchCountries}
                className="bg-gray-200 hover:bg-gray-300 text-main-text px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
              <button
                onClick={() => setError("")}
                className="float-right font-bold"
              >
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              {success}
              <button
                onClick={() => setSuccess("")}
                className="float-right font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Add Country Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-main-text mb-4">
                Add New Country
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  placeholder="Enter country name (e.g., United States)"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow"
                />
                <button
                  onClick={handleCreateCountry}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCountryName("");
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-main-text px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-sm text-brown-text mt-2">
                The system will automatically fetch country details and bounds
                from Google Geocoding API.
              </p>
            </div>
          )}

          {/* Bulk Add Form */}
          {showBulkAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-main-text mb-4">
                Bulk Add Countries
              </h2>
              <textarea
                value={bulkCountryNames}
                onChange={(e) => setBulkCountryNames(e.target.value)}
                placeholder="Enter country names, one per line (e.g., United States&#10;Canada&#10;Mexico)"
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow mb-3"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleBulkCreate}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Countries
                </button>
                <button
                  onClick={() => {
                    setShowBulkAddForm(false);
                    setBulkCountryNames("");
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-main-text px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-sm text-brown-text mt-2">
                Enter one country name per line. The system will automatically
                fetch details from Google Geocoding API.
              </p>
            </div>
          )}

          {/* Countries Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow"></div>
              </div>
            ) : countries.length === 0 ? (
              <div className="text-center py-12 text-brown-text">
                No countries found. Add your first country to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brown-text uppercase tracking-wider">
                        Bounds
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
                    {countries.map((country) => (
                      <tr key={country.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-main-text">
                            {country.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {country.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="text-sm text-brown-text max-w-xs truncate"
                            title={formatBounds(country)}
                          >
                            {formatBounds(country)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="text-sm text-brown-text max-w-xs truncate"
                            title={country.googlePlaceId}
                          >
                            {country.googlePlaceId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() =>
                              handleRefreshData(country.id, country.name)
                            }
                            className="text-blue-600 hover:text-blue-900"
                            title="Refresh data from Google"
                          >
                            Refresh
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteCountry(country.id, country.name)
                            }
                            className="text-red-600 hover:text-red-900"
                            title="Delete country"
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

          {/* Statistics */}
          {!loading && countries.length > 0 && (
            <div className="mt-6 text-sm text-brown-text">
              Total supported countries: <strong>{countries.length}</strong>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
