import { ApiResponse } from "../types/shared";

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

    // Log request details for debugging
    console.log(`🚀 HTTP Request: ${options.method || "GET"} ${url}`);
    console.log("📋 Request headers:", headers);
    if (options.body) {
      console.log("📦 Request body:", options.body);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Log response details
      console.log(
        `📥 Response status: ${response.status} ${response.statusText}`
      );
      console.log(
        "📋 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // If token expired attempt to refresh
      if (response.status === 401 && this.token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry with new token
          const retryHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
          };

          if (this.token) {
            retryHeaders.Authorization = `Bearer ${this.token}`;
          }

          console.log("🔄 Retrying request with refreshed token");
          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });
          return this.handleResponse<T>(retryResponse, endpoint);
        } else {
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

      return this.handleResponse<T>(response, endpoint);
    } catch (error) {
      console.error(`❌ Network error for ${endpoint}:`, error);
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  }

  private async handleResponse<T>(
    response: Response,
    endpoint: string
  ): Promise<ApiResponse<T>> {
    try {
      // Get the raw response text first
      const rawText = await response.text();
      console.log(`📄 Raw response from ${endpoint}:`, rawText);

      // Check if response is empty
      if (!rawText.trim()) {
        console.log("⚠️ Empty response received");
        if (response.ok) {
          return {
            success: true,
            data: null as T,
          };
        } else {
          return {
            success: false,
            error: `Empty response with status ${response.status}`,
          };
        }
      }

      // Check content type
      const contentType = response.headers.get("content-type");
      console.log(`📋 Content-Type: ${contentType}`);

      // If it's not JSON, log the issue
      if (!contentType?.includes("application/json")) {
        console.warn("⚠️ Response is not JSON:", contentType);
        console.warn("📄 Response content:", rawText.substring(0, 500)); // Log first 500 chars

        // If it's HTML (error page), extract useful info
        if (contentType?.includes("text/html")) {
          const titleMatch = rawText.match(/<title>(.*?)<\/title>/i);
          const errorTitle = titleMatch ? titleMatch[1] : "HTML Error Page";
          return {
            success: false,
            error: `Server returned HTML error page: ${errorTitle}`,
          };
        }
      }

      // Try to parse as JSON
      let json;
      try {
        json = JSON.parse(rawText);
        console.log(`✅ Parsed JSON from ${endpoint}:`, json);
      } catch (parseError) {
        console.error(`❌ JSON parsing failed for ${endpoint}:`, parseError);
        console.error(
          "📄 Raw text that failed to parse:",
          rawText.substring(0, 1000)
        );
        return {
          success: false,
          error: `Failed to parse response: Invalid JSON. Content-Type: ${contentType}`,
        };
      }

      if (response.ok) {
        const payload = json?.data ?? json;
        console.log(`✅ Success response from ${endpoint}:`, payload);

        return {
          success: true,
          data: payload as T,
        };
      } else {
        const errorMessage =
          json?.error ||
          json?.message ||
          `Request failed with status ${response.status}`;
        console.error(`❌ Error response from ${endpoint}:`, errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error(`❌ Error handling response from ${endpoint}:`, error);
      return {
        success: false,
        error: "Failed to process server response",
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
      console.log("🔄 Attempting token refresh...");
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Token refresh successful");
        this.setToken(data.accessToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("refreshToken", data.refreshToken);
          if (data.expiresAt) {
            localStorage.setItem("tokenExpiresAt", data.expiresAt);
          }
        }
        return true;
      } else {
        console.error(
          "❌ Token refresh failed:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("❌ Token refresh error:", error);
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