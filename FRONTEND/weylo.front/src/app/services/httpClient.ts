import { ApiResponse } from "../types/shared";

class HttpClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.initializeToken();
  }

  private initializeToken() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("accessToken");
      
      const expiresAt = localStorage.getItem("tokenExpiresAt");
      if (expiresAt && this.isTokenExpired(expiresAt)) {
        console.log("🕒 Token expired on init, clearing...");
        this.clearTokens();
      }
    }
  }

  private isTokenExpired(expiresAt: string): boolean {
    try {
      const expiryTime = new Date(expiresAt).getTime();
      const currentTime = new Date().getTime();
      return currentTime >= expiryTime;
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return true;
    }
  }

  setToken(token: string | null, expiresAt?: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("accessToken", token);
        if (expiresAt) {
          localStorage.setItem("tokenExpiresAt", expiresAt);
        }
      } else {
        this.clearTokens();
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    
    if (this.token) {
      const expiresAt = localStorage.getItem("tokenExpiresAt");
      if (expiresAt && this.isTokenExpired(expiresAt)) {
        console.log("🕒 Token expired before request, attempting refresh...");
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          this.clearTokens();
          if (typeof window !== "undefined") {
            this.showSessionExpiredModal();
          }
          return {
            success: false,
            error: "Token expired, please login again",
          };
        }
      }
    }

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
          this.showSessionExpiredModal();
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
        console.warn("📄 Response content:", rawText.substring(0, 500));

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
        // console.error(`❌ Error response from ${endpoint}:`, errorMessage);
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
    const refreshToken = localStorage.getItem("refreshToken");
    const refreshExpiresAt = localStorage.getItem("refreshTokenExpiresAt");

    if (!refreshToken) {
      console.log("❌ No refresh token available");
      return false;
    }

    if (refreshExpiresAt && this.isTokenExpired(refreshExpiresAt)) {
      console.log("❌ Refresh token expired");
      this.clearTokens();
      return false;
    }

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
        
        this.setToken(data.accessToken, data.expiresAt);
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
          if (data.refreshExpiresAt) {
            localStorage.setItem("refreshTokenExpiresAt", data.refreshExpiresAt);
          }
        }
        return true;
      } else {
        console.error(
          "❌ Token refresh failed:",
          response.status,
          response.statusText
        );
        this.clearTokens();
      }
    } catch (error) {
      console.error("❌ Token refresh error:", error);
      this.clearTokens();
    }

    return false;
  }

  private clearTokens() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenExpiresAt");
      localStorage.removeItem("refreshTokenExpiresAt");
    }
  }

  private showSessionExpiredModal() {
    if (typeof window !== "undefined") {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;
      
      modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h3>Session Expired</h3>
          <p>Your session has expired. Please log in again.</p>
          <button onclick="window.location.href='/login'" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Go to Login
          </button>
        </div>
      `;
      
      document.body.appendChild(modal);
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