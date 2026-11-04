import api from "./api";

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
}

export const uploadAvatarApi = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("avatar", file);
  formData.append("file", file);
  formData.append("image", file);

  try {
    const response = await api.post("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return (
      response.data?.data?.avatarUrl ||
      response.data?.data?.url ||
      response.data?.avatarUrl ||
      response.data?.url ||
      response.data?.data?.secure_url ||
      response.data?.secure_url ||
      ""
    );
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } };
    if (axiosErr.response?.status === 404) {
      const altResponse = await api.post("/upload/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return (
        altResponse.data?.data?.avatarUrl ||
        altResponse.data?.data?.url ||
        altResponse.data?.avatarUrl ||
        altResponse.data?.url ||
        altResponse.data?.data?.secure_url ||
        altResponse.data?.secure_url ||
        ""
      );
    }
    throw err;
  }
};

/**
 * Upload ảnh chung (KYC, chứng từ, giấy phép...) mà không làm thay đổi avatar của user trong DB
 */
export const uploadImageApi = async (file: File, folder = "reuse_hub/kyc"): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("image", file);
  formData.append("folder", folder);

  const response = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return (
    response.data?.url ||
    response.data?.data?.url ||
    response.data?.data?.secure_url ||
    response.data?.secure_url ||
    response.data?.avatarUrl ||
    ""
  );
};

export const updateProfileApi = async (data: Record<string, unknown>) => {
  const response = await api.put("/users/profile", data);
  return response.data?.data || response.data;
};

export const getProfileApi = async () => {
  const response = await api.get("/users/profile");
  return response.data?.data || response.data;
};
