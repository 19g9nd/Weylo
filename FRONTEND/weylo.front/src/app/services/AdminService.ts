import { ApiResponse, User } from "../types/shared";
import httpClient from "./httpClient";

class AdminService {
  async getUsers(): Promise<ApiResponse<User[]>> {
    return httpClient.get<User[]>("/api/admin/users");
  }

  async deleteUser(userId: number): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete<{ message: string }>(`/api/admin/users/${userId}`);
  }

  async changeUserRole(
    userId: number,
    newRole: string
  ): Promise<ApiResponse<{ message: string }>> {
    return httpClient.put<{ message: string }>(
      `/api/admin/users/${userId}/role`,
      { newRole }
    );
  }
}

const adminService = new AdminService();
export default adminService;
