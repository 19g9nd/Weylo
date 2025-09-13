export interface RegisterDto {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ChangeUsernameDto {
  newUsername: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO date string
}

export interface User {
  id: number;
  email: string;
  username: string;
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

// Auth context types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginDto) => Promise<ApiResponse<AuthResponseDto>>;
  register: (userData: RegisterDto) => Promise<ApiResponse<AuthResponseDto>>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<ApiResponse<void>>;
  changeUsername: (
    newUsername: string
  ) => Promise<ApiResponse<{ message: string }>>;
  resetPassword: (data: ResetPasswordDto) => Promise<ApiResponse<void>>;
  changePassword: (data: ChangePasswordDto) => Promise<ApiResponse<void>>;
  verifyEmail: (token: string) => Promise<ApiResponse<void>>;
  resendVerificationEmail: (email: string) => Promise<ApiResponse<void>>;
  refreshToken: () => Promise<boolean>;
}
