"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { ApiResponse, User } from "../types/shared";
import adminService from "../services/AdminService";

interface AdminContextType {
  getUsers: () => Promise<ApiResponse<User[]>>;
  deleteUser: (userId: number) => Promise<ApiResponse<{ message: string }>>;
  changeUserRole: (
    userId: number,
    newRole: string
  ) => Promise<ApiResponse<{ message: string }>>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const value: AdminContextType = {
    getUsers: adminService.getUsers,
    deleteUser: adminService.deleteUser,
    changeUserRole: adminService.changeUserRole,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
