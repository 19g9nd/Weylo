"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { ApiResponse } from "../types/shared";
import { countriesService, SupportedCountry } from "../services/countriesService";

interface CountriesContextType {
  getSupportedCountries: () => Promise<ApiResponse<SupportedCountry[]>>;
  getCountryByCode: (code: string) => Promise<ApiResponse<SupportedCountry>>;
  checkCountrySupport: (code: string) => Promise<ApiResponse<{ countryCode: string; isSupported: boolean }>>;
  getSupportedCountryCodes: () => Promise<ApiResponse<string[]>>;
}

const CountriesContext = createContext<CountriesContextType | undefined>(undefined);

export function CountriesProvider({ children }: { children: ReactNode }) {
  const value: CountriesContextType = {
    getSupportedCountries: countriesService.getSupportedCountries,
    getCountryByCode: countriesService.getCountryByCode,
    checkCountrySupport: countriesService.checkCountrySupport,
    getSupportedCountryCodes: countriesService.getSupportedCountryCodes,
  };

  return (
    <CountriesContext.Provider value={value}>{children}</CountriesContext.Provider>
  );
}

export function useCountries(): CountriesContextType {
  const context = useContext(CountriesContext);
  if (!context) throw new Error("useCountries must be used within a CountriesProvider");
  return context;
}
