import { createContext, useContext } from "react";
import type { ChatMessageItem } from "../services/chat.api";

export interface CustomerProductContext {
  title: string;
  image?: string;
  price?: number | string;
}

export interface CustomerChatContextType {
  isOpen: boolean;
  unreadCount: number;
  messages: ChatMessageItem[];
  isLoading: boolean;
  isShopTyping: boolean;
  productContext: CustomerProductContext | null;
  openChat: (options?: {
    product?: CustomerProductContext;
  }) => void;
  closeChat: () => void;
  sendMessage: (text: string, imageUrl?: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  clearProductContext: () => void;
}

export const CustomerChatContext = createContext<CustomerChatContextType | undefined>(undefined);

export const useCustomerChat = (): CustomerChatContextType => {
  const context = useContext(CustomerChatContext);
  if (!context) {
    return {
      isOpen: false,
      unreadCount: 0,
      messages: [],
      isLoading: false,
      isShopTyping: false,
      productContext: null,
      openChat: () => {},
      closeChat: () => {},
      sendMessage: async () => {},
      sendTyping: () => {},
      clearProductContext: () => {},
    };
  }
  return context;
};
