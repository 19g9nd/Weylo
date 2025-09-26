"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  countriesService,
  SupportedCountry,
} from "../../services/countriesService";

interface CountryDropdownProps {
  onCountrySelect: (country: SupportedCountry | null) => void;
  placeholder?: string;
  className?: string;
  selectedCountry?: SupportedCountry | null;
}

const CountryDropdown: React.FC<CountryDropdownProps> = ({
  onCountrySelect,
  placeholder = "Where to?",
  className = "",
  selectedCountry = null,
}) => {
  const [countries, setCountries] = useState<SupportedCountry[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<
    SupportedCountry[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await countriesService.getSupportedCountries();
        if (response.success && response.data) {
          setCountries(response.data);
          setFilteredCountries(response.data);
        } else {
          setError("Failed to load countries");
        }
      } catch (err) {
        setError("Error loading countries");
        console.error("Error loading countries:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCountries();
  }, []);

  // Set input value when selectedCountry changes
  useEffect(() => {
    if (selectedCountry) {
      setSearchTerm(selectedCountry.name);
    } else {
      setSearchTerm("");
    }
  }, [selectedCountry]);

  // Filter countries based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter(
        (country) =>
          country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          country.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [searchTerm, countries]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);

    // Clear selection if input doesn't match selected country
    if (selectedCountry && value !== selectedCountry.name) {
      onCountrySelect(null);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleCountrySelect = (country: SupportedCountry) => {
    setSearchTerm(country.name);
    setIsOpen(false);
    onCountrySelect(country);
  };

  const handleClearSelection = () => {
    setSearchTerm("");
    onCountrySelect(null);
    inputRef.current?.focus();
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full p-3 border border-gray-300 rounded-lg text-main-text focus:ring-2 focus:ring-yellow focus:border-transparent pr-10"
          disabled={isLoading}
        />

        {/* Clear button */}
        {searchTerm && (
          <button
            onClick={handleClearSelection}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            type="button"
          >
            ✕
          </button>
        )}

        {/* Dropdown arrow */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          type="button"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow mx-auto mb-2"></div>
              Loading countries...
            </div>
          )}

          {error && <div className="p-4 text-center text-red-500">{error}</div>}

          {!isLoading && !error && filteredCountries.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No countries found
            </div>
          )}

          {!isLoading &&
            !error &&
            filteredCountries.map((country) => (
              <button
                key={country.id}
                onClick={() => handleCountrySelect(country)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-main-text">{country.name}</span>
                  <span className="text-sm text-gray-500 font-mono">
                    {country.code}
                  </span>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default CountryDropdown;