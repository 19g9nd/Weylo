/**
 * Base category model (matches Category in C#)
 */
export interface Category {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  googleTypes?: string | null; // "museum,tourist_attraction"
  createdAt: string; // ISO date string
}

/**
 * DTO for creating/updating category (matches CategoryDto in C#)
 */
export interface CategoryDto {
  name: string;
  description?: string | null;
  icon?: string | null;
  googleTypes?: string | null;
}

/**
 * Form for creating category (client-side)
 */
export interface CreateCategoryForm {
  name: string;
  description?: string;
  icon?: string;
  googleTypes?: string;
}

/**
 * Form for updating category (client-side)
 */
export interface UpdateCategoryForm extends CreateCategoryForm {
  id: number;
}

/**
 * Category with additional information (e.g., places count)
 */
export interface CategoryWithStats extends Category {
  destinationsCount?: number;
}

/**
 * Category filtering parameters
 */
export interface CategoryFilters {
  search?: string;
  hasGoogleTypes?: boolean;
}

/**
 * Category sorting parameters
 */
export type CategorySortField = 'name' | 'createdAt' | 'destinationsCount';

export interface CategorySortOptions {
  field: CategorySortField;
  direction: 'asc' | 'desc';
}