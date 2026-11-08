import { createContext, useContext } from "react";
import type { ConversationItem, ChatMessageItem } from "../services/chat.api";

export interface CustomerProductContext {
  title: string;
  image?: string;
  price?: number | string;
  shopId?: string;
}

export interface CustomerChatContextType {
  isOpen: boolean;
  conversations: ConversationItem[];
  activeConversation: ConversationItem | null;
  messages: ChatMessageItem[];
  unreadTotal: number;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isShopTyping: boolean;
  productContext: CustomerProductContext | null;
  openChat: (options?: {
    shopId?: string;
    serviceType?: "RENT" | "THRIFT";
    product?: CustomerProductContext;
  }) => void;
  closeChat: () => void;
  selectConversation: (conversation: ConversationItem) => void;
  sendMessage: (text: string, imageUrl?: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  clearProductContext: () => void;
  refreshConversations: () => Promise<void>;
}

export const CustomerChatContext = createContext<CustomerChatContextType | undefined>(undefined);

export const useCustomerChat = (): CustomerChatContextType => {
  const context = useContext(CustomerChatContext);
  if (!context) {
    return {
      isOpen: false,
      conversations: [],
      activeConversation: null,
      messages: [],
      unreadTotal: 0,
      isLoadingConversations: false,
      isLoadingMessages: false,
      isShopTyping: false,
      productContext: null,
      openChat: () => {},
      closeChat: () => {},
      selectConversation: () => {},
      sendMessage: async () => {},
      sendTyping: () => {},
      deleteConversation: async () => false,
      clearProductContext: () => {},
      refreshConversations: async () => {},
    };
  }
  return context;
};
