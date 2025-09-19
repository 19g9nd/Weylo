import { ApiResponse } from "./shared";

export interface ChangeRoleRequest {
  newRole: string;
}

export interface AdminApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
 
export interface AdminApiResponse<T> extends ApiResponse<T> {
  // Additional data
  adminMetadata?: {
    totalUsers?: number;
    page?: number;
    limit?: number;
  };
}