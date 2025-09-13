import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AuthResponseDto,
  User,
  ApiResponse,
  ChangeUsernameDto,
} from "../types/auth";
import httpClient from "./httpClient";

class AuthService {
  async register(userData: RegisterDto): Promise<ApiResponse<AuthResponseDto>> {
    const response = await httpClient.post<AuthResponseDto>(
      "/api/auth/register",
      userData
    );

    if (response.success && response.data) {
      this.saveTokens(response.data);
    }

    return response;
  }

  async login(credentials: LoginDto): Promise<ApiResponse<AuthResponseDto>> {
    const response = await httpClient.post<AuthResponseDto>(
      "/api/auth/login",
      credentials
    );

    if (response.success && response.data) {
      this.saveTokens(response.data);
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      this.clearTokens();
      httpClient.setToken(null);
    }
  }

  async refreshToken(): Promise<ApiResponse<AuthResponseDto>> {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      return {
        success: false,
        error: "No refresh token available",
      };
    }

    const response = await httpClient.post<AuthResponseDto>(
      "/api/auth/refresh",
      {
        refreshToken,
      }
    );

    if (response.success && response.data) {
      this.saveTokens(response.data);
    } else {
      this.clearTokens();
    }

    return response;
  }

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return httpClient.post<void>("/api/auth/forgot-password", { email });
  }

  async resetPassword(data: ResetPasswordDto): Promise<ApiResponse<void>> {
    return httpClient.post<void>("/api/auth/reset-password", data);
  }

  async changePassword(data: ChangePasswordDto): Promise<ApiResponse<void>> {
    return httpClient.post<void>("/api/auth/change-password", data);
  }

  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return httpClient.get<void>(
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`
    );
  }

  async resendVerificationEmail(email: string): Promise<ApiResponse<void>> {
    return httpClient.post<void>("/api/auth/resend-verification-email", {
      email,
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return httpClient.get<User>("/api/user/me");
  }

  async changeUsername(
    newUsername: string
  ): Promise<ApiResponse<{ message: string }>> {
    const changeUsernameData: ChangeUsernameDto = {
      newUsername: newUsername.trim(), // Trim whitespace
    };

    return httpClient.patch<{ message: string }>(
      "/api/user/change-username",
      changeUsernameData
    );
  }

  private saveTokens(authResponse: AuthResponseDto): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", authResponse.accessToken);
      localStorage.setItem("refreshToken", authResponse.refreshToken);
      localStorage.setItem("tokenExpiresAt", authResponse.expiresAt);
      httpClient.setToken(authResponse.accessToken);
    }
  }

  private clearTokens(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenExpiresAt");
    }
  }

  getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  isTokenExpired(): boolean {
    if (typeof window === "undefined") return true;

    const expiresAt = localStorage.getItem("tokenExpiresAt");
    if (!expiresAt) return true;

    return new Date(expiresAt) <= new Date();
  }

  hasValidToken(): boolean {
    return !!this.getStoredToken() && !this.isTokenExpired();
  }
}

export const authService = new AuthService();
export default authService;
