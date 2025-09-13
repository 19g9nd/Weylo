import { ApiResponse } from "../types/auth";

class HttpClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Recover token from localstorage
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("accessToken");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("accessToken", token);
      } else {
        localStorage.removeItem("accessToken");
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // If token expired attempt to refresh
      if (response.status === 401 && this.token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry with new token - Create completely new headers object
          const retryHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
          };

          // Add the NEW token to authorization header
          if (this.token) {
            retryHeaders.Authorization = `Bearer ${this.token}`;
          }

          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });
          return this.handleResponse<T>(retryResponse);
        } else {
          // Refresh didn't work, clean tokens and redirect
          this.clearTokens();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return {
            success: false,
            error: "Authentication failed",
          };
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const rawText = await response.text();
      const json = rawText ? JSON.parse(rawText) : null;

      if (response.ok) {
        const payload = json?.data ?? json;

        return {
          success: true,
          data: payload as T,
        };
      } else {
        return {
          success: false,
          error: json?.error || json?.message || "Request failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: "Failed to parse response",
      };
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update both the instance token AND localStorage
        this.setToken(data.accessToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("refreshToken", data.refreshToken);
          // Also update expiration time if provided
          if (data.expiresAt) {
            localStorage.setItem("tokenExpiresAt", data.expiresAt);
          }
        }
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }

    return false;
  }

  private clearTokens() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenExpiresAt");
    }
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// export singleton instance
export const httpClient = new HttpClient(process.env.NEXT_PUBLIC_API_URL ?? "");

export default httpClient;
