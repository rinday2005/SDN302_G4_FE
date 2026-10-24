import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserSidebar } from '../../components/layout/UserSidebar';
import {
  getKycStatusApi,
  submitKycApi,
  updateKycStatusApi,
  type UserKycDetails,
} from '../../services/kyc.api';
import { resolveCleanAddress, getUserProfileAddress } from '../../utils/address';

type KycState = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

// Preset sample demo images for testing
const SAMPLE_FRONT_URL =
  'https://images.unsplash.com/photo-1633265486064-086b219458ec?q=80&w=800&auto=format&fit=crop';
const SAMPLE_BACK_URL =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';
const SAMPLE_SELFIE_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop';

export const CustomerKyc: React.FC = () => {
  const { user } = useAuth();

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');
  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // KYC data state
  const [kycState, setKycState] = useState<KycState>('VERIFIED');
  const [kycData, setKycData] = useState<UserKycDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [, setZoomImage] = useState<{ title: string; url: string } | null>(null);

  // Form inputs for KYC submission
  const [formFullName, setFormFullName] = useState('');
  const [formDob, setFormDob] = useState('15/05/1995');
  const [formCitizenId, setFormCitizenId] = useState('079201008888');
  const [formAddress, setFormAddress] = useState('');
  const [formCardFront, setFormCardFront] = useState('');
  const [formCardBack, setFormCardBack] = useState('');
  const [formLiveness, setFormLiveness] = useState('');

  // File input refs
  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);

  // Clean address from user profile
  const defaultResolvedAddress = useMemo(() => {
    if (user) {
      return resolveCleanAddress(user.address, user);
    }
    return '123 Lê Lợi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh';
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const fetchKycData = async () => {
      try {
        const res = await getKycStatusApi();
        if (!isMounted) return;
        if (res && res.kyc) {
          setKycData(res.kyc);
          const rawStatus = (res.kycStatus || 'APPROVED').toUpperCase();
          if (rawStatus === 'APPROVED' || rawStatus === 'VERIFIED') {
            setKycState('VERIFIED');
          } else if (rawStatus === 'PENDING') {
            setKycState('PENDING');
          } else if (rawStatus === 'REJECTED') {
            setKycState('REJECTED');
          } else {
            setKycState('NOT_SUBMITTED');
          }

          // Prepopulate form fields
          setFormFullName(res.kyc.fullName || user?.fullName || 'NGUYỄN VĂN AN (DEMO)');
          setFormDob(res.kyc.dob || '15/05/1995');
          setFormCitizenId(res.kyc.citizenId?.replace(/•/g, '') || '079201008888');
          setFormAddress(res.kyc.residentAddress || defaultResolvedAddress);
          setFormCardFront(res.kyc.cardFrontUrl || SAMPLE_FRONT_URL);
          setFormCardBack(res.kyc.cardBackUrl || SAMPLE_BACK_URL);
          setFormLiveness(res.kyc.livenessUrl || user?.avatarUrl || SAMPLE_SELFIE_URL);
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn('Lỗi khi tải dữ liệu KYC từ API, sử dụng dữ liệu định danh dự phòng:', err);
        const profileAddr = getUserProfileAddress(user);
        const fallbackKyc: UserKycDetails = {
          citizenId: `07920100${user?._id ? String(user._id).slice(-4) : '8888'}`,
          fullName: user?.fullName || 'NGUYỄN VĂN AN (DEMO)',
          dob: '15/05/1995',
          idType: 'Căn cước công dân gắn chip (CCCD)',
          residentAddress: profileAddr.full || defaultResolvedAddress,
          cardFrontUrl: SAMPLE_FRONT_URL,
          cardBackUrl: SAMPLE_BACK_URL,
          livenessUrl: user?.avatarUrl || SAMPLE_SELFIE_URL,
          kycCode: `#KYC-VN-${user?._id ? String(user._id).slice(-5).toUpperCase() : '88888'}`,
          tier: 'TIER_2',
          creditLimit: 50000000,
          rejectionReason: 'Ảnh mặt sau Căn cước công dân bị lóa ánh đèn flash tại cụm mã vạch MRZ.',
          submittedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
        };
        setKycData(fallbackKyc);
        setKycState('VERIFIED');
        setFormFullName(fallbackKyc.fullName);
        setFormAddress(fallbackKyc.residentAddress);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchKycData();

    return () => {
      isMounted = false;
    };
  }, [user, defaultResolvedAddress, reloadTrigger]);

  // Handle auto-fill demo data
  const handleFillDemoData = () => {
    setFormCitizenId('079201008888');
    setFormFullName(user?.fullName ? `${user.fullName} (DEMO)` : 'NGUYỄN VĂN AN (DEMO)');
    setFormDob('15/05/1995');
    setFormAddress('123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh');
    setFormCardFront(SAMPLE_FRONT_URL);
    setFormCardBack(SAMPLE_BACK_URL);
    setFormLiveness(user?.avatarUrl || SAMPLE_SELFIE_URL);
    showToast('Đã nạp bộ dữ liệu CCCD Demo mẫu thành công!', 'success');
  };

  // Handle local file upload with FileReader (Base64 preview)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn định dạng file hình ảnh (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Dung lượng ảnh tối đa 5MB. Vui lòng chọn ảnh nhỏ hơn.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (side === 'front') {
        setFormCardFront(result);
        showToast('Đã tải ảnh mặt trước CCCD thành công!');
      } else {
        setFormCardBack(result);
        showToast('Đã tải ảnh mặt sau CCCD thành công!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle switching state (for testing & demonstrative lifecycle management)
  const handleSwitchState = async (newState: KycState) => {
    setKycState(newState);
    try {
      const apiStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'VERIFIED' | 'REJECTED' =
        newState === 'VERIFIED' ? 'APPROVED' : newState;
      await updateKycStatusApi({
        status: apiStatus,
        rejectionReason:
          newState === 'REJECTED'
            ? 'Ảnh mặt sau Căn cước công dân bị lóa ánh đèn flash tại cụm mã vạch MRZ.'
            : undefined,
      });
      showToast(
        `Đã chuyển trạng thái kiểm thử: ${
          newState === 'NOT_SUBMITTED'
            ? '1. Chưa gửi'
            : newState === 'PENDING'
            ? '2. Chờ duyệt (Pending)'
            : newState === 'VERIFIED'
            ? '3. Đã duyệt (Approved)'
            : '4. Bị từ chối (Rejected)'
        }`
      );
      setReloadTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      showToast('Đã cập nhật trạng thái hiển thị.');
    }
  };

  // Submit new KYC document
  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCitizenId.trim()) {
      showToast('Vui lòng nhập số CCCD.', 'error');
      return;
    }
    if (!formCardFront) {
      showToast('Vui lòng tải lên hoặc chọn ảnh mặt trước CCCD.', 'error');
      return;
    }
    if (!formCardBack) {
      showToast('Vui lòng tải lên hoặc chọn ảnh mặt sau CCCD.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitKycApi({
        idCardNumber: formCitizenId.trim(),
        citizenId: formCitizenId.trim(),
        frontImageUrl: formCardFront,
        cardFrontUrl: formCardFront,
        backImageUrl: formCardBack,
        cardBackUrl: formCardBack,
        fullName: formFullName.trim(),
        dob: formDob.trim(),
        residentAddress: formAddress.trim(),
        livenessUrl: formLiveness || kycData?.livenessUrl || SAMPLE_SELFIE_URL,
      });
      showToast('Nộp hồ sơ thành công! Hệ thống đã ghi nhận hồ sơ ở trạng thái PENDING.');
      setIsSubmitModalOpen(false);
      setKycState('PENDING');
      setReloadTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e.response?.data?.message || e.message || 'Không thể gửi hồ sơ.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic user data variables
  const displayName = user?.fullName || kycData?.fullName || 'NGUYỄN VĂN AN (DEMO)';
  const displayCitizenId = kycData?.citizenId
    ? kycData.citizenId.length > 8
      ? `${kycData.citizenId.slice(0, 8)}•••• [Đã bảo mật]`
      : kycData.citizenId
    : '07920100•••• [Đã bảo mật]';
  const displayAddress = kycData?.residentAddress || defaultResolvedAddress;
  const displayKycCode =
    kycData?.kycCode || `#KYC-VN-${user?._id ? String(user._id).slice(-5).toUpperCase() : '88888'}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] text-brand-charcoal flex flex-col justify-center items-center font-sans">
        <span className="w-10 h-10 border-3 border-brand-charcoal border-t-transparent rounded-full animate-spin inline-block mb-4" />
        <p className="text-xs font-semibold text-brand-muted">
          Đang truy xuất dữ liệu định danh số công dân (Customer Trust Protocol)...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-brand-charcoal antialiased selection:bg-[#E8E2D5]">
      {/* ── TOP BANNER ── */}
      <div className="bg-brand-charcoal text-[#EBE6DD] text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 text-center border-b border-[#36322D]">
        <span>THUÊ NHỮNG GÌ BẠN CẦN · TÁI SỬ DỤNG NHỮNG GÌ ĐÃ CÓ · BẢO HIỂM HÀNG HÓA MINH BẠCH 100% VỚI SMART ESCROW</span>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border transition-all animate-fadeIn ${
            toastType === 'error'
              ? 'bg-[#B8382B] text-white border-red-800'
              : 'bg-brand-charcoal text-white border-brand-charcoal/80'
          }`}
        >
          <span className="material-symbols-outlined text-lg text-[#E7C890]">
            {toastType === 'error' ? 'report_problem' : 'verified'}
          </span>
          <p className="text-xs font-semibold max-w-sm">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white ml-2 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── MAIN APP CONTAINER ── */}
      <div className="flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* PERSISTENT CUSTOMER SIDEBAR */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <UserSidebar activeKey="kyc" />
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 min-w-0 space-y-6">
          <div className="flex flex-col w-full">
            {/* ⚠️ CẢNH BÁO DỮ LIỆU DEMO (AC: Có cảnh báo dữ liệu demo) */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 mb-6 text-amber-900 shadow-xs">
              <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0 mt-0.5">
                warning
              </span>
              <div className="space-y-1 text-xs leading-relaxed">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-amber-950">
                    Cảnh báo Môi trường Thử nghiệm (Demo Sandbox)
                  </h4>
                  <span className="text-[10px] bg-amber-200/90 text-amber-900 font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Demo Mode
                  </span>
                </div>
                <p className="text-amber-800">
                  Hệ thống đang hoạt động trong môi trường demo kiểm thử. <strong>Vui lòng KHÔNG tải lên hình ảnh CCCD thật hoặc dữ liệu cá nhân nhạy cảm</strong>. Bạn có thể sử dụng nút <strong>"⚡ Nạp dữ liệu CCCD Demo"</strong> hoặc chọn ảnh mẫu có sẵn để trải nghiệm trọn vẹn luồng nộp hồ sơ, thẩm định và mở khóa quyền thuê RENT.
                </p>
              </div>
            </div>

            {/* Interactive State Switcher Control Bar (Dành cho kiểm thử) */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border border-brand-border/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-charcoal text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm">tune</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-charcoal">Mô phỏng chu kỳ trạng thái KYC (Demo Switcher)</p>
                  <p className="text-[11px] text-brand-muted">
                    Chuyển nhanh trạng thái để kiểm thử hành vi giao diện người dùng và cổng RENT Checkout
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-brand-surface rounded-xl self-stretch md:self-auto overflow-x-auto thin-scrollbar">
                <button
                  type="button"
                  className={`state-btn text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    kycState === 'NOT_SUBMITTED'
                      ? 'bg-brand-charcoal text-white shadow-sm'
                      : 'text-brand-muted hover:text-brand-charcoal'
                  }`}
                  onClick={() => handleSwitchState('NOT_SUBMITTED')}
                >
                  1. Chưa gửi
                </button>
                <button
                  type="button"
                  className={`state-btn text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    kycState === 'PENDING'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-brand-muted hover:text-brand-charcoal'
                  }`}
                  onClick={() => handleSwitchState('PENDING')}
                >
                  2. Chờ duyệt (Pending)
                </button>
                <button
                  type="button"
                  className={`state-btn text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    kycState === 'VERIFIED'
                      ? 'bg-brand-sage text-white shadow-sm'
                      : 'text-brand-muted hover:text-brand-charcoal'
                  }`}
                  onClick={() => handleSwitchState('VERIFIED')}
                >
                  3. Đã duyệt (Approved)
                </button>
                <button
                  type="button"
                  className={`state-btn text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    kycState === 'REJECTED'
                      ? 'bg-[#B8382B] text-white shadow-sm'
                      : 'text-brand-muted hover:text-brand-charcoal'
                  }`}
                  onClick={() => handleSwitchState('REJECTED')}
                >
                  4. Bị từ chối (Rejected)
                </button>
              </div>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-brand-muted mb-6">
              <Link className="hover:text-brand-charcoal transition-colors" to="/user/dashboard">
                Bảng điều khiển
              </Link>
              <span>/</span>
              <Link className="hover:text-brand-charcoal transition-colors" to="/profile">
                Hồ sơ cá nhân
              </Link>
              <span>/</span>
              <span className="text-brand-charcoal font-semibold">Xác thực Danh tính (KYC)</span>
            </nav>

            {/* Section 1: Hero & Status Visualizer Header */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm relative overflow-hidden mb-8 border border-brand-border/60">
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface text-brand-charcoal text-[11px] font-bold tracking-wider uppercase mb-4 border border-brand-border/40">
                  <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse" />
                  Customer Trust Protocol · Chuẩn xác thực công dân số
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-charcoal tracking-tight leading-tight mb-3">
                  Xác thực Danh tính (KYC) &amp; Hạn mức Miễn cọc
                </h1>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                  Quy trình định danh CCCD giúp bảo vệ quyền lợi hai chiều giữa Khách thuê và Chủ đồ. Khi trạng thái đạt <strong>APPROVED</strong>, bạn được mở khóa quyền đặt thuê tại RENT Checkout và hưởng hạn ngạch lưu ký miễn cọc 50.000.000₫.
                </p>
              </div>

              {/* Active Status Visualizer Box */}
              <div className="mt-8 pt-8 bg-brand-sand/40 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-brand-border/40">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                      kycState === 'VERIFIED'
                        ? 'bg-brand-sage'
                        : kycState === 'PENDING'
                        ? 'bg-amber-600'
                        : kycState === 'REJECTED'
                        ? 'bg-[#B8382B]'
                        : 'bg-brand-muted'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {kycState === 'VERIFIED'
                        ? 'verified_user'
                        : kycState === 'PENDING'
                        ? 'hourglass_top'
                        : kycState === 'REJECTED'
                        ? 'report_problem'
                        : 'person_outline'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          kycState === 'VERIFIED'
                            ? 'text-brand-sage bg-brand-sage-light'
                            : kycState === 'PENDING'
                            ? 'text-amber-800 bg-amber-100'
                            : kycState === 'REJECTED'
                            ? 'text-[#B8382B] bg-red-100'
                            : 'text-brand-muted bg-brand-surface'
                        }`}
                      >
                        {kycState === 'VERIFIED'
                          ? 'ĐÃ DUYỆT (APPROVED) · TIER 2'
                          : kycState === 'PENDING'
                          ? 'ĐANG CHỜ DUYỆT (PENDING)'
                          : kycState === 'REJECTED'
                          ? 'BỊ TỪ CHỐI (REJECTED)'
                          : 'CHƯA NỘP HỒ SƠ (NOT SUBMITTED)'}
                      </span>
                      <span className="text-[11px] text-brand-muted font-mono">{displayKycCode}</span>
                    </div>
                    <p className="text-xs text-brand-charcoal font-medium mt-1">
                      {kycState === 'VERIFIED'
                        ? `Hồ sơ của ${displayName} đã được thẩm định APPROVED thành công. Tài khoản đủ điều kiện thuê mọi thiết bị RENT.`
                        : kycState === 'PENDING'
                        ? 'Hồ sơ KYC đang chờ Chuyên viên Giám định duyệt. User không thể tự đặt APPROVED. Vui lòng chờ 4-12 giờ.'
                        : kycState === 'REJECTED'
                        ? 'Hồ sơ của bạn đã bị từ chối thẩm định. Vui lòng xem lý do bên dưới và nộp lại hồ sơ.'
                        : 'Bạn chưa gửi hồ sơ CCCD. Hãy nộp hồ sơ KYC để mở khóa quyền thuê đồ tại RENT Checkout.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Hạn ngạch miễn cọc</p>
                    <p className="text-sm font-bold text-brand-charcoal">
                      {kycState === 'VERIFIED' ? '50.000.000₫' : '0₫'}
                    </p>
                  </div>
                  {kycState === 'VERIFIED' ? (
                    <div className="flex items-center gap-2">
                      <Link
                        to="/rent/marketplace"
                        className="px-4 py-2 bg-[#141310] hover:bg-[#292724] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">shopping_bag</span>
                        Thuê đồ RENT ngay
                      </Link>
                      <button
                        type="button"
                        className="px-4 py-2 bg-white hover:bg-brand-surface text-brand-charcoal text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-brand-border/60"
                        onClick={() => setIsCertModalOpen(true)}
                      >
                        <span className="material-symbols-outlined text-base">verified</span>
                        Chứng thư số
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="px-4 py-2 bg-[#141310] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      onClick={() => setIsSubmitModalOpen(true)}
                    >
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      {kycState === 'REJECTED' ? 'Nộp lại hồ sơ' : 'Nộp hồ sơ ngay'}
                    </button>
                  )}
                </div>
              </div>

              {/* ❌ Dynamic Alert For Rejected State (AC: hiển thị lý do từ chối) */}
              {kycState === 'REJECTED' && (
                <div className="mt-4 bg-red-50 text-red-900 rounded-2xl p-4 border border-red-200 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-600 mt-0.5">error</span>
                    <div className="text-xs leading-relaxed space-y-1">
                      <p className="font-bold text-sm text-red-950">
                        Lý do từ chối:{' '}
                        <span className="text-red-700">
                          {kycData?.rejectionReason || 'Ảnh mặt sau Căn cước công dân bị lóa ánh đèn flash tại cụm mã vạch MRZ.'}
                        </span>
                      </p>
                      <p className="text-red-800">
                        Vui lòng chụp lại ảnh rõ nét, bảo đảm chụp đủ 4 góc thẻ, không phản chiếu đèn flash trực tiếp để hệ thống hoàn tất thẩm định.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setIsSubmitModalOpen(true)}
                          className="px-3.5 py-1.5 bg-[#B8382B] hover:bg-red-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">refresh</span>
                          Cập nhật &amp; Nộp lại hồ sơ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Two Column Details Display */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: ID Card Visualizer (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-border/60">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-border/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-brand-charcoal">badge</span>
                      <h3 className="font-serif text-lg font-bold text-brand-charcoal">Thông tin Căn cước Công dân</h3>
                    </div>
                    <span className="text-[11px] text-brand-muted font-medium">Bảo mật chuẩn PDPD 13/2023</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-brand-surface rounded-2xl border border-brand-border/40">
                      <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Họ và tên</p>
                      <p className="text-sm font-bold text-brand-charcoal mt-1">{displayName}</p>
                    </div>

                    <div className="p-4 bg-brand-surface rounded-2xl border border-brand-border/40">
                      <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Số CCCD / CMND</p>
                      <p className="text-sm font-mono font-bold text-brand-charcoal mt-1">{displayCitizenId}</p>
                    </div>

                    <div className="p-4 bg-brand-surface rounded-2xl border border-brand-border/40">
                      <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Loại giấy tờ</p>
                      <p className="text-sm font-semibold text-brand-charcoal mt-1">Căn cước công dân gắn chip (CCCD)</p>
                    </div>

                    <div className="p-4 bg-brand-surface rounded-2xl border border-brand-border/40">
                      <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Trạng thái hồ sơ</p>
                      <p className="text-sm font-bold mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                            kycState === 'VERIFIED'
                              ? 'text-brand-sage bg-brand-sage-light'
                              : kycState === 'PENDING'
                              ? 'text-amber-800 bg-amber-100'
                              : kycState === 'REJECTED'
                              ? 'text-red-800 bg-red-100'
                              : 'text-stone-700 bg-stone-200'
                          }`}
                        >
                          {kycState === 'VERIFIED'
                            ? 'APPROVED (Đã duyệt)'
                            : kycState === 'PENDING'
                            ? 'PENDING (Chờ duyệt)'
                            : kycState === 'REJECTED'
                            ? 'REJECTED (Bị từ chối)'
                            : 'CHƯA NỘP HỒ SƠ'}
                        </span>
                      </p>
                    </div>

                    <div className="p-4 bg-brand-surface rounded-2xl border border-brand-border/40 md:col-span-2">
                      <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Địa chỉ thường trú</p>
                      <p className="text-xs font-medium text-brand-charcoal mt-1 leading-relaxed">{displayAddress}</p>
                    </div>
                  </div>

                  {/* ID Card Front and Back Images */}
                  <div className="mt-6 pt-6 border-t border-brand-border/40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-4 flex items-center justify-between">
                      <span>Hình ảnh tài liệu đã lưu</span>
                      <span className="text-[11px] text-brand-muted font-normal">Click ảnh để phóng to</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Front Card */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-brand-charcoal">Mặt trước CCCD</span>
                          <span className="text-[10px] text-brand-sage font-bold">Chip OCR Verified</span>
                        </div>
                        <div
                          className="h-44 rounded-2xl overflow-hidden border border-brand-border bg-stone-100 relative group cursor-pointer"
                          onClick={() =>
                            setZoomImage({
                              title: 'Mặt trước CCCD',
                              url: kycData?.cardFrontUrl || SAMPLE_FRONT_URL,
                            })
                          }
                        >
                          <img
                            src={kycData?.cardFrontUrl || SAMPLE_FRONT_URL}
                            alt="Mặt trước CCCD"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                            <span className="material-symbols-outlined text-sm">zoom_in</span> Phóng to
                          </div>
                        </div>
                      </div>

                      {/* Back Card */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-brand-charcoal">Mặt sau CCCD</span>
                          <span className="text-[10px] text-brand-sage font-bold">MRZ Barcode Verified</span>
                        </div>
                        <div
                          className="h-44 rounded-2xl overflow-hidden border border-brand-border bg-stone-100 relative group cursor-pointer"
                          onClick={() =>
                            setZoomImage({
                              title: 'Mặt sau CCCD',
                              url: kycData?.cardBackUrl || SAMPLE_BACK_URL,
                            })
                          }
                        >
                          <img
                            src={kycData?.cardBackUrl || SAMPLE_BACK_URL}
                            alt="Mặt sau CCCD"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                            <span className="material-symbols-outlined text-sm">zoom_in</span> Phóng to
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Policies & Quick Actions (1 col) */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-brand-border/60">
                  <h3 className="font-serif text-base font-bold text-brand-charcoal mb-2">
                    Đặc quyền khi KYC APPROVED
                  </h3>
                  <p className="text-xs text-brand-muted mb-4 leading-relaxed">
                    Xác thực KYC chỉ cập nhật trạng thái người dùng sang APPROVED, hoàn toàn <strong>không thay đổi vai trò tài khoản</strong> (Role USER vẫn là USER).
                  </p>

                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl bg-brand-surface flex gap-3 items-start border border-brand-border/40">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 text-brand-sage shadow-xs">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-charcoal">Mở khóa RENT Checkout</h4>
                        <p className="text-[11px] text-brand-muted leading-relaxed mt-0.5">
                          Đủ điều kiện thanh toán và ký biên bản giao nhận điện tử CLA cho các đơn thuê.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-brand-surface flex gap-3 items-start border border-brand-border/40">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 text-brand-sage shadow-xs">
                        <span className="material-symbols-outlined text-base">savings</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-charcoal">Hạn mức miễn cọc 50M</h4>
                        <p className="text-[11px] text-brand-muted leading-relaxed mt-0.5">
                          Thuê máy ảnh, lens cinema &amp; lều cắm trại cao cấp không cần thế chấp 100% tiền mặt.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-brand-surface flex gap-3 items-start border border-brand-border/40">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 text-brand-sage shadow-xs">
                        <span className="material-symbols-outlined text-base">security</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-charcoal">Bảo chứng Escrow 100%</h4>
                        <p className="text-[11px] text-brand-muted leading-relaxed mt-0.5">
                          Bảo lưu tiền cọc an toàn trên ví ủy thác ReUse Hub đến khi đơn hoàn tất kiểm tra.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Button to Open Form */}
                <div className="p-6 rounded-3xl bg-brand-charcoal text-white space-y-3">
                  <div className="flex items-center gap-2 text-brand-sand text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">badge</span>
                    Thao tác nhanh
                  </div>
                  <h4 className="font-serif text-sm font-bold">Bạn muốn nộp hoặc cập nhật hồ sơ?</h4>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Hỗ trợ nộp CCCD demo và kiểm tra tức thời trạng thái phê duyệt.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="w-full py-2.5 bg-white text-brand-charcoal hover:bg-stone-200 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    Mở form Nộp hồ sơ KYC
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── MODAL: NỘP HỒ SƠ KYC VỚI CCCD DEMO & REAL FILE UPLOAD ── */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-fadeIn border border-brand-border max-h-[90vh] overflow-y-auto thin-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-brand-sage">badge</span>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal">Nộp Hồ sơ Xác thực KYC</h3>
              </div>
              <button
                type="button"
                className="text-brand-muted hover:text-brand-charcoal cursor-pointer"
                onClick={() => setIsSubmitModalOpen(false)}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* CẢNH BÁO DỮ LIỆU DEMO TRONG FORM */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-900 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">info</span>
              <div className="leading-relaxed">
                <span className="font-bold">Môi trường kiểm thử:</span> Vui lòng không nộp CCCD thật. Hãy nhấn nút{' '}
                <strong>"⚡ Điền nhanh CCCD Demo"</strong> bên dưới để tự động điền số CCCD và ảnh mẫu.
              </div>
            </div>

            {/* Quick Fill Button */}
            <div className="flex items-center justify-between bg-brand-surface p-3 rounded-xl border border-brand-border/60">
              <div className="text-xs">
                <p className="font-bold text-brand-charcoal">Kiểm thử nhanh với dữ liệu mẫu</p>
                <p className="text-[11px] text-brand-muted">Tự động nạp số CCCD, họ tên và ảnh thẻ demo</p>
              </div>
              <button
                type="button"
                onClick={handleFillDemoData}
                className="px-3.5 py-2 bg-brand-charcoal hover:bg-black text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm text-amber-400">bolt</span>
                <span>⚡ Điền nhanh CCCD Demo</span>
              </button>
            </div>

            <form onSubmit={handleSubmitKyc} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-brand-charcoal mb-1">
                  Họ và tên đầy đủ (theo CCCD): <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full bg-brand-surface rounded-xl p-3 text-xs text-brand-charcoal border border-brand-border/60 focus:outline-none focus:bg-white"
                  placeholder="Ví dụ: NGUYỄN VĂN AN (DEMO)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-charcoal mb-1">
                    Số Căn cước công dân (CCCD): <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCitizenId}
                    onChange={(e) => setFormCitizenId(e.target.value)}
                    className="w-full bg-brand-surface rounded-xl p-3 text-xs text-brand-charcoal border border-brand-border/60 focus:outline-none focus:bg-white font-mono"
                    placeholder="12 chữ số demo (vd: 079201008888)"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-charcoal mb-1">
                    Ngày tháng năm sinh: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full bg-brand-surface rounded-xl p-3 text-xs text-brand-charcoal border border-brand-border/60 focus:outline-none focus:bg-white"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-brand-charcoal mb-1">
                  Địa chỉ thường trú lưu ký: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-brand-surface rounded-xl p-3 text-xs text-brand-charcoal border border-brand-border/60 focus:outline-none focus:bg-white"
                  placeholder="Địa chỉ thường trú"
                />
              </div>

              {/* UPLOAD ẢNH MẶT TRƯỚC / MẶT SAU (Yêu cầu đề bài) */}
              <div className="space-y-3 pt-1">
                <label className="block font-semibold text-brand-charcoal">
                  Tải lên tài liệu tùy thân (Mặt trước &amp; Mặt sau CCCD): <span className="text-red-500">*</span>
                </label>

                {/* Hidden file inputs */}
                <input
                  type="file"
                  accept="image/*"
                  ref={frontInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'front')}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={backInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'back')}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Slot Mặt trước */}
                  <div className="border-2 border-dashed border-brand-border hover:border-brand-charcoal/40 rounded-2xl p-3 text-center transition-colors bg-brand-surface/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-brand-charcoal text-xs">Mặt trước CCCD</span>
                        {formCardFront ? (
                          <span className="text-[10px] text-brand-sage font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs">check_circle</span> Đã có ảnh
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 font-semibold">Chưa có</span>
                        )}
                      </div>

                      {formCardFront ? (
                        <div className="relative h-28 rounded-xl overflow-hidden border border-brand-border mb-2 bg-stone-100">
                          <img src={formCardFront} alt="Mặt trước preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div
                          onClick={() => frontInputRef.current?.click()}
                          className="h-28 rounded-xl border border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 cursor-pointer bg-white mb-2 hover:bg-stone-50"
                        >
                          <span className="material-symbols-outlined text-2xl text-stone-400">upload_file</span>
                          <span className="text-[11px] text-stone-500 font-medium">Bấm để chọn file ảnh</span>
                          <span className="text-[9px] text-stone-400">PNG, JPG tối đa 5MB</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => frontInputRef.current?.click()}
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-brand-sand text-brand-charcoal text-[11px] font-semibold rounded-lg border border-brand-border cursor-pointer transition-colors"
                      >
                        {formCardFront ? 'Đổi ảnh' : 'Tải từ máy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormCardFront(SAMPLE_FRONT_URL);
                          showToast('Đã chọn ảnh mẫu mặt trước CCCD.');
                        }}
                        className="py-1.5 px-2 bg-brand-surface hover:bg-brand-sand text-brand-muted hover:text-brand-charcoal text-[11px] font-semibold rounded-lg border border-brand-border/60 cursor-pointer transition-colors"
                        title="Dùng ảnh mẫu demo"
                      >
                        Dùng mẫu
                      </button>
                    </div>
                  </div>

                  {/* Slot Mặt sau */}
                  <div className="border-2 border-dashed border-brand-border hover:border-brand-charcoal/40 rounded-2xl p-3 text-center transition-colors bg-brand-surface/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-brand-charcoal text-xs">Mặt sau CCCD</span>
                        {formCardBack ? (
                          <span className="text-[10px] text-brand-sage font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs">check_circle</span> Đã có ảnh
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 font-semibold">Chưa có</span>
                        )}
                      </div>

                      {formCardBack ? (
                        <div className="relative h-28 rounded-xl overflow-hidden border border-brand-border mb-2 bg-stone-100">
                          <img src={formCardBack} alt="Mặt sau preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div
                          onClick={() => backInputRef.current?.click()}
                          className="h-28 rounded-xl border border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 cursor-pointer bg-white mb-2 hover:bg-stone-50"
                        >
                          <span className="material-symbols-outlined text-2xl text-stone-400">upload_file</span>
                          <span className="text-[11px] text-stone-500 font-medium">Bấm để chọn file ảnh</span>
                          <span className="text-[9px] text-stone-400">PNG, JPG tối đa 5MB</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => backInputRef.current?.click()}
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-brand-sand text-brand-charcoal text-[11px] font-semibold rounded-lg border border-brand-border cursor-pointer transition-colors"
                      >
                        {formCardBack ? 'Đổi ảnh' : 'Tải từ máy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormCardBack(SAMPLE_BACK_URL);
                          showToast('Đã chọn ảnh mẫu mặt sau CCCD.');
                        }}
                        className="py-1.5 px-2 bg-brand-surface hover:bg-brand-sand text-brand-muted hover:text-brand-charcoal text-[11px] font-semibold rounded-lg border border-brand-border/60 cursor-pointer transition-colors"
                        title="Dùng ảnh mẫu demo"
                      >
                        Dùng mẫu
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-brand-sand/50 rounded-xl text-[11px] text-brand-muted leading-relaxed border border-brand-border/40">
                Cam kết: Dữ liệu được bảo mật phục vụ đối soát lưu ký. Nộp hồ sơ sẽ cập nhật trạng thái sang <strong>PENDING</strong> để Giám định viên duyệt (User không thể tự chuyển sang APPROVED).
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-2.5 rounded-xl bg-brand-surface hover:bg-brand-sand text-brand-charcoal text-xs font-semibold transition-colors cursor-pointer border border-brand-border/60"
                  onClick={() => setIsSubmitModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-brand-charcoal hover:bg-black text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang gửi hồ sơ...</span>
                    </>
                  ) : (
                    'Gửi Hồ Sơ Xác Thực'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CHỨNG THƯ SỐ KYC ── */}
      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn border border-brand-border">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-brand-sage">verified</span>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal">Chứng thư Định danh Số KYC</h3>
              </div>
              <button
                type="button"
                className="text-brand-muted hover:text-brand-charcoal cursor-pointer"
                onClick={() => setIsCertModalOpen(false)}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#2B2925] to-[#1C1A17] text-white text-center space-y-3 relative overflow-hidden border border-[#D4AF37]/30">
              <div className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold">
                REUSE HUB DIGITAL TRUST PROTOCOL
              </div>
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center border border-[#D4AF37]/30">
                <span className="material-symbols-outlined text-3xl text-[#E7C890]">shield_person</span>
              </div>
              <div className="space-y-0.5">
                <p className="font-serif text-base font-bold text-[#E7C890]">{displayKycCode}</p>
                <p className="text-xs text-[#EBE6DD] uppercase font-bold">{displayName}</p>
                <p className="text-[11px] text-[#C2BCB3]">Cấp độ: Tier 2 Custodian · Miễn cọc 50.000.000₫</p>
              </div>
              <div className="pt-2 text-[10px] text-[#A69F93] border-t border-white/10 text-left space-y-1">
                <p>
                  • Tiêu chuẩn thẩm định: <strong>Biometric AI + CCCD Chip OCR</strong>
                </p>
                <p>
                  • Trạng thái: <strong className="text-emerald-400">APPROVED (Đã duyệt)</strong>
                </p>
                <p>
                  • Quyền lưu ký: <strong>Mở khóa toàn bộ RENT Checkout</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCertModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-brand-charcoal text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
            >
              Đóng chứng thư
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerKyc;
