export interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}