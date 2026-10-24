import api from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  _id?: string;
  email: string;
  fullName: string;
  role: "USER" | "SHOP_OWNER" | "ADMIN";
  avatar?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  phone?: string;
  kycStatus?: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "VERIFIED" | "REJECTED" | null;
  address?: {
    province?: string;
    district?: string;
    ward?: string;
    detail?: string;
  };
  name?: string;
  username?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const loginApi = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", data);

  return response.data.data;
};

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  role: "USER" | "SHOP_OWNER";
}

export interface RegisterResponse {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "SHOP_OWNER" | "ADMIN";
}

export const registerApi = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  const response = await api.post("/auth/register", data);

  return response.data.data;
};