import api from './api';

/**
 * Upload a single image file to Cloudinary via backend /api/upload
 * @param file File object from input[type="file"]
 * @returns Promise<string> Secure URL from Cloudinary (https://res.cloudinary.com/...)
 */
export const uploadImageApi = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('image', file);

  try {
    const res = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const payload = res.data;
    const url =
      payload?.url ||
      payload?.avatarUrl ||
      payload?.data?.url ||
      payload?.data?.secure_url ||
      payload?.data?.avatarUrl ||
      '';

    if (!url) {
      throw new Error('Không nhận được URL ảnh từ máy chủ Cloudinary');
    }

    return url;
  } catch (error) {
    console.error('Lỗi upload ảnh lên Cloudinary:', error);
    throw error;
  }
};

export default uploadImageApi;
