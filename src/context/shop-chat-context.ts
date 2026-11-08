import { createContext, useContext } from "react";
import type { ConversationItem, ChatMessageItem } from "../services/chat.api";

export interface ShopChatContextType {
  isOpen: boolean;
  activeTab: "RENT" | "THRIFT";
  conversations: ConversationItem[];
  activeConversation: ConversationItem | null;
  messages: ChatMessageItem[];
  unreadTotal: number;
  unreadRent: number;
  unreadThrift: number;
  isCustomerTyping: boolean;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  openChatDrawer: (tab?: "RENT" | "THRIFT", conversationId?: string) => void;
  closeChatDrawer: () => void;
  setActiveTab: (tab: "RENT" | "THRIFT") => void;
  selectConversation: (conversation: ConversationItem | null) => void;
  sendMessage: (text: string, imageUrl?: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  refreshConversations: () => Promise<void>;
}

export const ShopChatContext = createContext<ShopChatContextType | undefined>(undefined);

export const useShopChat = (): ShopChatContextType => {
  const context = useContext(ShopChatContext);
  if (!context) {
    throw new Error("useShopChat must be used within a ShopChatProvider");
  }
  return context;
};
