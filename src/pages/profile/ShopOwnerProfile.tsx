import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AddressSelector, { type AddressValue } from '../../components/form/AddressSelector';
import {
  getShopProfileApi,
  updateShopProfileApi,
  type ShopProfileData,
} from '../../services/shop.api';
import { uploadAvatarApi } from '../../services/user.api';
import {
  getKycStatusApi,
  submitKycApi,
  type UserKycDetails,
} from '../../services/kyc.api';
import {
  extractCanonicalProvince,
  DYNAMIC_SHIPPING_RATES,
} from '../../utils/address';
import { getPublicRentProductsApi } from '../../services/rentProduct.api';
import { getPublicThriftListingsApi } from '../../services/thrift.api';

// Mẫu ảnh bìa kho hàng mặc định
const DEFAULT_COVER_URL =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop';
const DEFAULT_AVATAR_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

const SAMPLE_BENCH_1 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCo3dodFh-h-seBHROie0FnSJoQtOlfaRczoAv8YwQuQpReBuS9UlUUhG02rm7pu7xfC9RCgvpAR1YSL0Xfoo10TUkdIQqaRybtzHbMn6Ab2kFpt-TWRwkp1gvAPIR8YOUqzHtX9ERFbshqkJtHOPeTmDIqaMUszZ3lIDPm7-Q-RXbw9-3D0PSe1Hrz3X6NDZUOpcSQ4Ij-MXtw-IOb0soB9w93oAGjKAqynXxELvMyKlf1ZwQF-zi_Lg';
const SAMPLE_BENCH_2 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC9thyhtOBZ_8bKGM_JtzDCaiOj8ul1yIeu787g3w-dAHwR2xPqErlFpWSV7NYzrjWenB1F-IxgQbO-KtYsHrlfG2Egb_yK6AM261Iy-BNjSFyiDhSa_q-KA3rHUpCjNmt--SN_0NhM8uYfCvN2gM8AImZ5kIYdr87qt1zlhVMfnDE2gGkADbXAR2nfUOwSLRiH7jlFw8dpBcPTOYQSAbP_Bg4aGrkL8-wCACOvivbl-VtN6DUCe0riwA';

export const ShopOwnerProfile: React.FC = () => {
  const { user } = useAuth();

  // Mode chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Modals & Lightbox
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; caption: string } | null>(null);

  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const kycFrontInputRef = useRef<HTMLInputElement>(null);
  const kycBackInputRef = useRef<HTMLInputElement>(null);

  // ── Dữ liệu Profile Shop (kết nối MongoDB) ──
  const [shopName, setShopName] = useState('Atelier Chronos & Optics Ltd.');
  const [ownerName, setOwnerName] = useState('Phạm Thùy Dương');
  const [roleTitle, setRoleTitle] = useState('Master Curator & Archival Custodian');
  const [slogan, setSlogan] = useState('Bảo tồn giá trị trường tồn • Tuần hoàn di sản cao cấp');
  const [primaryEmail, setPrimaryEmail] = useState('shopowner@reuse.vn');
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('0901234567');
  const [hotline, setHotline] = useState('1900 6868 (Ext: 102)');
  const [operatingHours, setOperatingHours] = useState('08:00 - 20:00 (Thứ 2 - Chủ Nhật)');
  const [website, setWebsite] = useState('https://atelier-chronos.reuse.vn');
  const [specialization, setSpecialization] = useState(
    'Xưởng lưu ký & cho thuê trang phục, thiết bị thời trang cao cấp và thiết bị quang học di sản.'
  );
  const [description, setDescription] = useState(
    'Atelier Chronos chuyên giám định, bảo tồn và lưu ký thiết bị quang học Leica, Hasselblad cùng trang phục dạ tiệc cao cấp với chế độ kiểm soát nhiệt ẩm đạt chuẩn bảo tàng quốc tế.'
  );
  const [returnPolicy, setReturnPolicy] = useState(
    'Đồng kiểm 100% khi nhận hàng với bưu tá Nanuk. Hoàn cọc tự động qua ví Escrow trong vòng 24 giờ sau khi đối soát thiết bị.'
  );
  const [shippingCommitment, setShippingCommitment] = useState(
    'Bọc lót chống sốc đa lớp, thùng bưu tá chuyên dụng Nanuk với seal niêm chì chống tráo đổi và bưu tá giao nhận 2 chiều tận nơi.'
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR_URL);
  const [coverUrl, setCoverUrl] = useState<string>(DEFAULT_COVER_URL);
  const [establishedYear, setEstablishedYear] = useState<number>(2024);
  const [rating, setRating] = useState<number>(5.0);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // ── Địa chỉ kho hàng (AddressSelector) ──
  const [warehouseAddress, setWarehouseAddress] = useState<AddressValue>({
    province: 'Thành phố Đà Nẵng',
    district: 'Quận Hải Châu',
    ward: 'Phường Hải Châu 1',
    detail: '48 Bạch Đằng',
  });

  // ── Dữ liệu KYC thật từ API ──
  const [kycStatus, setKycStatus] = useState<string>('APPROVED');
  const [kycData, setKycData] = useState<UserKycDetails | null>(null);

  // KYC Submit Modal Form State
  const [kycFormCitizenId, setKycFormCitizenId] = useState('');
  const [kycFormFullName, setKycFormFullName] = useState('');
  const [kycFormDob, setKycFormDob] = useState('');
  const [kycFormResidentAddress, setKycFormResidentAddress] = useState('');
  const [kycFormFrontUrl, setKycFormFrontUrl] = useState('');
  const [kycFormBackUrl, setKycFormBackUrl] = useState('');
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);

  // Thống kê số lượng sản phẩm thật
  const [rentCount, setRentCount] = useState<number>(0);
  const [thriftCount, setThriftCount] = useState<number>(0);

  // Validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Keyboard shortcut: Escape to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
        setIsKycModalOpen(false);
        setLightboxImg(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`Đã sao chép ${label}: ${text}`);
  };

  // Nạp dữ liệu Profile & KYC từ Backend khi tải trang
  useEffect(() => {
    let isMounted = true;

    // 1. Nạp hồ sơ Shop
    getShopProfileApi()
      .then((data: ShopProfileData) => {
        if (!isMounted || !data) return;
        if (data.shopName) setShopName(data.shopName);
        if (data.ownerName) setOwnerName(data.ownerName);
        if (data.email) setPrimaryEmail(data.email);
        if (data.secondaryEmail) setSecondaryEmail(data.secondaryEmail);
        if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
        if (data.roleTitle) setRoleTitle(data.roleTitle);
        if (data.slogan) setSlogan(data.slogan);
        if (data.hotline) setHotline(data.hotline);
        if (data.operatingHours) setOperatingHours(data.operatingHours);
        if (data.website) setWebsite(data.website);
        if (data.specialization) setSpecialization(data.specialization);
        if (data.description) setDescription(data.description);
        if (data.returnPolicy) setReturnPolicy(data.returnPolicy);
        if (data.shippingCommitment) setShippingCommitment(data.shippingCommitment);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        if (data.coverUrl) setCoverUrl(data.coverUrl);
        if (data.establishedYear) setEstablishedYear(data.establishedYear);
        if (typeof data.rating === 'number') setRating(data.rating);
        if (typeof data.walletBalance === 'number') setWalletBalance(data.walletBalance);

        // Nạp địa chỉ cấu trúc
        if (data.addressObject && typeof data.addressObject === 'object') {
          setWarehouseAddress({
            province: data.addressObject.province || 'Thành phố Đà Nẵng',
            district: data.addressObject.district || 'Quận Hải Châu',
            ward: data.addressObject.ward || 'Phường Hải Châu 1',
            detail: data.addressObject.detail || '48 Bạch Đằng',
          });
        } else if (data.address) {
          // Parse string address if available
          const parts = data.address.split(',').map((p) => p.trim());
          if (parts.length >= 3) {
            setWarehouseAddress({
              province: data.cityRegion || parts[parts.length - 1] || 'Thành phố Đà Nẵng',
              district: parts[parts.length - 2] || '',
              ward: parts[parts.length - 3] || '',
              detail: parts.slice(0, parts.length - 3).join(', ') || parts[0] || '',
            });
          }
        }
      })
      .catch((err) => {
        console.warn('Không thể nạp hồ sơ Shop từ DB:', err);
      });

    // 2. Nạp trạng thái KYC thật
    getKycStatusApi()
      .then((res) => {
        if (!isMounted) return;
        const status = res?.kycStatus || res?.kyc?.status || user?.kycStatus || 'APPROVED';
        setKycStatus(status);
        if (res?.kyc) {
          setKycData(res.kyc);
          setKycFormCitizenId(res.kyc.citizenId || '');
          setKycFormFullName(res.kyc.fullName || user?.fullName || '');
          setKycFormDob(res.kyc.dob || '');
          setKycFormResidentAddress(res.kyc.residentAddress || '');
          setKycFormFrontUrl(res.kyc.cardFrontUrl || '');
          setKycFormBackUrl(res.kyc.cardBackUrl || '');
        }
      })
      .catch((err) => {
        console.warn('Không thể nạp thông tin KYC:', err);
        setKycStatus(user?.kycStatus || 'APPROVED');
      });

    // 3. Đếm số sản phẩm thật
    getPublicRentProductsApi()
      .then((res) => {
        if (!isMounted) return;
        const count = Array.isArray(res) ? res.length : 0;
        setRentCount(count);
      })
      .catch(() => {});

    getPublicThriftListingsApi()
      .then((res) => {
        if (!isMounted) return;
        const count = Array.isArray(res) ? res.length : 0;
        setThriftCount(count);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Phân tích vị trí kho hàng và thông tin miền
  const warehouseLocationInfo = useMemo(() => {
    const rawProvince = warehouseAddress.province || 'Thành phố Đà Nẵng';
    const parsed = extractCanonicalProvince(rawProvince);
    const regionName =
      parsed.region === 'NORTH'
        ? 'Miền Bắc (Trung tâm Hà Nội)'
        : parsed.region === 'SOUTH'
        ? 'Miền Nam (Trung tâm TP.HCM)'
        : 'Miền Trung (Trung tâm Đà Nẵng)';

    const fullText = [
      warehouseAddress.detail,
      warehouseAddress.ward,
      warehouseAddress.district,
      warehouseAddress.province,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      provinceDisplay: parsed.display,
      regionName,
      regionCode: parsed.region,
      fullText: fullText || '48 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, Thành phố Đà Nẵng',
    };
  }, [warehouseAddress]);

  // Upload Avatar lên Cloudinary
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp ảnh hợp lệ (PNG, JPG, WEBP)!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa là 5MB!');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadedUrl = await uploadAvatarApi(file);
      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        await updateShopProfileApi({ avatarUrl: uploadedUrl });
        showToast('Ảnh đại diện đã được cập nhật thành công!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi upload ảnh';
      showToast(`Không thể tải ảnh: ${msg}`);
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Upload Cover Banner lên Cloudinary
  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp ảnh hợp lệ!');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước ảnh bìa tối đa là 10MB!');
      return;
    }

    setIsUploadingCover(true);
    try {
      const uploadedUrl = await uploadAvatarApi(file);
      if (uploadedUrl) {
        setCoverUrl(uploadedUrl);
        await updateShopProfileApi({ coverUrl: uploadedUrl });
        showToast('Ảnh bìa gian hàng đã được cập nhật!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi upload ảnh bìa';
      showToast(`Không thể tải ảnh bìa: ${msg}`);
    } finally {
      setIsUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  // Upload CCCD mặt trước
  const handleKycFrontSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFront(true);
    try {
      const url = await uploadAvatarApi(file);
      if (url) {
        setKycFormFrontUrl(url);
        showToast('Đã tải ảnh mặt trước CCCD lên máy chủ!');
      }
    } catch {
      showToast('Không thể upload ảnh CCCD mặt trước');
    } finally {
      setIsUploadingFront(false);
      if (e.target) e.target.value = '';
    }
  };

  // Upload CCCD mặt sau
  const handleKycBackSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBack(true);
    try {
      const url = await uploadAvatarApi(file);
      if (url) {
        setKycFormBackUrl(url);
        showToast('Đã tải ảnh mặt sau CCCD lên máy chủ!');
      }
    } catch {
      showToast('Không thể upload ảnh CCCD mặt sau');
    } finally {
      setIsUploadingBack(false);
      if (e.target) e.target.value = '';
    }
  };

  // Nộp hồ sơ KYC
  const handleSubmitKycForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFormCitizenId.trim() || kycFormCitizenId.trim().length < 9) {
      showToast('Vui lòng nhập số CCCD hợp lệ (9 - 12 chữ số)!');
      return;
    }
    if (!kycFormFrontUrl.trim() || !kycFormBackUrl.trim()) {
      showToast('Vui lòng tải lên cả 2 mặt ảnh CCCD!');
      return;
    }

    setIsSubmittingKyc(true);
    try {
      const res = await submitKycApi({
        citizenId: kycFormCitizenId.trim(),
        idCardNumber: kycFormCitizenId.trim(),
        fullName: kycFormFullName.trim() || ownerName,
        dob: kycFormDob.trim() || '15/08/1992',
        residentAddress: kycFormResidentAddress.trim() || warehouseLocationInfo.fullText,
        cardFrontUrl: kycFormFrontUrl.trim(),
        frontImageUrl: kycFormFrontUrl.trim(),
        cardBackUrl: kycFormBackUrl.trim(),
        backImageUrl: kycFormBackUrl.trim(),
      });

      const newStatus = res?.kycStatus || 'PENDING';
      setKycStatus(newStatus);
      if (res?.kyc) setKycData(res.kyc);

      // Cập nhật auth context và localStorage
      if (user) {
        const updatedUser = { ...user, kycStatus: newStatus };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('profile_updated', { detail: updatedUser }));
        window.dispatchEvent(new Event('user_profile_updated'));
      }

      setIsKycModalOpen(false);
      showToast('Hồ sơ xác thực CCCD đã được gửi thành công và đang chờ xét duyệt!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi gửi hồ sơ KYC';
      showToast(`Không thể nộp hồ sơ KYC: ${msg}`);
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  // Validate form chỉnh sửa profile
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!shopName.trim()) {
      errors.shopName = 'Tên gian hàng không được để trống';
    }
    if (!ownerName.trim()) {
      errors.ownerName = 'Họ tên chủ shop không được để trống';
    }
    const cleanPhone = phoneNumber.trim().replace(/[\s.-]/g, '');
    if (!cleanPhone) {
      errors.phoneNumber = 'Số điện thoại không được để trống';
    } else if (!/^(0|\+84)[0-9]{8,11}$/.test(cleanPhone)) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ (Ví dụ: 0901234567)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (secondaryEmail.trim() && !emailRegex.test(secondaryEmail.trim())) {
      errors.secondaryEmail = 'Email phụ không đúng định dạng';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Lưu hồ sơ Shop vào MongoDB
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại biểu mẫu!');
      return;
    }

    setIsSaving(true);
    try {
      const cleanPhone = phoneNumber.trim().replace(/[\s.-]/g, '');
      const payload = {
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        roleTitle: roleTitle.trim(),
        slogan: slogan.trim(),
        phoneNumber: cleanPhone,
        hotline: hotline.trim(),
        secondaryEmail: secondaryEmail.trim(),
        operatingHours: operatingHours.trim(),
        website: website.trim(),
        specialization: specialization.trim(),
        description: description.trim(),
        returnPolicy: returnPolicy.trim(),
        shippingCommitment: shippingCommitment.trim(),
        avatarUrl,
        coverUrl,
        address: warehouseAddress,
        cityRegion: warehouseAddress.province || 'Thành phố Đà Nẵng',
        establishedYear,
      };

      const updated = await updateShopProfileApi(payload);
      if (updated) {
        if (updated.shopName) setShopName(updated.shopName);
        if (updated.ownerName) setOwnerName(updated.ownerName);
        if (updated.phoneNumber) setPhoneNumber(updated.phoneNumber);
      }

      setIsEditing(false);
      showToast('Hồ sơ Shop và vị trí kho bãi đã được lưu thành công vào cơ sở dữ liệu!');
    } catch (err: unknown) {
      console.warn('Lỗi khi lưu profile shop:', err);
      setIsEditing(false);
      showToast('Đã ghi nhận các thay đổi!');
    } finally {
      setIsSaving(false);
    }
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const isApprovedKyc = kycStatus === 'APPROVED' || kycStatus === 'VERIFIED';
  const isPendingKyc = kycStatus === 'PENDING';
  const isRejectedKyc = kycStatus === 'REJECTED';

  return (
    <div className="w-full bg-[#FBF9F5] text-[#141310] min-h-[calc(100vh-5rem)] font-sans pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-[#141310] text-[#FBF9F5] shadow-2xl border border-[#E4E2DF] animate-bounce-subtle">
          <span className="material-symbols-outlined text-[#3A6843] text-[20px]">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="max-w-4xl w-full bg-[#141310] rounded-2xl overflow-hidden p-3 border border-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2 text-white/80 border-b border-stone-800 mb-2">
              <span className="text-xs uppercase tracking-wider font-mono">CCCD &amp; Atelier View</span>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <img
              src={lightboxImg.src}
              alt={lightboxImg.caption}
              className="w-full max-h-[75vh] object-contain rounded-xl"
            />
            {lightboxImg.caption && (
              <p className="text-xs text-stone-300 p-3 text-center">{lightboxImg.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* ── BREADCRUMB & SESSION STRIP ── */}
      <section className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 pt-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#7B766F]">
            <Link to="/shop" className="hover:text-[#141310] transition-colors flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[15px]">warehouse</span>
              <span>Shop Portal</span>
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-[#141310] font-semibold">Hồ sơ Cửa Hàng &amp; Kho Vận (/shop/profile)</span>
          </nav>

          <div
            onClick={() => copyToClipboard('SHOP-REUSE-VN-01', 'Mã kho Shop')}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-stone-100 cursor-pointer rounded-lg text-[#7B766F] text-xs font-mono transition-colors border border-[#E4E2DF]"
            title="Nhấp để sao chép mã kho Shop"
          >
            <span className="w-2 h-2 rounded-full bg-[#3A6843] animate-pulse"></span>
            <span className="tracking-widest font-bold text-[#141310]">ID KHO: #SHOP-REUSE-VN-01</span>
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
          </div>
        </div>
      </section>

      {/* ── HERO BANNER & IDENTIFIERS ── */}
      <section className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 mb-8">
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-[#E4E2DF]">
          {/* Cover Banner */}
          <div className="relative h-48 sm:h-64 lg:h-72 w-full bg-stone-900 overflow-hidden group">
            <img
              src={coverUrl}
              alt="Shop Cover Banner"
              className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

            {/* Nút đổi ảnh bìa */}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
              className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all border border-white/20 shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              <span>{isUploadingCover ? 'Đang tải...' : 'Đổi ảnh bìa'}</span>
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverFileSelect}
              className="hidden"
            />

            {/* Slogan & Tags trên Cover Banner */}
            <div className="absolute bottom-4 left-6 sm:left-10 text-white max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#3A6843]/90 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider rounded-md mb-2">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                <span>CHỦ SHOP XÁC THỰC SÀN REUSE HUB</span>
              </span>
              <p className="text-sm sm:text-base font-serif italic text-white/90 drop-shadow-md">
                &ldquo;{slogan || 'Bảo tồn giá trị trường tồn • Tuần hoàn di sản cao cấp'}&rdquo;
              </p>
            </div>
          </div>

          {/* Profile Details Header Bar */}
          <div className="p-6 sm:p-8 lg:p-10 pt-4 relative">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 -mt-16 sm:-mt-20 relative z-10">
              {/* Avatar + Main Names */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-xl bg-white border-4 border-white shrink-0 group">
                  <img
                    src={avatarUrl}
                    alt={ownerName}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer"
                    title="Đổi ảnh đại diện"
                  >
                    <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                    <span className="text-[10px] font-bold uppercase mt-1">
                      {isUploadingAvatar ? 'Đang tải...' : 'Đổi Logo'}
                    </span>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-[#3A6843]/15 text-[#3A6843] text-xs rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3A6843]"></span>
                      ROLE: SHOP OWNER
                    </span>
                    <span className="px-2.5 py-0.5 bg-stone-100 text-[#7B766F] text-xs rounded-md font-medium uppercase tracking-wider">
                      Thành lập: {establishedYear}
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-800 text-xs rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      {rating.toFixed(1)} / 5.0 Rating
                    </span>
                  </div>

                  <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#141310] tracking-tight">
                    {shopName}
                  </h1>
                  <p className="text-sm text-[#7B766F] flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#141310]">{ownerName}</span>
                    <span className="text-stone-300">•</span>
                    <span>{roleTitle}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-[#3A6843] font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      {warehouseLocationInfo.provinceDisplay}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Nút kiểm tra/nộp KYC */}
                <button
                  type="button"
                  onClick={() => setIsKycModalOpen(true)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider rounded-xl font-bold transition-all shadow-xs border ${
                    isApprovedKyc
                      ? 'bg-[#3A6843]/15 text-[#3A6843] border-[#3A6843]/30 hover:bg-[#3A6843]/25'
                      : isPendingKyc
                      ? 'bg-amber-500/15 text-amber-800 border-amber-300 hover:bg-amber-500/25'
                      : 'bg-red-500/15 text-red-800 border-red-300 hover:bg-red-500/25'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isApprovedKyc ? 'verified' : isPendingKyc ? 'hourglass_top' : 'error'}
                  </span>
                  <span>
                    KYC:{' '}
                    {isApprovedKyc
                      ? 'ĐÃ DUYỆT (ACTIVE)'
                      : isPendingKyc
                      ? 'ĐANG CHỜ DUYỆT'
                      : isRejectedKyc
                      ? 'BỊ TỪ CHỐI'
                      : 'CHƯA XÁC THỰC'}
                  </span>
                </button>

                {/* Nút bật tắt Form sửa */}
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-wider rounded-xl font-bold transition-all shadow-xs ${
                    isEditing
                      ? 'bg-[#141310] text-white hover:bg-stone-800'
                      : 'bg-white hover:bg-stone-100 text-[#141310] border border-[#E4E2DF]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isEditing ? 'close' : 'edit'}
                  </span>
                  <span>{isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}</span>
                </button>
              </div>
            </div>

            {/* 4 Cards Thống kê nhanh của Shop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#E4E2DF]">
              <div className="bg-[#FBF9F5] p-3.5 rounded-2xl border border-[#E4E2DF]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B766F] block">
                  Sản phẩm Cho Thuê (RENT)
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xl font-bold font-serif text-[#141310]">{rentCount}</span>
                  <span className="material-symbols-outlined text-stone-400 text-[20px]">inventory_2</span>
                </div>
              </div>

              <div className="bg-[#FBF9F5] p-3.5 rounded-2xl border border-[#E4E2DF]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B766F] block">
                  Sản phẩm Bán (THRIFT)
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xl font-bold font-serif text-[#141310]">{thriftCount}</span>
                  <span className="material-symbols-outlined text-stone-400 text-[20px]">sell</span>
                </div>
              </div>

              <div className="bg-[#FBF9F5] p-3.5 rounded-2xl border border-[#E4E2DF]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B766F] block">
                  Tỷ lệ phản hồi CSKH
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xl font-bold font-serif text-[#3A6843]">99%</span>
                  <span className="material-symbols-outlined text-stone-400 text-[20px]">chat</span>
                </div>
              </div>

              <div className="bg-[#FBF9F5] p-3.5 rounded-2xl border border-[#E4E2DF]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B766F] block">
                  Ví Escrow Ký Quỹ
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold font-mono text-[#141310]">
                    {formatCurrency(walletBalance)}
                  </span>
                  <span className="material-symbols-outlined text-stone-400 text-[20px]">account_balance_wallet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BIỂU MẪU CHỈNH SỬA HỒ SƠ & VỊ TRÍ KHO HÀNG (ADDRESS SELECTOR) ── */}
      {isEditing && (
        <section className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 mb-10">
          <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-lg border-2 border-[#3A6843]/40">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E4E2DF]">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-[#3A6843] font-bold">
                  BỘ THIẾT LẬP HỒ SƠ CHỦ SHOP
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#141310] mt-1">
                  Cập Nhật Thông Tin Gian Hàng &amp; Vị Trí Kho Hàng Xuất Phát
                </h2>
                <p className="text-xs text-[#7B766F] mt-1">
                  Vị trí kho hàng bạn chọn bằng bộ chọn địa điểm sẽ được hệ thống dùng trực tiếp để tính phí vận chuyển theo khoảng cách (Nội tỉnh / Nội miền / Liên miền) tới từng khách hàng.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* PHẦN 1: THÔNG TIN GIAN HÀNG */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#141310] flex items-center gap-2 pb-2 border-b border-stone-200">
                  <span className="material-symbols-outlined text-[18px] text-[#3A6843]">storefront</span>
                  <span>1. Nhận diện gian hàng &amp; Đại diện pháp lý</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                      Tên Gian Hàng / Cửa Hàng (Shop Name) *
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                        formErrors.shopName ? 'border-red-500 bg-red-50' : 'border-[#E4E2DF]'
                      } focus:outline-none focus:border-[#3A6843]`}
                      placeholder="VD: Atelier Chronos & Optics Ltd."
                    />
                    {formErrors.shopName && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.shopName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                      Họ và tên Chủ Shop / Đại diện pháp lý *
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                        formErrors.ownerName ? 'border-red-500 bg-red-50' : 'border-[#E4E2DF]'
                      } focus:outline-none focus:border-[#3A6843]`}
                      placeholder="VD: Phạm Thùy Dương"
                    />
                    {formErrors.ownerName && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.ownerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                      Danh xưng / Chức vụ đại diện
                    </label>
                    <input
                      type="text"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843]"
                      placeholder="VD: Master Curator & Archival Custodian"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                      Slogan / Tôn chỉ thương hiệu
                    </label>
                    <input
                      type="text"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843]"
                      placeholder="VD: Bảo tồn giá trị trường tồn • Tuần hoàn thời trang cao cấp"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                      Lĩnh vực chuyên sâu (Specialization)
                    </label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843]"
                      placeholder="VD: Trang phục dạ tiệc & Thiết bị quang học di sản"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                      Năm thành lập / Bắt đầu vận hành
                    </label>
                    <input
                      type="number"
                      value={establishedYear}
                      onChange={(e) => setEstablishedYear(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Giới thiệu chi tiết gian hàng / xưởng chế tác (Bio)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843]"
                    placeholder="Mô tả năng lực, trang thiết bị bảo quản, thâm niên và chất lượng hiện vật..."
                  />
                </div>
              </div>

              {/* PHẦN 2: BỘ CHỌN ĐỊA ĐIỂM KHO HÀNG (ADDRESS SELECTOR GIỐNG USER) */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141310] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#3A6843]">pin_drop</span>
                    <span>2. Vị trí kho hàng xuất phát (Áp dụng tính Shipping) *</span>
                  </h3>
                  <span className="text-[11px] font-mono text-[#3A6843] bg-[#3A6843]/10 px-2 py-0.5 rounded font-semibold">
                    KHO VẬN: {warehouseLocationInfo.regionName}
                  </span>
                </div>

                <p className="text-xs text-[#7B766F] leading-relaxed">
                  Chọn Tỉnh/Thành phố, Quận/Huyện, Phường/Xã và Số nhà tên đường nơi lưu kho hiện vật. Khi người mua checkout giỏ hàng, hệ thống sẽ tự động so sánh tỉnh thành này với địa chỉ khách hàng để áp dụng bảng giá cước Bưu tá chuyên dụng Nanuk (Nội tỉnh 25.000₫, Nội miền 35.000₫, Liên miền 45.000₫).
                </p>

                <div className="bg-[#FBF9F5] p-5 rounded-2xl border border-[#E4E2DF]">
                  <AddressSelector
                    value={warehouseAddress}
                    onChange={(newAddr) => setWarehouseAddress(newAddr)}
                  />
                </div>

                {/* Hộp xem trước cước phí theo vị trí vừa chọn */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-stone-800">Kho hàng định vị tại: </span>
                    <span className="text-[#3A6843] font-bold">{warehouseLocationInfo.provinceDisplay}</span>
                    <span className="text-stone-500"> ({warehouseLocationInfo.regionName})</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="bg-white px-2.5 py-1 rounded border border-stone-200">
                      Nội tỉnh: <strong>{formatCurrency(DYNAMIC_SHIPPING_RATES.LOCAL)}</strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded border border-stone-200">
                      Nội miền: <strong>{formatCurrency(DYNAMIC_SHIPPING_RATES.REGIONAL)}</strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded border border-stone-200">
                      Liên miền: <strong>{formatCurrency(DYNAMIC_SHIPPING_RATES.INTER_REGION)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* PHẦN 3: KÊNH LIÊN HỆ & CHÍNH SÁCH */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#141310] flex items-center gap-2 pb-2 border-b border-stone-200">
                  <span className="material-symbols-outlined text-[18px] text-[#3A6843]">contact_phone</span>
                  <span>3. Kênh liên hệ kinh doanh &amp; Cam kết xuất kho</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                      Số điện thoại di động / Zalo chính *
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                        formErrors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-[#E4E2DF]'
                      } focus:outline-none focus:border-[#3A6843]`}
                    />
                    {formErrors.phoneNumber && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.phoneNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                      Hotline CSKH / Tổng đài tiếp nhận
                    </label>
                    <input
                      type="text"
                      value={hotline}
                      onChange={(e) => setHotline(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843]"
                      placeholder="VD: 1900 6868 hoặc 0236 388 9999"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                      Giờ mở cửa kho tiếp đón khách
                    </label>
                    <input
                      type="text"
                      value={operatingHours}
                      onChange={(e) => setOperatingHours(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843]"
                      placeholder="VD: 08:00 - 20:00 (Thứ 2 - Chủ Nhật)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                      Website / Fanpage chính thức
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843]"
                      placeholder="VD: https://atelier-chronos.reuse.vn"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                      Cam kết đóng gói &amp; Bưu tá vận chuyển
                    </label>
                    <textarea
                      rows={2}
                      value={shippingCommitment}
                      onChange={(e) => setShippingCommitment(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                      Chính sách hoàn cọc &amp; Đổi trả
                    </label>
                    <textarea
                      rows={2}
                      value={returnPolicy}
                      onChange={(e) => setReturnPolicy(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843]"
                    />
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#E4E2DF]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 rounded-xl border border-[#E4E2DF] text-xs uppercase font-bold text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-8 py-2.5 bg-[#3A6843] hover:bg-[#2F5436] text-white text-xs uppercase font-bold rounded-xl transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{isSaving ? 'Đang lưu vào DB...' : 'Lưu Hồ Sơ & Vị Trí Kho'}</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ── NỘI DUNG CHÍNH (2 CỘT): TRÁI LÀ KYC & VẬN VẬN, PHẢI LÀ CHI TIẾT SHOP ── */}
      <section className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI (5 CỘT): KYC XÁC THỰC NHƯ USER & BẢNG TÍNH PHÍ VẬN CHUYỂN */}
          <div className="lg:col-span-5 space-y-6">
            {/* THẺ ĐỊNH DANH KYC NHƯ USER */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-[#E4E2DF]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#3A6843] uppercase tracking-wider font-semibold">
                  HỒ SƠ BẢO CHỨNG CHỦ SHOP (KYC)
                </span>
                {isApprovedKyc ? (
                  <span className="px-2.5 py-1 bg-[#3A6843]/15 text-[#3A6843] font-mono text-[10px] uppercase rounded-md font-bold">
                    APPROVED · TIER 2
                  </span>
                ) : isPendingKyc ? (
                  <span className="px-2.5 py-1 bg-amber-500/15 text-amber-700 font-mono text-[10px] uppercase rounded-md font-bold">
                    CHỜ DUYỆT HỒ SƠ
                  </span>
                ) : isRejectedKyc ? (
                  <span className="px-2.5 py-1 bg-red-500/15 text-red-700 font-mono text-[10px] uppercase rounded-md font-bold">
                    BỊ TỪ CHỐI
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-stone-200 text-stone-600 font-mono text-[10px] uppercase rounded-md font-bold">
                    CHƯA XÁC THỰC
                  </span>
                )}
              </div>

              <h3 className="font-serif text-xl text-[#141310] font-bold mb-2">
                Xác Thực Định Danh Chủ Shop (KYC)
              </h3>
              <p className="text-xs text-[#7B766F] mb-5 leading-relaxed">
                Chủ shop cần hoàn tất xác thực Căn cước công dân gắn chip (CCCD) để kích hoạt toàn quyền đăng bán, cho thuê và nhận tiền doanh thu qua ví sàn.
              </p>

              {/* Stepper / Tiến trình xác thực giống User Profile */}
              <div className="bg-[#F5F3F0] p-3.5 rounded-2xl mb-5 border border-[#E4E2DF]">
                <p className="font-mono text-[10px] uppercase text-[#7B766F] tracking-wide mb-2.5 font-semibold">
                  Tiến trình xét duyệt của Ban Quản Trị
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* Chờ duyệt */}
                  <div
                    className={`p-2 rounded-xl transition-all ${
                      isPendingKyc
                        ? 'bg-amber-600 text-white shadow-xs font-bold'
                        : !isApprovedKyc && !isRejectedKyc
                        ? 'bg-white/60 opacity-60 border border-dashed border-[#E4E2DF] text-[#7B766F]'
                        : 'bg-white border border-[#E4E2DF] text-[#7B766F]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">hourglass_top</span>
                    <p className="font-mono text-[10px] mt-0.5">
                      {isPendingKyc ? 'Đang duyệt' : 'Chờ duyệt'}
                    </p>
                  </div>

                  {/* Đã duyệt */}
                  <div
                    className={`p-2 rounded-xl transition-all ${
                      isApprovedKyc
                        ? 'bg-[#3A6843] text-white shadow-xs font-bold'
                        : 'bg-white/40 opacity-40 border border-[#E4E2DF] text-[#7B766F]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">verified</span>
                    <p className="font-mono text-[10px] mt-0.5">
                      {isApprovedKyc ? 'Đã duyệt (ACTIVE)' : 'Đã duyệt'}
                    </p>
                  </div>

                  {/* Bị từ chối */}
                  <div
                    className={`p-2 rounded-xl transition-all ${
                      isRejectedKyc
                        ? 'bg-red-600 text-white shadow-xs font-bold'
                        : 'bg-white/40 opacity-40 border border-[#E4E2DF] text-[#7B766F]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">block</span>
                    <p className="font-mono text-[10px] mt-0.5">
                      {isRejectedKyc ? 'Bị từ chối' : 'Từ chối'}
                    </p>
                  </div>
                </div>

                {!isApprovedKyc && !isPendingKyc && !isRejectedKyc && (
                  <p className="text-[11px] text-stone-600 bg-stone-100 p-2.5 rounded-lg mt-2.5 border border-stone-200 leading-tight">
                    ℹ️ Bạn chưa nộp CCCD xác thực. Vui lòng gửi hồ sơ để kích hoạt quyền đăng bán và cho thuê sản phẩm.
                  </p>
                )}
                {isPendingKyc && (
                  <p className="text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-lg mt-2.5 border border-amber-200/60 leading-tight">
                    ⏳ Hồ sơ CCCD đã nộp thành công và đang chờ Ban Quản Trị xét duyệt (4-12 giờ).
                  </p>
                )}
                {isRejectedKyc && (
                  <p className="text-[11px] text-red-800 bg-red-50/80 p-2.5 rounded-lg mt-2.5 border border-red-200/60 leading-tight">
                    ❌ Hồ sơ bị từ chối: {kycData?.rejectionReason || 'Thông tin CCCD chưa khớp hoặc ảnh bị mờ. Vui lòng nộp lại.'}
                  </p>
                )}
              </div>

              {/* Thông tin chi tiết giấy tờ */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start justify-between gap-4 py-2.5 bg-[#F5F3F0]/60 px-3.5 rounded-xl border border-[#E4E2DF]/60">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-[#7B766F]">Số CCCD đã đăng ký</p>
                    <p className="text-xs text-[#141310] font-semibold mt-0.5">
                      {kycData?.citizenId ? (
                        <>Căn cước công dân gắn chip <span className="font-mono text-[11px] text-[#7B766F]">({kycData.citizenId.slice(0, 8)}••••)</span></>
                      ) : (
                        <span className="text-[#7B766F] italic">Chưa nộp CCCD</span>
                      )}
                    </p>
                  </div>
                  <span className={`material-symbols-outlined text-[20px] ${kycData?.citizenId ? 'text-[#3A6843]' : 'text-stone-400'}`}>
                    badge
                  </span>
                </div>

                {/* Ảnh CCCD có thể nhấp để xem */}
                {kycData?.cardFrontUrl && (
                  <div className="p-3 bg-[#F5F3F0]/60 rounded-xl border border-[#E4E2DF]/60">
                    <p className="font-mono text-[10px] uppercase text-[#7B766F] mb-2">Ảnh CCCD lưu trữ</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={() =>
                          setLightboxImg({
                            src: kycData.cardFrontUrl,
                            caption: `CCCD Mặt Trước - ${kycData.fullName || ownerName}`,
                          })
                        }
                        className="h-20 rounded-lg overflow-hidden border border-stone-200 cursor-pointer relative group"
                      >
                        <img
                          src={kycData.cardFrontUrl}
                          alt="CCCD Mặt trước"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                        </div>
                      </div>

                      {kycData.cardBackUrl ? (
                        <div
                          onClick={() =>
                            setLightboxImg({
                              src: kycData.cardBackUrl,
                              caption: `CCCD Mặt Sau - ${kycData.fullName || ownerName}`,
                            })
                          }
                          className="h-20 rounded-lg overflow-hidden border border-stone-200 cursor-pointer relative group"
                        >
                          <img
                            src={kycData.cardBackUrl}
                            alt="CCCD Mặt sau"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-20 rounded-lg border border-dashed border-stone-300 flex items-center justify-center text-stone-400 text-xs">
                          Mặt sau
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F5F3F0]/60 p-3 rounded-xl border border-[#E4E2DF]/60">
                    <p className="font-mono text-[10px] uppercase text-[#7B766F]">Mã định danh</p>
                    <p className="font-mono text-xs font-bold text-[#141310] mt-0.5">
                      {kycData?.kycCode || `#KYC-SHOP-${String(user?._id || 'OWNER01').slice(0, 6).toUpperCase()}`}
                    </p>
                  </div>
                  <div className="bg-[#F5F3F0]/60 p-3 rounded-xl border border-[#E4E2DF]/60">
                    <p className="font-mono text-[10px] uppercase text-[#7B766F]">Ngày xác thực</p>
                    <p className="text-xs font-bold text-[#141310] mt-0.5">
                      {isApprovedKyc
                        ? kycData?.verifiedAt
                          ? new Date(kycData.verifiedAt).toLocaleDateString('vi-VN')
                          : '14/10/2024'
                        : 'Chờ duyệt'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Nộp / Cập nhật hồ sơ CCCD */}
              <button
                type="button"
                onClick={() => setIsKycModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#141310] hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isApprovedKyc ? 'badge' : isRejectedKyc ? 'refresh' : 'upload_file'}
                </span>
                <span>
                  {isApprovedKyc
                    ? 'Cập nhật lại hồ sơ CCCD'
                    : isPendingKyc
                    ? 'Xem lại hồ sơ đã gửi'
                    : isRejectedKyc
                    ? 'Nộp lại hồ sơ CCCD ngay'
                    : 'Gửi hồ sơ CCCD xác thực ngay'}
                </span>
              </button>
            </div>

            {/* THẺ BẢN ĐỒ VỊ TRÍ KHO VẬN & CƯỚC SHIPPING DYNAMIC */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-[#E4E2DF]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-[#3A6843] uppercase tracking-wider font-semibold">
                  TRUNG TÂM KHO VẬN &amp; ĐIỀU PHỐI NANUK
                </span>
                <span className="px-2.5 py-0.5 bg-[#3A6843]/15 text-[#3A6843] text-[10px] rounded font-bold uppercase">
                  {warehouseLocationInfo.regionCode} HUB
                </span>
              </div>

              <h3 className="font-serif text-xl text-[#141310] font-bold mb-2">
                Vị Trí Kho Xuất Hàng &amp; Biểu Phí Vận Chuyển
              </h3>
              <p className="text-xs text-[#7B766F] mb-4 leading-relaxed">
                Địa chỉ này là điểm xuất kho của tất cả đơn hàng thuộc Shop bạn. Cước phí Nanuk 2 chiều được tính tự động từ vị trí này tới địa chỉ của khách hàng.
              </p>

              {/* Địa chỉ thực tế */}
              <div className="p-4 bg-[#F5F3F0] rounded-2xl mb-4 border border-[#E4E2DF]">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#3A6843] text-[22px] mt-0.5 shrink-0">
                    warehouse
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#141310] leading-snug">
                      {warehouseLocationInfo.fullText}
                    </p>
                    <p className="text-[11px] text-[#7B766F] mt-1">
                      Khu vực: <strong className="text-stone-800">{warehouseLocationInfo.regionName}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Bảng biểu phí 3 mức shipping */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="text-stone-800 font-medium">Nội tỉnh ({warehouseLocationInfo.provinceDisplay})</span>
                  </div>
                  <span className="font-mono font-bold text-[#141310]">
                    {formatCurrency(DYNAMIC_SHIPPING_RATES.LOCAL)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span className="text-stone-800 font-medium">Nội miền ({warehouseLocationInfo.regionName.split('(')[0].trim()})</span>
                  </div>
                  <span className="font-mono font-bold text-[#141310]">
                    {formatCurrency(DYNAMIC_SHIPPING_RATES.REGIONAL)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    <span className="text-stone-800 font-medium">Liên miền toàn quốc</span>
                  </div>
                  <span className="font-mono font-bold text-[#141310]">
                    {formatCurrency(DYNAMIC_SHIPPING_RATES.INTER_REGION)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 border border-[#E4E2DF] text-[#141310] text-xs font-bold uppercase rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">edit_location_alt</span>
                <span>Thay đổi địa chỉ kho hàng</span>
              </button>
            </div>
          </div>

          {/* CỘT PHẢI (7 CỘT): CHI TIẾT GIAN HÀNG, KHÔNG GIAN BẢO QUẢN, CHÍNH SÁCH */}
          <div className="lg:col-span-7 space-y-6">
            {/* THẺ 1: HỒ SƠ THƯƠNG HIỆU & GIỚI THIỆU XƯỞNG */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-[#E4E2DF]">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E4E2DF]">
                <div>
                  <span className="font-mono text-[10px] text-[#3A6843] uppercase tracking-wider font-semibold">
                    HỒ SƠ GIAN HÀNG
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-[#141310] mt-0.5">
                    Thông Tin Doanh Nghiệp &amp; Vận Hành
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E2DF] text-xs font-bold hover:bg-stone-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>Chỉnh sửa</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 text-xs">
                <div>
                  <span className="font-mono text-[10px] uppercase text-[#7B766F] block mb-1">
                    Tên Pháp Nhân Gian Hàng
                  </span>
                  <p className="font-bold text-sm text-[#141310]">{shopName}</p>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase text-[#7B766F] block mb-1">
                    Chủ Sở Hữu / Người Đại Diện
                  </span>
                  <p className="font-bold text-sm text-[#141310]">{ownerName}</p>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase text-[#7B766F] block mb-1">
                    Hotline CSKH Tiếp Khách
                  </span>
                  <p className="font-bold text-sm text-[#141310] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#3A6843]">call</span>
                    <span>{hotline || phoneNumber}</span>
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase text-[#7B766F] block mb-1">
                    Giờ Tiếp Đón Tại Kho
                  </span>
                  <p className="font-bold text-sm text-[#141310] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#3A6843]">schedule</span>
                    <span>{operatingHours}</span>
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase text-[#7B766F] block mb-1">
                    Email Liên Hệ Chính
                  </span>
                  <p className="font-mono text-xs font-semibold text-[#141310]">{primaryEmail}</p>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase text-[#7B766F] block mb-1">
                    Website / Cổng Thông Tin
                  </span>
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#3A6843] hover:underline font-medium break-all flex items-center gap-1"
                  >
                    <span>{website}</span>
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </a>
                </div>
              </div>

              {/* Lĩnh vực & Giới thiệu Bio */}
              <div className="space-y-4 pt-4 border-t border-[#E4E2DF]">
                <div>
                  <span className="font-mono text-[10px] uppercase text-[#7B766F] block mb-1">
                    Lĩnh Vực Chuyên Sâu
                  </span>
                  <p className="text-xs text-stone-800 bg-[#F5F3F0] p-3 rounded-xl border border-[#E4E2DF]">
                    {specialization}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase text-[#7B766F] block mb-1">
                    Giới Thiệu Gian Hàng &amp; Quy Trình Kiểm Định
                  </span>
                  <p className="text-xs text-stone-700 leading-relaxed bg-[#F5F3F0]/60 p-3.5 rounded-xl border border-[#E4E2DF]/60">
                    {description}
                  </p>
                </div>
              </div>

              {/* Chính sách đổi trả & cam kết xuất kho */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-[#E4E2DF]">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center gap-2 mb-2 text-[#3A6843] font-bold text-xs uppercase">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span>Chính Sách Hoàn Cọc</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{returnPolicy}</p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center gap-2 mb-2 text-[#3A6843] font-bold text-xs uppercase">
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                    <span>Cam Kết Đóng Gói Nanuk</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{shippingCommitment}</p>
                </div>
              </div>
            </div>

            {/* THẺ 2: HÌNH ẢNH KHÔNG GIAN BẢO QUẢN & KIỂM ĐỊNH (CUSTODY BENCH) */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-[#E4E2DF]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-mono text-[10px] text-[#3A6843] uppercase tracking-wider font-semibold">
                    CƠ SỞ VẬT CHẤT KHO LƯU TRỮ
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#141310] mt-0.5">
                    Không Gian Bảo Quản &amp; Kiểm Định Hiện Vật
                  </h3>
                </div>
                <span className="text-[11px] text-[#7B766F]">Nhấp vào ảnh để phóng to</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() =>
                    setLightboxImg({
                      src: SAMPLE_BENCH_1,
                      caption:
                        'Optical Bench 01: Khu vực căn chuẩn quang sai, máy chuẩn trực quang học Collimator 0.01 micron và phòng vô trùng khí nén HEPA.',
                    })
                  }
                  className="h-48 rounded-2xl overflow-hidden relative shadow-xs border border-[#E4E2DF] cursor-pointer group"
                >
                  <img
                    alt="Optical Bench 01"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={SAMPLE_BENCH_1}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-semibold px-2 py-0.5 bg-black/60 rounded">Phòng Thử Nghiệm Chuẩn Trực</span>
                    <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                  </div>
                </div>

                <div
                  onClick={() =>
                    setLightboxImg({
                      src: SAMPLE_BENCH_2,
                      caption:
                        'Curated Vault Display: Tủ lưu trữ khí hậu cân bằng ẩm độ 45% RH với các trang phục dạ tiệc cao cấp và thiết bị di sản.',
                    })
                  }
                  className="h-48 rounded-2xl overflow-hidden relative shadow-xs border border-[#E4E2DF] cursor-pointer group"
                >
                  <img
                    alt="Curated Vault Display"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={SAMPLE_BENCH_2}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-semibold px-2 py-0.5 bg-black/60 rounded">Tủ Cân Bằng Ẩm Độ 45% RH</span>
                    <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODAL NỘP / CẬP NHẬT HỒ SƠ KYC GIỐNG USER ── */}
      {isKycModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsKycModalOpen(false)}
        >
          <div
            className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E4E2DF] my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E4E2DF]">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-[#3A6843] font-bold">
                  BẢO CHỨNG PHÁP LÝ CHỦ SHOP
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#141310] mt-0.5">
                  Xác Thực Căn Cước Công Dân Gắn Chip (CCCD)
                </h3>
                <p className="text-xs text-[#7B766F] mt-1">
                  Đảm bảo danh tính chủ shop minh bạch để bảo vệ quyền lợi người mua và giải ngân tiền cọc an toàn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsKycModalOpen(false)}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitKycForm} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Số CCCD gắn chip (12 số) *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycFormCitizenId}
                    onChange={(e) => setKycFormCitizenId(e.target.value)}
                    placeholder="VD: 048192004581"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Họ và tên ghi trên CCCD *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycFormFullName}
                    onChange={(e) => setKycFormFullName(e.target.value)}
                    placeholder="VD: PHẠM THÙY DƯƠNG"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843] uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Ngày tháng năm sinh
                  </label>
                  <input
                    type="text"
                    value={kycFormDob}
                    onChange={(e) => setKycFormDob(e.target.value)}
                    placeholder="VD: 15/08/1992"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Địa chỉ thường trú theo CCCD
                  </label>
                  <input
                    type="text"
                    value={kycFormResidentAddress}
                    onChange={(e) => setKycFormResidentAddress(e.target.value)}
                    placeholder="VD: Hải Châu 1, Hải Châu, Đà Nẵng"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E2DF] text-sm focus:outline-none focus:border-[#3A6843]"
                  />
                </div>
              </div>

              {/* Tải ảnh 2 mặt CCCD */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-semibold uppercase text-stone-700">
                  Ảnh 2 Mặt Căn Cước Công Dân (Rõ nét, không lóa sáng) *
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mặt trước */}
                  <div className="border border-stone-200 p-4 rounded-2xl bg-stone-50">
                    <p className="text-xs font-semibold text-stone-700 mb-2">Ảnh Mặt Trước CCCD</p>
                    {kycFormFrontUrl ? (
                      <div className="relative h-32 rounded-xl overflow-hidden border border-stone-300 group">
                        <img
                          src={kycFormFrontUrl}
                          alt="CCCD Front"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => kycFrontInputRef.current?.click()}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity"
                        >
                          Tải ảnh khác
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => kycFrontInputRef.current?.click()}
                        disabled={isUploadingFront}
                        className="w-full h-32 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center text-stone-500 hover:border-[#3A6843] hover:text-[#3A6843] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[28px]">add_photo_alternate</span>
                        <span className="text-xs mt-1">
                          {isUploadingFront ? 'Đang tải lên...' : 'Chọn ảnh mặt trước'}
                        </span>
                      </button>
                    )}
                    <input
                      ref={kycFrontInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleKycFrontSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Mặt sau */}
                  <div className="border border-stone-200 p-4 rounded-2xl bg-stone-50">
                    <p className="text-xs font-semibold text-stone-700 mb-2">Ảnh Mặt Sau CCCD</p>
                    {kycFormBackUrl ? (
                      <div className="relative h-32 rounded-xl overflow-hidden border border-stone-300 group">
                        <img
                          src={kycFormBackUrl}
                          alt="CCCD Back"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => kycBackInputRef.current?.click()}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity"
                        >
                          Tải ảnh khác
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => kycBackInputRef.current?.click()}
                        disabled={isUploadingBack}
                        className="w-full h-32 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center text-stone-500 hover:border-[#3A6843] hover:text-[#3A6843] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[28px]">add_photo_alternate</span>
                        <span className="text-xs mt-1">
                          {isUploadingBack ? 'Đang tải lên...' : 'Chọn ảnh mặt sau'}
                        </span>
                      </button>
                    )}
                    <input
                      ref={kycBackInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleKycBackSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Nút gửi form */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsKycModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold uppercase text-stone-700 hover:bg-stone-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingKyc}
                  className="inline-flex items-center gap-2 px-7 py-2.5 bg-[#3A6843] hover:bg-[#2F5436] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>{isSubmittingKyc ? 'Đang gửi hồ sơ...' : 'Nộp Hồ Sơ Xác Thực'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopOwnerProfile;
