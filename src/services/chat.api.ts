import api from "./api";

export interface ChatParticipant {
  _id: string;
  fullName: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
  shopProfile?: {
    shopName?: string;
    description?: string;
    avatarUrl?: string;
    rating?: number;
  };
}

export interface ChatLastMessage {
  text: string;
  senderId?: string | ChatParticipant;
  imageUrl?: string | null;
  createdAt?: string;
}

export interface ConversationItem {
  _id: string;
  rawConversationId?: string;
  participants: ChatParticipant[];
  lastMessage?: ChatLastMessage | null;
  serviceType?: "RENT" | "THRIFT";
  unreadCount?: number;
  orderCode?: string;
  orderTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageItem {
  _id: string;
  conversationId: string;
  senderId: string | ChatParticipant;
  text: string;
  imageUrl?: string | null;
  serviceType?: "RENT" | "THRIFT";
  clientMsgId?: string;
  createdAt: string;
}

export interface MessagesResponse {
  messages: ChatMessageItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Lấy danh sách cuộc trò chuyện của User / Shop Owner
 */
export const getConversationsApi = async (): Promise<ConversationItem[]> => {
  const response = await api.get("/chat/conversations");
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.conversations && Array.isArray(data.conversations)) return data.conversations;
  return [];
};

/**
 * Lấy chi tiết một cuộc trò chuyện
 */
export const getConversationByIdApi = async (id: string): Promise<ConversationItem> => {
  const response = await api.get(`/chat/conversations/${id}`);
  return response.data?.data || response.data;
};

/**
 * Lấy danh sách tin nhắn theo cuộc trò chuyện
 */
export const getMessagesApi = async (
  conversationId: string,
  params?: { page?: number; limit?: number; serviceType?: "RENT" | "THRIFT" }
): Promise<MessagesResponse> => {
  const response = await api.get(`/chat/conversations/${conversationId}/messages`, { params });
  const data = response.data?.data || response.data;
  if (Array.isArray(data)) {
    return { messages: data };
  }
  return {
    messages: data.messages || [],
    pagination: data.pagination,
  };
};

/**
 * Gửi tin nhắn qua HTTP API (fallback hoặc song song với Socket)
 */
export const sendMessageApi = async (
  conversationId: string,
  payload: { text?: string; imageUrl?: string; serviceType?: "RENT" | "THRIFT" }
): Promise<ChatMessageItem> => {
  const response = await api.post(`/chat/conversations/${conversationId}/messages`, payload);
  return response.data?.data || response.data;
};

/**
 * Lấy hoặc khởi tạo conversation giữa User và Shop Owner
 */
export const getMyConversationApi = async (params?: {
  shopId?: string;
  serviceType?: "RENT" | "THRIFT";
  orderCode?: string;
  orderTitle?: string;
}): Promise<ConversationItem> => {
  const response = await api.get("/chat/conversation", { params });
  return response.data?.data || response.data;
};

/**
 * Xóa một cuộc trò chuyện
 */
export const deleteConversationApi = async (conversationId: string): Promise<{ success: boolean; message?: string }> => {
  const response = await api.delete(`/chat/conversations/${conversationId}`);
  return response.data;
};
