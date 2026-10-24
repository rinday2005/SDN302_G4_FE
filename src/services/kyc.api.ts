import api from './api';

export interface UserKycDetails {
  citizenId: string;
  fullName: string;
  dob: string;
  idType: string;
  residentAddress: string;
  cardFrontUrl: string;
  cardBackUrl: string;
  livenessUrl: string;
  kycCode: string;
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3';
  creditLimit: number;
  rejectionReason?: string | null;
  submittedAt?: string;
  verifiedAt?: string;
}

export interface UserKycResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    avatarUrl?: string;
    role: string;
    kycStatus?: string;
    address?: unknown;
  };
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'VERIFIED' | 'REJECTED';
  kyc: UserKycDetails;
}

export interface SubmitKycDto {
  idCardNumber?: string;
  citizenId?: string;
  fullName?: string;
  dob?: string;
  idType?: string;
  residentAddress?: string;
  frontImageUrl?: string;
  cardFrontUrl?: string;
  backImageUrl?: string;
  cardBackUrl?: string;
  livenessUrl?: string;
}

export interface UpdateKycStatusDto {
  status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  citizenId?: string;
  fullName?: string;
  residentAddress?: string;
}

/**
 * Lấy thông tin KYC của người dùng hiện tại từ cơ sở dữ liệu
 */
export const getKycStatusApi = async (): Promise<UserKycResponse> => {
  try {
    const res = await api.get('/kyc/me');
    return res.data?.data || res.data;
  } catch {
    const res = await api.get('/users/kyc');
    return res.data?.data || res.data;
  }
};

/**
 * Gửi hồ sơ KYC mới từ khách hàng
 */
export const submitKycApi = async (data: SubmitKycDto): Promise<UserKycResponse> => {
  const payload = {
    ...data,
    idCardNumber: data.idCardNumber || data.citizenId,
    citizenId: data.citizenId || data.idCardNumber,
    frontImageUrl: data.frontImageUrl || data.cardFrontUrl,
    cardFrontUrl: data.cardFrontUrl || data.frontImageUrl,
    backImageUrl: data.backImageUrl || data.cardBackUrl,
    cardBackUrl: data.cardBackUrl || data.backImageUrl,
  };
  try {
    const res = await api.post('/kyc/submit', payload);
    return res.data?.data || res.data;
  } catch {
    const res = await api.post('/users/kyc/submit', payload);
    return res.data?.data || res.data;
  }
};

/**
 * Cập nhật trạng thái KYC (kiểm thử hoặc phê duyệt)
 */
export const updateKycStatusApi = async (data: UpdateKycStatusDto): Promise<UserKycResponse> => {
  const res = await api.patch('/users/kyc/status', data);
  return res.data?.data || res.data;
};
