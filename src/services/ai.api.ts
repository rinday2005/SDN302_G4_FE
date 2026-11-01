import api from './api';
import type { AIMessage, AIProductRecommendation, UserAIPreferences } from '../data/aiAssistantMockDb';

export interface AIChatRequestPayload {
  prompt: string;
  preferences?: UserAIPreferences;
  activeProductId?: string | null;
  messages?: AIMessage[];
}

export const sendAIChatPromptApi = async (
  payload: AIChatRequestPayload
): Promise<AIMessage | null> => {
  try {
    const res = await api.post('/ai/chat', payload);
    const data = res.data?.data ?? res.data;
    if (data && data.sender === 'ai') {
      return data as AIMessage;
    }
    return null;
  } catch {
    return null;
  }
};

export const getAIRecommendationsApi = async (params?: {
  days?: number;
  maxBudget?: number;
  type?: 'ALL' | 'RENT' | 'THRIFT';
  keyword?: string;
  limit?: number;
}): Promise<AIProductRecommendation[]> => {
  try {
    const res = await api.get('/ai/recommendations', { params });
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

