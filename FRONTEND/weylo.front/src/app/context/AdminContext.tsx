"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { ApiResponse, User } from "../types/shared";
import adminService from "../services/adminService";
import {
  countriesService,
  SupportedCountry,
  BulkCreateResult,
} from "../services/countriesService";

interface AdminContextType {
  // User management
  getUsers: () => Promise<ApiResponse<User[]>>;
  deleteUser: (userId: number) => Promise<ApiResponse<{ message: string }>>;
  changeUserRole: (
    userId: number,
    newRole: string
  ) => Promise<ApiResponse<{ message: string }>>;

  getAllCountries: () => Promise<ApiResponse<SupportedCountry[]>>;
  createCountry: (
    countryName: string
  ) => Promise<ApiResponse<SupportedCountry>>;
  bulkCreateCountries: (
    countryNames: string[]
  ) => Promise<ApiResponse<BulkCreateResult>>;
  refreshCountryData: (
    countryId: number
  ) => Promise<ApiResponse<SupportedCountry>>;
  deleteCountry: (countryId: number) => Promise<ApiResponse<void>>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const value: AdminContextType = {
    getUsers: adminService.getUsers,
    deleteUser: adminService.deleteUser,
    changeUserRole: adminService.changeUserRole,

    getAllCountries: countriesService.getAllCountries,
    createCountry: countriesService.createCountry,
    bulkCreateCountries: countriesService.bulkCreateCountries,
    refreshCountryData: countriesService.refreshCountryData,
    deleteCountry: countriesService.deleteCountry,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (!context)
    throw new Error("useAdmin must be used within an AdminProvider");
  return context;
}
