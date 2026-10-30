import api from './api';

export interface ThriftListingItemApi {
  _id: string;
  name: string;
  slug: string;
  title?: string;
  description?: string;
  price: number;
  condition: string;
  images: string[];
  location?: string;
  categoryId?: { _id: string; name: string; slug: string } | string;
  category?: { _id: string; name: string; slug: string } | string;
  categoryLabel?: string;
  status: string;
  source?: string;
  sourceType?: string;
  quantity?: number;
  sizes?: string[];
  size?: string;
  createdAt?: string;
}

export const getPublicThriftListingsApi = async (params: Record<string, unknown> = {}): Promise<ThriftListingItemApi[]> => {
  try {
    const cleanParams: Record<string, unknown> = {};
    if (params.category && params.category !== 'all') cleanParams.category = params.category;
    if (params.status) cleanParams.status = params.status;
    const res = await api.get('/thrift/listings', {
      params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
    });
    const payload = res.data?.data || res.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.listings)) return payload.listings;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.products)) return payload.products;
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

export const getShopThriftListingsApi = async (): Promise<ThriftListingItemApi[]> => {
  try {
    const res = await api.get('/thrift/listings/shop/mine');
    const payload = res.data?.data || res.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.listings)) return payload.listings;
    return [];
  } catch (error) {
    console.warn('Could not load shop thrift listings from API:', error);
    return [];
  }
};

export const createThriftListingApi = async (data: Record<string, unknown>): Promise<ThriftListingItemApi> => {
  const res = await api.post('/thrift/listings', data);
  return res.data?.data || res.data;
};

export const updateThriftListingApi = async (id: string, data: Record<string, unknown>): Promise<ThriftListingItemApi> => {
  const res = await api.put(`/thrift/listings/${id}`, data);
  return res.data?.data || res.data;
};

export const deleteThriftListingApi = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const res = await api.delete(`/thrift/listings/${id}`);
  return res.data;
};

