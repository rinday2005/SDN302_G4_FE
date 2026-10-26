import api from "./api";

export interface ChatParticipant {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: "USER" | "SHOP_OWNER" | "ADMIN";
}

export interface ChatMessage {
  _id?: string;
  id?: string;
  conversationId: string;
  senderId: string | ChatParticipant;
  text?: string;
  imageUrl?: string | null;
  createdAt: string;
}

export interface ConversationLastMessage {
  text?: string;
  senderId?: string | ChatParticipant | null;
  imageUrl?: string | null;
  createdAt?: string;
}

export interface Conversation {
  _id: string;
  id?: string;
  participants: ChatParticipant[];
  lastMessage?: ConversationLastMessage | null;
  createdAt?: string;
  updatedAt?: string;
  unreadCount?: number;
}

export interface GetMessagesResponse {
  messages: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Lấy hoặc tạo cuộc trò chuyện với Shop Owner (dành cho USER)
 * Hoặc lấy danh sách conversations (dành cho SHOP_OWNER)
 * GET /api/chat/conversation
 */
export const getMyConversationApi = async (): Promise<Conversation | Conversation[]> => {
  const response = await api.get("/chat/conversation");
  return response.data?.data;
};

/**
 * Lấy danh sách tất cả các cuộc trò chuyện của người dùng hiện tại
 * GET /api/chat/conversations
 */
export const getConversationsApi = async (): Promise<Conversation[]> => {
  const response = await api.get("/chat/conversations");
  const data = response.data?.data;
  return Array.isArray(data) ? data : [];
};

/**
 * Lấy chi tiết conversation theo ID
 * GET /api/chat/conversations/:id
 */
export const getConversationByIdApi = async (conversationId: string): Promise<Conversation> => {
  const response = await api.get(`/chat/conversations/${conversationId}`);
  return response.data?.data;
};

/**
 * Lấy lịch sử tin nhắn của conversation
 * GET /api/chat/conversations/:id/messages
 */
export const getMessagesApi = async (
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<GetMessagesResponse> => {
  const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
    params: { page, limit },
  });
  const data = response.data?.data;
  const pagination = response.data?.pagination || {
    page,
    limit,
    total: Array.isArray(data) ? data.length : 0,
    totalPages: 1,
  };
  return {
    messages: Array.isArray(data) ? data : [],
    pagination,
  };
};

/**
 * Gửi tin nhắn qua REST API
 * POST /api/chat/conversations/:id/messages
 */
export const sendMessageApi = async (
  conversationId: string,
  payload: { text?: string; imageUrl?: string | null }
): Promise<ChatMessage> => {
  const response = await api.post(`/chat/conversations/${conversationId}/messages`, payload);
  return response.data?.data;
};

/**
 * Upload ảnh đính kèm trong tin nhắn chat
 * POST /api/upload
 */
export const uploadChatImageApi = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("image", file);

  const response = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const url =
    response.data?.url ||
    response.data?.data?.url ||
    response.data?.avatarUrl ||
    response.data?.data?.secure_url;

  if (!url) {
    throw new Error("Không nhận được đường dẫn ảnh sau khi upload");
  }

  return url;
};
