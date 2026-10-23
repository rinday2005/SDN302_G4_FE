import api from './api';

export interface ThriftListingItemApi {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  condition: string;
  images: string[];
  location?: string;
  categoryId?: { _id: string; name: string; slug: string } | string;
  category?: { _id: string; name: string; slug: string } | string;
  status: string;
  sourceType?: string;
  quantity?: number;
  sizes?: string[];
  size?: string;
  createdAt?: string;
}

export const getPublicThriftListingsApi = async (params: Record<string, unknown> = {}): Promise<ThriftListingItemApi[]> => {
  try {
    const res = await api.get('/thrift/listings', { params });
    const payload = res.data?.data || res.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.listings)) return payload.listings;
    return [];
  } catch (error) {
    console.warn('Could not load public thrift listings from API:', error);
    return [];
  }
};

export const getPublicThriftListingByIdApi = async (id: string): Promise<ThriftListingItemApi | null> => {
  try {
    const res = await api.get(`/thrift/listings/${id}`);
    return res.data?.data || res.data || null;
  } catch (error) {
    console.warn('Could not load thrift listing detail from API:', error);
    return null;
  }
};
