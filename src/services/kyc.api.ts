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
  citizenId?: string;
  fullName?: string;
  dob?: string;
  idType?: string;
  residentAddress?: string;
  cardFrontUrl?: string;
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
  const res = await api.get('/users/kyc');
  return res.data?.data || res.data;
};

/**
 * Gửi hồ sơ KYC mới từ khách hàng
 */
export const submitKycApi = async (data: SubmitKycDto): Promise<UserKycResponse> => {
  const res = await api.post('/users/kyc/submit', data);
  return res.data?.data || res.data;
};

/**
 * Cập nhật trạng thái KYC (kiểm thử hoặc phê duyệt)
 */
export const updateKycStatusApi = async (data: UpdateKycStatusDto): Promise<UserKycResponse> => {
  const res = await api.patch('/users/kyc/status', data);
  return res.data?.data || res.data;
};
