"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { categoriesService } from "../services/categoriesService";
import { ApiResponse } from "../types/shared";
import { Category, CategoryDto } from "../types/category";

interface CategoriesContextType {
  getCategories: () => Promise<ApiResponse<Category[]>>;
  getCategoryById: (id: number) => Promise<ApiResponse<Category>>;
  createCategory: (categoryDto: CategoryDto) => Promise<ApiResponse<Category>>;
  updateCategory: (
    id: number,
    categoryDto: CategoryDto
  ) => Promise<ApiResponse<void>>;
  deleteCategory: (id: number) => Promise<ApiResponse<void>>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined
);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const value: CategoriesContextType = {
    getCategories: categoriesService.getCategories,
    getCategoryById: categoriesService.getCategoryById,
    createCategory: categoriesService.createCategory,
    updateCategory: categoriesService.updateCategory,
    deleteCategory: categoriesService.deleteCategory,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): CategoriesContextType {
  const context = useContext(CategoriesContext);
  if (!context)
    throw new Error("useCategories must be used within a CategoriesProvider");
  return context;
}