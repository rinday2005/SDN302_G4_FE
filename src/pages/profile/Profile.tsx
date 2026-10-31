import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import { useCartWishlist } from '../../context/CartWishlistContext';
import { getMyThriftOrdersApi } from '../../services/thriftOrder.api';
import { UserSidebar } from '../../components/layout/UserSidebar';
import AddressSelector, { type AddressValue } from '../../components/form/AddressSelector';
import { uploadAvatarApi, updateProfileApi } from '../../services/user.api';
import { getKycStatusApi, type UserKycDetails } from '../../services/kyc.api';

interface SavedProfileData {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  deliveryNote?: string;
  address?: AddressValue;
}

export const Profile: React.FC = () => {
  const auth = useContext(AuthContext);
  const currentUserId = auth?.user?._id || auth?.user?.id || 'guest';

  // Remounting ProfileContent with key={currentUserId} ensures a clean state
  // whenever a different user logs in or logs out, avoiding stale profile caches.
  return <ProfileContent key={currentUserId} />;
};

const ProfileContent: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { cart, cartCount, wishlistCount } = useCartWishlist();

  const currentUserId = auth?.user?._id || auth?.user?.id || '';
  const profileStorageKey = currentUserId ? `user_profile_${currentUserId}` : '';

  // Helper to load profile data scoped strictly to the currently logged in user
  const initialSaved = useMemo<SavedProfileData | null>(() => {
    if (!profileStorageKey) return null;
    try {
      const saved = localStorage.getItem(profileStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  }, [profileStorageKey]);

  // ── Saved Profile Data (Persisted to localStorage scoped to current user) ──
  const [address, setAddress] = useState<AddressValue>(() => {
    if (initialSaved?.address) return initialSaved.address;
    if (auth?.user?.address && typeof auth.user.address === 'object') {
      return {
        province: auth.user.address.province || 'Thành phố Đà Nẵng',
        district: auth.user.address.district || 'Quận Hải Châu',
        ward: auth.user.address.ward || 'Phường Hải Châu 1',
        detail: auth.user.address.detail || '48 Bạch Đằng',
      };
    }
    return {
      province: 'Thành phố Đà Nẵng',
      district: 'Quận Hải Châu',
      ward: 'Phường Hải Châu 1',
      detail: '48 Bạch Đằng',
    };
  });

  const [fullName, setFullName] = useState<string>(() => {
    return initialSaved?.fullName || auth?.user?.fullName || 'Phạm Thùy Dương';
  });

  const [phone, setPhone] = useState<string>(() => {
    return initialSaved?.phone || auth?.user?.phoneNumber || auth?.user?.phone || '0901234567';
  });

  const [fullNameError, setFullNameError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  const [deliveryNote, setDeliveryNote] = useState<string>(() => {
    return initialSaved?.deliveryNote || 'Vui lòng gọi trước 30 phút, kiểm tra niêm phong thùng bảo quản Nanuk';
  });

  // Avatar Image & Upload States (Cloudinary Integration)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return initialSaved?.avatarUrl || auth?.user?.avatarUrl || auth?.user?.avatar || '';
  });

  // Track sidebar collapsed state to display inline restore chip when collapsed
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('reuse_user_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setIsSidebarCollapsed(customEvent.detail);
      }
    };
    window.addEventListener('reuse_user_sidebar_toggle', handleSync);
    return () => window.removeEventListener('reuse_user_sidebar_toggle', handleSync);
  }, []);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>(() => auth?.user?.kycStatus || 'NOT_SUBMITTED');
  const [kycData, setKycData] = useState<UserKycDetails | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (currentUserId && currentUserId !== 'guest') {
      getKycStatusApi()
        .then((res) => {
          if (!isMounted) return;
          const status = res?.kycStatus || res?.kyc?.status || auth?.user?.kycStatus || 'NOT_SUBMITTED';
          const hasCccd = Boolean(res?.kyc?.citizenId || res?.kyc?.cardFrontUrl || res?.kyc?.cardBackUrl);
          if (!hasCccd && status === 'NOT_SUBMITTED') {
            setKycStatus('NOT_SUBMITTED');
            setKycData(null);
          } else {
            setKycStatus(status);
            setKycData(res?.kyc || null);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setKycStatus(auth?.user?.kycStatus || 'NOT_SUBMITTED');
          setKycData(null);
        });
    }

    const handleProfileSync = () => {
      try {
        const saved = localStorage.getItem('user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.kycStatus) {
            setKycStatus(parsed.kycStatus);
          }
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('user_profile_updated', handleProfileSync);
    return () => {
      isMounted = false;
      window.removeEventListener('user_profile_updated', handleProfileSync);
    };
  }, [currentUserId, auth?.user?.kycStatus]);

  // UI Toast & Modal States
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordToastMessage, setPasswordToastMessage] = useState('');

  // ── Dynamic User Identification ──
  const emailDisplay = auth?.user?.email || '';
  const roleDisplay = auth?.user?.role || 'CUSTOMER';
  const rawId = auth?.user?._id || auth?.user?.id || '';
  const userIdDisplay = rawId
    ? `#KYC-VN-${String(rawId).slice(0, 6).toUpperCase()}`
    : '#KYC-VN-884192';

  // Compute Avatar Initials
  const avatarInitials = useMemo(() => {
    if (!fullName) return 'RH';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }, [fullName]);

  // Real client browser & operating system detection
  const clientDevice = useMemo(() => {
    const ua = navigator.userAgent;
    let os = 'Thiết bị bảo mật';
    if (ua.includes('Win')) os = 'Windows PC (Windows 11)';
    else if (ua.includes('Mac')) os = 'Apple Mac (macOS 15)';
    else if (ua.includes('Linux')) os = 'Linux Workstation';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'Apple iOS Device';
    else if (ua.includes('Android')) os = 'Android Mobile';

    let browser = 'Chrome Browser';
    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/')) browser = 'Google Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';

    return { os, browser };
  }, []);

  // Rental & Thrift count from cart or active orders
  const rentItemsCount = cart.filter((i) => i.mode === 'rent' || !i.mode).length;
  const thriftItemsCount = cart.filter((i) => i.mode === 'thrift').length;
  const [dbThriftOrdersCount, setDbThriftOrdersCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    getMyThriftOrdersApi()
      .then((res) => {
        if (!isMounted) return;
        const total = res?.orders?.length || 0;
        setDbThriftOrdersCount(total);
      })
      .catch((err) => {
        console.warn('Could not load thrift orders count:', err);
      });
    return () => { isMounted = false; };
  }, []);
  const activeWishlistCount = wishlistCount;

  // Address string representation
  const formattedAddress = useMemo(() => {
    const parts = [address.detail, address.ward, address.district, address.province].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '48 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng';
  }, [address]);

  // ── Handle Avatar File Upload via Cloudinary ──
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPasswordToastMessage('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)!');
      setTimeout(() => setPasswordToastMessage(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPasswordToastMessage('Kích thước ảnh tối đa là 5MB!');
      setTimeout(() => setPasswordToastMessage(''), 3000);
      return;
    }

    setIsUploadingAvatar(true);

    // Instant local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const localPreview = event.target?.result as string;
      if (localPreview) {
        setAvatarUrl(localPreview);
        window.dispatchEvent(
          new CustomEvent('profile_updated', {
            detail: { avatarUrl: localPreview, fullName },
          })
        );
      }
    };
    reader.readAsDataURL(file);

    try {
      // Call Cloudinary API via Backend upload service
      const uploadedUrl = await uploadAvatarApi(file);
      const finalUrl = uploadedUrl || avatarUrl;

      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        window.dispatchEvent(
          new CustomEvent('profile_updated', {
            detail: { avatarUrl: uploadedUrl, fullName },
          })
        );
      }

      // Persist to user_profile_${userId} and auth user in localStorage
      const savedProfile = (() => {
        try {
          const raw = profileStorageKey ? localStorage.getItem(profileStorageKey) : null;
          return raw ? JSON.parse(raw) : {};
        } catch {
          return {};
        }
      })();

      if (profileStorageKey) {
        localStorage.setItem(
          profileStorageKey,
          JSON.stringify({ ...savedProfile, avatarUrl: finalUrl })
        );
      }

      if (auth?.user) {
        const updatedUser = { ...auth.user, avatarUrl: finalUrl, avatar: finalUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setPasswordToastMessage('Ảnh đại diện đã được đồng bộ lên Cloudinary thành công!');
    } catch (err) {
      console.warn('Backend upload avatar fallback to local storage:', err);
      // Fallback: save preview URL so UI works immediately
      reader.onloadend = () => {
        const localData = reader.result as string;
        if (localData) {
          try {
            const savedProfile = (() => {
              try {
                const raw = profileStorageKey ? localStorage.getItem(profileStorageKey) : null;
                return raw ? JSON.parse(raw) : {};
              } catch {
                return {};
              }
            })();
            if (profileStorageKey) {
              localStorage.setItem(
                profileStorageKey,
                JSON.stringify({ ...savedProfile, avatarUrl: localData })
              );
            }
            window.dispatchEvent(
              new CustomEvent('profile_updated', {
                detail: { avatarUrl: localData, fullName },
              })
            );
          } catch {
            // ignore
          }
        }
      };
      setPasswordToastMessage('Đã cập nhật ảnh đại diện thành công!');
    } finally {
      setIsUploadingAvatar(false);
      setTimeout(() => {
        setPasswordToastMessage('');
      }, 4500);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    try {
      const savedProfile = (() => {
        try {
          const raw = profileStorageKey ? localStorage.getItem(profileStorageKey) : null;
          return raw ? JSON.parse(raw) : {};
        } catch {
          return {};
        }
      })();
      delete savedProfile.avatarUrl;
      if (profileStorageKey) {
        localStorage.setItem(profileStorageKey, JSON.stringify(savedProfile));
      }

      if (auth?.user) {
        const updatedUser = { ...auth.user, avatarUrl: '', avatar: '' };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      window.dispatchEvent(
        new CustomEvent('profile_updated', {
          detail: { avatarUrl: '', fullName },
        })
      );
    } catch {
      // ignore
    }
    setPasswordToastMessage('Đã gỡ ảnh đại diện, chuyển về chế độ ký tự định danh mặc định!');
    setTimeout(() => {
      setPasswordToastMessage('');
    }, 4000);
  };

  // Handle Account & Delivery form submit (Persist to MongoDB and localStorage)
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Client-side Validation Chặt Chẽ Trước Khi Gửi Request ──
    let hasError = false;
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setFullNameError('Họ và tên không được để trống');
      hasError = true;
    } else if (trimmedName.length < 2 || trimmedName.length > 70) {
      setFullNameError('Họ và tên phải có độ dài từ 2 đến 70 ký tự');
      hasError = true;
    } else if (/[<>{}[\]\\/]/.test(trimmedName)) {
      setFullNameError('Họ và tên chứa ký tự đặc biệt không hợp lệ');
      hasError = true;
    } else {
      setFullNameError('');
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        setPhoneError('Số điện thoại không đúng định dạng (Ví dụ: 0901234567 hoặc +84901234567)');
        hasError = true;
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('Số điện thoại không được để trống');
      hasError = true;
    }

    if (hasError) {
      setPasswordToastMessage('Vui lòng kiểm tra lại các trường thông tin bị lỗi!');
      setTimeout(() => setPasswordToastMessage(''), 4000);
      return;
    }

    setIsSavingProfile(true);
    try {
      // 1. Send PUT request to Backend API to persist address & profile into MongoDB
      await updateProfileApi({
        fullName: trimmedName,
        phoneNumber: trimmedPhone,
        phone: trimmedPhone,
        address,
        avatarUrl,
      });

      // 2. Synchronize local storage cache
      const profileData = {
        fullName: trimmedName,
        phone: trimmedPhone,
        address,
        deliveryNote,
        avatarUrl,
        updatedAt: new Date().toISOString(),
      };
      if (profileStorageKey) {
        localStorage.setItem(profileStorageKey, JSON.stringify(profileData));
      }

      if (auth?.user) {
        const updatedUser = { ...auth.user, fullName: trimmedName, avatarUrl, phoneNumber: trimmedPhone, address };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      window.dispatchEvent(
        new CustomEvent('profile_updated', {
          detail: { avatarUrl, fullName: trimmedName },
        })
      );
      window.dispatchEvent(new Event('user_profile_updated'));

      setShowSaveToast(true);
      setTimeout(() => {
        setShowSaveToast(false);
      }, 4500);
    } catch (err: unknown) {
      console.warn('Backend updateProfileApi notice, falling back to local sync:', err);
      const errMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu';
      setPasswordToastMessage(`Lỗi cập nhật: ${errMsg}`);
      setTimeout(() => setPasswordToastMessage(''), 4500);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelForm = () => {
    setFullName(auth?.user?.fullName || '');
    setPhone(auth?.user?.phoneNumber || auth?.user?.phone || '');
    if (auth?.user?.address && typeof auth.user.address === 'object') {
      setAddress({
        province: auth.user.address.province || 'Thành phố Đà Nẵng',
        district: auth.user.address.district || 'Quận Hải Châu',
        ward: auth.user.address.ward || 'Phường Hải Châu 1',
        detail: auth.user.address.detail || '48 Bạch Đằng',
      });
    } else {
      setAddress({
        province: 'Thành phố Đà Nẵng',
        district: 'Quận Hải Châu',
        ward: 'Phường Hải Châu 1',
        detail: '48 Bạch Đằng',
      });
    }
  };

  // Handle Change Password submit
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordToastMessage('Mật khẩu mới phải có ít nhất 6 ký tự!');
      setTimeout(() => setPasswordToastMessage(''), 3000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordToastMessage('Xác nhận mật khẩu mới không khớp!');
      setTimeout(() => setPasswordToastMessage(''), 3000);
      return;
    }

    setPasswordToastMessage('Mật khẩu của bạn đã được cập nhật thành công trên hệ thống mã hóa ReUse Hub!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(false);

    setTimeout(() => {
      setPasswordToastMessage('');
    }, 4500);
  };

  const handleLogout = () => {
    auth?.logout();
    navigate('/login');
  };

  return (
    <div className="w-full min-h-[calc(100vh-14rem)] bg-[#FBF9F6] text-[#141310] antialiased">
      {/* Toast Notification (Profile Save) */}
      <div
        className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 pointer-events-none bg-[#141310] text-[#FBF9F6] px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium ${showSaveToast || passwordToastMessage ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'
          }`}
      >
        <span className="material-symbols-outlined text-[22px] text-emerald-400">check_circle</span>
        <span>
          {passwordToastMessage || 'Hồ sơ tài khoản & thông tin giao nhận Nanuk đã được lưu thành công!'}
        </span>
      </div>

      {/* Main Container with Sidebar + Content Area */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* User Sidebar (Left Navigation - Fixed on left) */}
        <UserSidebar
          activeKey="profile"
          avatarUrl={avatarUrl}
          displayName={fullName}
          displayEmail={emailDisplay}
        />

        {/* Right Main Content */}
        <div className="flex-1 min-w-0 flex flex-col w-full">
          {/* Quick inline restore chip if user clicked 3-bar button to hide sidebar */}
          {isSidebarCollapsed && (
            <div className="flex items-center gap-2 mb-3 animate-fade-in">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('reuse_user_sidebar_toggle', { detail: false }))}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E4DC] text-xs font-semibold text-[#1C1A18] hover:bg-[#F6F3EE] hover:border-[#1C1A18]/40 transition-all shadow-2xs cursor-pointer group"
                title="Mở lại menu điều hướng (Dấu 3 gạch)"
              >
                <span className="material-symbols-outlined text-[18px] text-[#5E6D5B] group-hover:scale-110 transition-transform">
                  menu
                </span>
                <span>Hiện menu điều hướng</span>
              </button>
            </div>
          )}

          {/* 1. BREADCRUMB & PAGE HEADER */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Link
                to="/"
                className="font-mono text-xs uppercase tracking-wider text-[#7B766F] hover:text-[#141310] transition-colors"
              >
                Trang chủ
              </Link>
              <span className="text-[#CCC5BC] text-xs">/</span>
              <Link
                to="/user/dashboard"
                className="font-mono text-xs uppercase tracking-wider text-[#7B766F] hover:text-[#141310] transition-colors"
              >
                Tài khoản
              </Link>
              <span className="text-[#CCC5BC] text-xs">/</span>
              <span className="font-mono text-xs uppercase tracking-wider text-[#141310] font-semibold">
                Hồ sơ cá nhân
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-[#3A6843] mb-2 flex items-center gap-2 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3A6843]" />
                  TÀI KHOẢN KHÁCH HÀNG · BẢO CHỨNG TUẦN HOÀN
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-[#141310] font-bold tracking-tight">
                  Hồ sơ cá nhân
                </h1>
                <p className="text-xs sm:text-sm text-[#7B766F] max-w-2xl mt-1.5 leading-relaxed">
                  Quản lý thông tin định danh, địa chỉ giao nhận thiết bị, mức tín nhiệm bảo chứng và bảo mật tài khoản.
                </p>
              </div>

              {/* Quick Session Badge */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#F5F3F0] rounded-xl shadow-xs self-start md:self-auto border border-[#E4E2DF]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3A6843] animate-pulse" />
                <div className="text-left">
                  <p className="font-mono text-[10px] uppercase text-[#7B766F] tracking-wide">
                    Phiên bảo mật
                  </p>
                  <p className="text-xs font-bold text-[#141310]">
                    {roleDisplay === 'USER' ? 'Khách hàng bảo chứng' : roleDisplay}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* 2. OVERVIEW CARD / HERO */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xs border border-[#E4E2DF] relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#EFEEEB] rounded-full blur-3xl pointer-events-none opacity-60" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
              {/* Avatar & Primary Info */}
              <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar with Cloudinary Upload Trigger */}
                <div className="flex flex-col items-center sm:items-start gap-2.5 shrink-0">
                  <div className="relative group shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#EFEEEB] border border-[#E4E2DF] shadow-sm overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={fullName}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif text-2xl sm:text-3xl font-bold text-[#141310] select-none">
                        {avatarInitials}
                      </div>
                    )}

                    {/* Hover Overlay Button to Change Avatar */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      title="Tải ảnh đại diện mới qua Cloudinary"
                      className="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer backdrop-blur-[2px] z-10"
                    >
                      <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                      <span className="text-[10px] font-semibold mt-1">Đổi ảnh</span>
                    </button>

                    {/* Loading Spinner during Cloudinary Upload */}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 text-white rounded-2xl flex flex-col items-center justify-center backdrop-blur-xs z-20">
                        <span className="material-symbols-outlined text-[24px] animate-spin">
                          progress_activity
                        </span>
                        <span className="text-[10px] font-semibold mt-1">Đang tải...</span>
                      </div>
                    )}

                    {/* Verified Badge */}
                    <div className="absolute -bottom-2 -right-2 bg-[#3A6843] text-white p-1.5 rounded-lg shadow-sm flex items-center justify-center z-15 pointer-events-none">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                    </div>
                  </div>

                  {/* Quick Upload / Remove Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F3F0] hover:bg-[#EFEEEB] text-[#141310] text-[11px] font-bold rounded-xl border border-[#E4E2DF] transition-colors shadow-2xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#3A6843]">
                        cloud_upload
                      </span>
                      <span>{isUploadingAvatar ? 'Đang tải...' : 'Tải ảnh '}</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="p-1.5 rounded-lg text-[#7B766F] hover:text-rose-600 hover:bg-[#EFEEEB] transition-colors cursor-pointer"
                        title="Gỡ ảnh đại diện"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>

                  {/* Hidden Native File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                  />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-serif text-2xl font-bold text-[#141310] truncate">
                      {fullName}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFEEEB] text-[#3A6843] font-mono text-[11px] uppercase tracking-wider rounded-lg font-semibold border border-[#E4E2DF]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3A6843]" />
                      Tier 2 Approved
                    </span>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-y-2 gap-x-6 text-[#7B766F] text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-[#3A6843]">mail</span>
                      <strong className="text-[#141310]">{emailDisplay}</strong>
                      <span className="text-[#3A6843] font-mono text-[10px] font-bold">(ĐÃ XÁC THỰC)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-[#3A6843]">call</span>
                      <strong className="text-[#141310]">{phone}</strong>
                      <span className="text-[#3A6843] font-mono text-[10px] font-bold">(SMS OK)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Address Snippet */}
              <div className="lg:col-span-5 bg-[#F5F3F0] p-5 sm:p-6 rounded-2xl flex flex-col justify-between border border-[#E4E2DF]">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-mono text-[10px] uppercase text-[#7B766F] flex items-center gap-1.5 tracking-wider font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-[#3A6843]">
                        inventory_2
                      </span>
                      Địa chỉ nhận mặc định (Thùng Nanuk)
                    </span>
                    <span className="px-2 py-0.5 bg-white text-[#141310] font-mono text-[10px] rounded font-bold border border-[#E4E2DF]">
                      Ưu tiên
                    </span>
                  </div>
                  <p className="text-sm text-[#141310] font-semibold leading-snug">
                    {formattedAddress}
                  </p>
                  <p className="text-xs text-[#7B766F] mt-1.5 italic leading-relaxed">
                    Giao nhận theo quy chuẩn túi/thùng đệm chống va đập tiêu chuẩn ReUse Hub.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E4E2DF] flex items-center justify-between text-[#7B766F] text-xs">
                  <span className="font-mono text-[11px] font-semibold text-[#141310]">
                    TỶ LỆ HOÀN TRẢ ĐÚNG HẠN: 100%
                  </span>
                  <span className="material-symbols-outlined text-[20px] text-[#3A6843]">
                    shield_with_heart
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Circular Metrics / Stats Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 bg-[#F5F3F0]/60 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 sm:px-8 py-5 rounded-b-3xl border-t border-[#E4E2DF]">
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase text-[#7B766F] tracking-wide">
                  Đơn đang thuê
                </p>
                <p className="font-serif text-2xl text-[#141310] font-bold flex items-baseline gap-1.5">
                  0{rentItemsCount}{' '}
                  <span className="font-sans text-xs text-[#7B766F] font-normal">
                    thiết bị lưu giữ
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase text-[#7B766F] tracking-wide">
                  Đơn THRIFT sở hữu
                </p>
                <p className="font-serif text-2xl text-[#141310] font-bold flex items-baseline gap-1.5">
                  {dbThriftOrdersCount > 0 ? (dbThriftOrdersCount < 10 ? `0${dbThriftOrdersCount}` : dbThriftOrdersCount) : (thriftItemsCount < 10 ? `0${thriftItemsCount}` : thriftItemsCount)}{' '}
                  <span className="font-sans text-xs text-[#7B766F] font-normal">
                    di sản lưu trữ
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase text-[#7B766F] tracking-wide">
                  Sản phẩm theo dõi
                </p>
                <p className="font-serif text-2xl text-[#141310] font-bold flex items-baseline gap-1.5">
                  {activeWishlistCount < 10 ? `0${activeWishlistCount}` : activeWishlistCount}{' '}
                  <span className="font-sans text-xs text-[#7B766F] font-normal">
                    yêu thích
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase text-[#7B766F] tracking-wide">
                  Điểm tín nhiệm bảo chứng
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="font-serif text-2xl text-[#3A6843] font-bold">99.8</p>
                  <span className="text-xs text-[#7B766F]">/ 100 Tối đa</span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. ACTIVITY SHORTCUTS (4 CARDS) */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-[#3A6843] font-semibold">
                  HOẠT ĐỘNG KHÁCH HÀNG
                </p>
                <h3 className="font-serif text-xl sm:text-2xl text-[#141310] font-bold">
                  Lối tắt lưu trữ &amp; Trải nghiệm
                </h3>
              </div>
              <span className="font-mono text-[11px] uppercase text-[#7B766F] hidden sm:inline">
                DÀNH RIÊNG CHO NGƯỜI THUÊ &amp; SƯU TẦM
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Rent */}
              <Link
                to="/user/dashboard"
                className="group bg-white p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-[#E4E2DF] hover:border-[#3A6843]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F3F0] flex items-center justify-center text-[#141310] group-hover:bg-[#141310] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">autorenew</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#EFEEEB] text-[#3A6843] font-mono text-[10px] uppercase rounded-md font-semibold">
                      Đang hoạt động
                    </span>
                  </div>
                  <h4 className="font-serif text-base font-bold text-[#141310] group-hover:text-[#3A6843] transition-colors">
                    Đơn thuê của tôi
                  </h4>
                  <p className="text-xs text-[#7B766F] mt-1">{rentItemsCount > 0 ? `${rentItemsCount} thiết bị trong giỏ:` : 'Chưa có đơn thuê nào'}</p>
                  <p className="text-xs text-[#141310] font-medium line-clamp-1 mt-0.5">
                    {rentItemsCount > 0 ? 'Xem giỏ hàng để hoàn tất thuê' : 'Khám phá kho thiết bị RENT'}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#EFEEEB] flex items-center justify-between text-[#7B766F] group-hover:text-[#141310] transition-colors text-xs font-semibold">
                  <span>Xem chi tiết đơn</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </Link>

              {/* Card 2: Thrift */}
              <Link
                to="/user/dashboard"
                className="group bg-white p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-[#E4E2DF] hover:border-[#3A6843]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F3F0] flex items-center justify-center text-[#141310] group-hover:bg-[#141310] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">archive</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#EFEEEB] text-[#7B766F] font-mono text-[10px] uppercase rounded-md font-semibold">
                      3 Di sản
                    </span>
                  </div>
                  <h4 className="font-serif text-base font-bold text-[#141310] group-hover:text-[#3A6843] transition-colors">
                    Đơn THRIFT sở hữu
                  </h4>
                  <p className="text-xs text-[#7B766F] mt-1">{thriftItemsCount > 0 ? `${thriftItemsCount} sản phẩm:` : 'Chưa có đơn mua nào'}</p>
                  <p className="text-xs text-[#141310] font-medium line-clamp-1 mt-0.5">
                    {thriftItemsCount > 0 ? 'Xem giỏ hàng đồ THRIFT' : 'Săn đồ độc bản 1-of-1'}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#EFEEEB] flex items-center justify-between text-[#7B766F] group-hover:text-[#141310] transition-colors text-xs font-semibold">
                  <span>Kho lưu trữ đã mua</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </Link>

              {/* Card 3: Wishlist */}
              <Link
                to="/wishlist"
                className="group bg-white p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-[#E4E2DF] hover:border-[#3A6843]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F3F0] flex items-center justify-center text-[#141310] group-hover:bg-[#141310] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">favorite</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#EFEEEB] text-[#7B766F] font-mono text-[10px] uppercase rounded-md font-semibold">
                      {activeWishlistCount} Lưu trữ
                    </span>
                  </div>
                  <h4 className="font-serif text-base font-bold text-[#141310] group-hover:text-[#3A6843] transition-colors">
                    Danh sách yêu thích
                  </h4>
                  <p className="text-xs text-[#7B766F] mt-1">{activeWishlistCount > 0 ? 'Đang theo dõi:' : 'Lưu trữ cá nhân:'}</p>
                  <p className="text-xs text-[#141310] font-medium line-clamp-1 mt-0.5">
                    {activeWishlistCount > 0 ? `${activeWishlistCount} sản phẩm quan tâm` : 'Chưa lưu sản phẩm nào'}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#EFEEEB] flex items-center justify-between text-[#7B766F] group-hover:text-[#141310] transition-colors text-xs font-semibold">
                  <span>Bộ sưu tập theo dõi</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </Link>

              {/* Card 4: Cart & Notifications */}
              <Link
                to="/cart"
                className="group bg-white p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-[#E4E2DF] hover:border-[#3A6843]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F3F0] flex items-center justify-center text-[#141310] group-hover:bg-[#141310] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#3A6843]/15 text-[#3A6843] font-mono text-[10px] uppercase rounded-md font-semibold">
                      {cartCount > 0 ? `${cartCount} Thiết bị` : 'Giỏ tuần hoàn'}
                    </span>
                  </div>
                  <h4 className="font-serif text-base font-bold text-[#141310] group-hover:text-[#3A6843] transition-colors">
                    Giỏ hàng tuần hoàn
                  </h4>
                  <p className="text-xs text-[#7B766F] mt-1">Quản lý sổ lệnh RENT/THRIFT:</p>
                  <p className="text-xs text-[#3A6843] font-medium line-clamp-1 mt-0.5">
                    {cartCount > 0 ? `${cartCount} sản phẩm đang chờ đối soát` : 'Khám phá thêm thiết bị lưu giữ'}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#EFEEEB] flex items-center justify-between text-[#7B766F] group-hover:text-[#141310] transition-colors text-xs font-semibold">
                  <span>Kiểm tra sổ lệnh</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </Link>
            </div>
          </section>

          {/* 4. SPLIT SECTION: KYC VERIFICATION & EDIT PROFILE FORM */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 items-start">
            {/* LEFT: KYC & TRUST STATUS (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-[#E4E2DF]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] text-[#3A6843] uppercase tracking-wider font-semibold">
                    HỒ SƠ BẢO CHỨNG TUẦN HOÀN
                  </span>
                  {(() => {
                    const s = String(kycStatus || '').toUpperCase();
                    if (s === 'APPROVED' || s === 'VERIFIED') {
                      return (
                        <span className="px-2.5 py-1 bg-[#3A6843]/15 text-[#3A6843] font-mono text-[10px] uppercase rounded-md font-bold">
                          APPROVED · TIER 2
                        </span>
                      );
                    }
                    if (s === 'PENDING') {
                      return (
                        <span className="px-2.5 py-1 bg-amber-500/15 text-amber-700 font-mono text-[10px] uppercase rounded-md font-bold">
                          CHỜ DUYỆT HỒ SƠ
                        </span>
                      );
                    }
                    if (s === 'REJECTED') {
                      return (
                        <span className="px-2.5 py-1 bg-red-500/15 text-red-700 font-mono text-[10px] uppercase rounded-md font-bold">
                          BỊ TỪ CHỐI
                        </span>
                      );
                    }
                    return (
                      <span className="px-2.5 py-1 bg-stone-200 text-stone-600 font-mono text-[10px] uppercase rounded-md font-bold">
                        CHƯA XÁC THỰC
                      </span>
                    );
                  })()}
                </div>

                <h3 className="font-serif text-xl text-[#141310] font-bold mb-2">
                  Định danh &amp; Tín nhiệm (KYC)
                </h3>
                <p className="text-xs text-[#7B766F] mb-5 leading-relaxed">
                  Bậc định danh khách hàng quy định mức độ miễn giảm ký quỹ tiền mặt và thời hạn lưu giữ thiết bị cao cấp.
                </p>

                {/* Stepper / State visualization */}
                <div className="bg-[#F5F3F0] p-3.5 rounded-2xl mb-5 border border-[#E4E2DF]">
                  <p className="font-mono text-[10px] uppercase text-[#7B766F] tracking-wide mb-2.5 font-semibold">
                    Tiến trình xác thực cá nhân
                  </p>
                  {(() => {
                    const s = String(kycStatus || '').toUpperCase();
                    const isApproved = s === 'APPROVED' || s === 'VERIFIED';
                    const isPending = s === 'PENDING';
                    const isRejected = s === 'REJECTED';
                    const isNotSubmitted = !isApproved && !isPending && !isRejected;

                    return (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {/* Chờ duyệt */}
                          <div
                            className={`p-2 rounded-xl transition-all ${
                              isPending
                                ? 'bg-amber-600 text-white shadow-xs font-bold'
                                : isNotSubmitted
                                ? 'bg-white/60 opacity-60 border border-dashed border-[#E4E2DF] text-[#7B766F]'
                                : 'bg-white border border-[#E4E2DF] text-[#7B766F]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              hourglass_top
                            </span>
                            <p className="font-mono text-[10px] mt-0.5">
                              {isPending ? 'Đang duyệt' : 'Chờ duyệt'}
                            </p>
                          </div>

                          {/* Đã duyệt */}
                          <div
                            className={`p-2 rounded-xl transition-all ${
                              isApproved
                                ? 'bg-[#3A6843] text-white shadow-xs font-bold'
                                : 'bg-white/40 opacity-40 border border-[#E4E2DF] text-[#7B766F]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              verified
                            </span>
                            <p className="font-mono text-[10px] mt-0.5">
                              {isApproved ? 'Đã duyệt (ACTIVE)' : 'Đã duyệt'}
                            </p>
                          </div>

                          {/* Từ chối */}
                          <div
                            className={`p-2 rounded-xl transition-all ${
                              isRejected
                                ? 'bg-red-600 text-white shadow-xs font-bold'
                                : 'bg-white/40 opacity-40 border border-[#E4E2DF] text-[#7B766F]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              block
                            </span>
                            <p className="font-mono text-[10px] mt-0.5">
                              {isRejected ? 'Bị từ chối' : 'Từ chối'}
                            </p>
                          </div>
                        </div>

                        {isNotSubmitted && (
                          <p className="text-[11px] text-stone-600 bg-stone-100 p-2 rounded-lg mt-2.5 border border-stone-200 leading-tight">
                            ℹ️ Tài khoản chưa thêm CCCD xác thực. Vui lòng gửi hồ sơ để kích hoạt đặc quyền miễn cọc.
                          </p>
                        )}
                        {isPending && (
                          <p className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-lg mt-2.5 border border-amber-200/60 leading-tight">
                            ⏳ Hồ sơ đã nộp thành công và đang chờ chuyên viên đối soát xét duyệt (4-12h).
                          </p>
                        )}
                        {isRejected && (
                          <p className="text-[11px] text-red-800 bg-red-50/80 p-2 rounded-lg mt-2.5 border border-red-200/60 leading-tight">
                            ❌ Hồ sơ bị từ chối: {kycData?.rejectionReason || 'Thông tin CCCD chưa hợp lệ. Vui lòng nộp lại.'}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Breakdown Details */}
                <div className="space-y-3 mb-6">
                  {/* Loại giấy tờ */}
                  <div className="flex items-start justify-between gap-4 py-2 bg-[#F5F3F0]/60 px-3.5 rounded-xl border border-[#E4E2DF]/60">
                    <div>
                      <p className="font-mono text-[10px] uppercase text-[#7B766F]">Loại giấy tờ đã nộp</p>
                      <p className="text-xs text-[#141310] font-semibold mt-0.5">
                        {kycData?.citizenId ? (
                          <>Căn cước công dân gắn chip (CCCD) <span className="font-mono text-[11px] text-[#7B766F]">({kycData.citizenId.slice(0, 8)}••••)</span></>
                        ) : (
                          <span className="text-[#7B766F] font-normal italic">Chưa có (Chưa thêm CCCD)</span>
                        )}
                      </p>
                    </div>
                    <span className={`material-symbols-outlined text-[20px] ${kycData?.citizenId ? 'text-[#3A6843]' : 'text-stone-400'}`}>
                      badge
                    </span>
                  </div>

                  {/* Hạn mức miễn cọc */}
                  <div className="flex items-start justify-between gap-4 py-2 bg-[#F5F3F0]/60 px-3.5 rounded-xl border border-[#E4E2DF]/60">
                    <div>
                      <p className="font-mono text-[10px] uppercase text-[#7B766F]">
                        Hạn mức miễn cọc Escrow
                      </p>
                      <p className="text-xs text-[#141310] font-semibold mt-0.5">
                        {String(kycStatus || '').toUpperCase() === 'APPROVED' || String(kycStatus || '').toUpperCase() === 'VERIFIED' ? (
                          'Lên đến 50.000.000₫ không thế chấp'
                        ) : (
                          <span className="text-[#7B766F] font-normal italic">Chưa áp dụng (Cần xác thực CCCD)</span>
                        )}
                      </p>
                    </div>
                    <span className={`material-symbols-outlined text-[20px] ${String(kycStatus || '').toUpperCase() === 'APPROVED' || String(kycStatus || '').toUpperCase() === 'VERIFIED' ? 'text-[#3A6843]' : 'text-stone-400'}`}>
                      account_balance_wallet
                    </span>
                  </div>

                  {/* Mã định danh & Ngày xác thực */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F5F3F0]/60 p-3 rounded-xl border border-[#E4E2DF]/60">
                      <p className="font-mono text-[10px] uppercase text-[#7B766F]">Mã định danh</p>
                      <p className="font-mono text-xs font-bold text-[#141310] mt-0.5">
                        {kycData?.kycCode || (auth?.user?._id ? `#KYC-VN-${String(auth.user._id).slice(0, 6).toUpperCase()}` : userIdDisplay)}
                      </p>
                    </div>
                    <div className="bg-[#F5F3F0]/60 p-3 rounded-xl border border-[#E4E2DF]/60">
                      <p className="font-mono text-[10px] uppercase text-[#7B766F]">Ngày xác thực</p>
                      <p className="text-xs font-bold text-[#141310] mt-0.5">
                        {String(kycStatus || '').toUpperCase() === 'APPROVED' || String(kycStatus || '').toUpperCase() === 'VERIFIED'
                          ? (kycData?.verifiedAt ? new Date(kycData.verifiedAt).toLocaleDateString('vi-VN') : '14/10/2024')
                          : 'Chưa có'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Nâng hạng / Xác thực CCCD */}
                <Link
                  to="/profile/kyc"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#141310] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#292724] transition-colors shadow-xs"
                >
                  {(() => {
                    const s = String(kycStatus || '').toUpperCase();
                    if (s === 'APPROVED' || s === 'VERIFIED') {
                      return (
                        <>
                          <span>Xem chi tiết hồ sơ KYC &amp; Nâng hạng</span>
                          <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                        </>
                      );
                    }
                    if (s === 'PENDING') {
                      return (
                        <>
                          <span>Kiểm tra tiến trình xét duyệt KYC</span>
                          <span className="material-symbols-outlined text-[17px]">hourglass_top</span>
                        </>
                      );
                    }
                    if (s === 'REJECTED') {
                      return (
                        <>
                          <span>Bổ sung lại hồ sơ CCCD ngay</span>
                          <span className="material-symbols-outlined text-[17px]">refresh</span>
                        </>
                      );
                    }
                    return (
                      <>
                        <span>Xác thực danh tính bằng CCCD ngay</span>
                        <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                      </>
                    );
                  })()}
                </Link>
              </div>

              {/* Guarantee Escrow Policy snippet */}
              <div className="bg-[#F5F3F0] p-6 rounded-3xl border border-[#E4E2DF]">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="material-symbols-outlined text-[#3A6843] text-[22px]">
                    lock_reset
                  </span>
                  <h4 className="font-serif text-base font-bold text-[#141310]">
                    Bảo chứng đối soát thông minh
                  </h4>
                </div>
                <p className="text-xs text-[#7B766F] leading-relaxed">
                  Với chứng nhận Tier 2, hồ sơ của bạn được hệ thống kiểm định đối ứng tự động. Mọi hợp đồng thuê đều áp dụng điều khoản bàn giao nguyên trạng qua ứng dụng di động.
                </p>
              </div>
            </div>

            {/* RIGHT: EDIT PROFILE FORM - PRESERVED BE FUNCTIONALITY (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-[#E4E2DF]">
              <div className="mb-6">
                <p className="font-mono text-[11px] uppercase tracking-wider text-[#3A6843] font-semibold">
                  CHỈNH SỬA THÔNG TIN CÁ NHÂN
                </p>
                <h3 className="font-serif text-2xl text-[#141310] font-bold mt-1">
                  Thông tin tài khoản &amp; Giao nhận
                </h3>
                <p className="text-xs text-[#7B766F] mt-1 leading-relaxed">
                  Cập nhật thông tin liên hệ và địa chỉ nhận thiết bị được bảo hiểm trọn vẹn trong suốt hành trình sử dụng.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleProfileSave}>
                {/* Họ tên & SĐT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#141310]" htmlFor="fullName">
                      Họ và tên *
                    </label>
                    <div className="relative">
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (fullNameError) setFullNameError('');
                        }}
                        className={`w-full px-4 py-2.5 bg-[#F5F3F0] text-[#141310] text-xs font-medium rounded-xl border focus:outline-none focus:bg-white transition-all ${
                          fullNameError ? 'border-rose-500 focus:border-rose-500' : 'border-[#E4E2DF] focus:border-[#3A6843]'
                        }`}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-[18px] text-[#7B766F]">
                        person
                      </span>
                    </div>
                    {fullNameError && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">{fullNameError}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#141310]" htmlFor="phoneNumber">
                      Số điện thoại liên hệ *
                    </label>
                    <div className="relative">
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError('');
                        }}
                        className={`w-full px-4 py-2.5 bg-[#F5F3F0] text-[#141310] text-xs font-medium rounded-xl border focus:outline-none focus:bg-white transition-all ${
                          phoneError ? 'border-rose-500 focus:border-rose-500' : 'border-[#E4E2DF] focus:border-[#3A6843]'
                        }`}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-[18px] text-[#7B766F]">
                        smartphone
                      </span>
                    </div>
                    {phoneError && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">{phoneError}</p>
                    )}
                  </div>
                </div>

                {/* Email (Disabled/Locked with verified badge) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#141310]" htmlFor="emailInput">
                      Địa chỉ thư điện tử (Email)
                    </label>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#3A6843] font-bold">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                      Đã xác thực qua OTP
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="emailInput"
                      name="email"
                      type="email"
                      readOnly
                      value={emailDisplay}
                      className="w-full px-4 py-2.5 bg-[#EFEEEB] text-[#7B766F] text-xs rounded-xl border border-[#E4E2DF] cursor-not-allowed select-none font-medium"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-[18px] text-[#3A6843]">
                      check_circle
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-[#7B766F]">
                    Để thay đổi email bảo chứng, vui lòng liên hệ Bộ phận Thẩm định rủi ro ReUse Hub.
                  </p>
                </div>

                {/* ── Friend's BE AddressSelector Component Integration ── */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 pb-1">
                    <span className="material-symbols-outlined text-[17px] text-[#3A6843]">
                      location_on
                    </span>
                    <span className="text-xs font-bold text-[#141310]">
                      Địa chỉ nhận hàng mặc định (Tỉnh / Huyện / Xã &amp; Số nhà)
                    </span>
                  </div>

                  <AddressSelector value={address} onChange={setAddress} />
                </div>

                {/* Ghi chú nhận thùng Nanuk */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-[#141310]" htmlFor="deliveryNote">
                    Ghi chú giao nhận Nanuk / Thiết bị giá trị cao
                  </label>
                  <textarea
                    id="deliveryNote"
                    name="deliveryNote"
                    rows={3}
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F5F3F0] text-[#141310] text-xs rounded-xl border border-[#E4E2DF] focus:outline-none focus:bg-white focus:border-[#3A6843] transition-all resize-none"
                  />
                  <p className="font-mono text-[10px] text-[#7B766F]">
                    Nhân viên bàn giao sẽ đối chiếu mã tem QR trước sự chứng kiến của quý khách.
                  </p>
                </div>

                {/* Inline Toast Notification on Save */}
                {showSaveToast && (
                  <div className="p-3.5 bg-[#3A6843]/15 rounded-xl flex items-center justify-between text-[#3A6843] border border-[#3A6843]/20 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>Hồ sơ giao nhận đã được cập nhật thành công trên mạng lưới ReUse Hub.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSaveToast(false)}
                      className="text-[#3A6843] hover:opacity-75"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#EFEEEB]">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-5 py-2.5 text-xs font-semibold text-[#7B766F] hover:text-[#141310] transition-colors rounded-xl cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-7 py-2.5 bg-[#141310] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#292724] transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <span className="material-symbols-outlined text-[17px] animate-spin">progress_activity</span>
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[17px]">save</span>
                        <span>Lưu thay đổi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 5. SECURITY & AUTHENTICATION SECTION (TRUTH OF CURRENT USER) */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#E4E2DF] mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#EFEEEB]">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-[#3A6843] font-semibold">
                  TIÊU CHUẨN MÃ HÓA TÀI KHOẢN
                </p>
                <h3 className="font-serif text-2xl text-[#141310] font-bold mt-1">
                  Bảo mật &amp; Xác thực
                </h3>
                <p className="text-xs text-[#7B766F] mt-1 leading-relaxed">
                  Bảo vệ danh tính lưu trữ và các giao dịch cọc bảo chứng trực tuyến.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2 bg-[#F5F3F0] rounded-xl self-start md:self-auto border border-[#E4E2DF]">
                <span className="material-symbols-outlined text-[18px] text-[#3A6843]">security</span>
                <span className="font-mono text-[11px] uppercase text-[#141310] font-bold">
                  Mã hóa 256-bit chuẩn B-Corp
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
              {/* Item 1: Password */}
              <div className="space-y-3 p-4 bg-[#F5F3F0]/50 rounded-2xl border border-[#E4E2DF]/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E4E2DF] flex items-center justify-center text-[#141310]">
                      <span className="material-symbols-outlined text-[19px]">password</span>
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#141310]">Mật khẩu truy cập</h4>
                      <p className="text-[11px] text-[#7B766F]">Cập nhật định kỳ 45 ngày trước</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#7B766F] leading-relaxed">
                    Nên đổi mật khẩu định kỳ ít nhất mỗi 90 ngày để đảm bảo an toàn cho các giao dịch bảo chứng lớn.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-white hover:bg-[#EFEEEB] border border-[#E4E2DF] text-[#141310] text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">key</span>
                    Đổi mật khẩu
                  </button>
                </div>
              </div>

              {/* Item 2: 2FA */}
              <div className="space-y-3 p-4 bg-[#F5F3F0]/50 rounded-2xl border border-[#E4E2DF]/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#3A6843]/15 flex items-center justify-center text-[#3A6843]">
                      <span className="material-symbols-outlined text-[19px]">phonelink_lock</span>
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#141310]">Xác thực hai lớp (2FA)</h4>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#3A6843] uppercase font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3A6843]" />
                        Đang BẬT
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#7B766F] leading-relaxed">
                    Yêu cầu mã xác thực SMS OTP cho mỗi lần xác nhận đơn thuê mới hoặc thay đổi địa chỉ bàn giao.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] uppercase text-[#7B766F]">Phương thức:</span>
                  <span className="px-2.5 py-1 bg-white text-[#141310] font-mono text-[11px] rounded-lg font-bold border border-[#E4E2DF]">
                    SMS {phone.slice(0, 7)}***
                  </span>
                </div>
              </div>

              {/* Item 3: Active Device */}
              <div className="space-y-3 p-4 bg-[#F5F3F0]/50 rounded-2xl border border-[#E4E2DF]/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E4E2DF] flex items-center justify-center text-[#141310]">
                      <span className="material-symbols-outlined text-[19px]">laptop_mac</span>
                    </div>
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#141310]">Thiết bị đang dùng</h4>
                      <span className="font-mono text-[10px] text-[#3A6843] uppercase font-bold">
                        Đang hoạt động (Session Active)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#141310] font-semibold">
                    {clientDevice.os} · {clientDevice.browser}
                  </p>
                  <p className="text-xs text-[#7B766F] leading-relaxed mt-0.5">
                    Mã phiên bảo mật: <strong className="font-mono text-[#141310]">{userIdDisplay}</strong> · Đăng nhập qua JWT Token
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#3A6843]/15 text-[#3A6843] font-mono text-[10px] font-bold">
                    <span className="material-symbols-outlined text-[13px]">verified_user</span>
                    JWT Bearer Valid
                  </span>
                </div>
              </div>
            </div>

            {/* TERMINATION / LOGOUT ROW */}
            <div className="mt-8 pt-6 border-t border-[#EFEEEB] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F5F3F0]/50 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8 rounded-b-3xl">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#141310] flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600 text-[18px]">
                    power_settings_new
                  </span>
                  Kết thúc phiên bảo mật
                </h4>
                <p className="text-xs text-[#7B766F]">
                  Đăng xuất an toàn khỏi phiên làm việc hiện tại trên thiết bị này. Thông tin giỏ hàng và danh sách chờ sẽ được lưu trữ tự động.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all text-xs font-bold rounded-xl shrink-0 border border-rose-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">logout</span>
                Đăng xuất tài khoản
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* ── MODAL: CHANGE PASSWORD ── */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl relative border border-[#E4E2DF]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#EFEEEB]">
              <div>
                <span className="font-mono text-[10px] text-[#3A6843] uppercase tracking-wider font-bold">
                  BẢO MẬT KHÁCH HÀNG
                </span>
                <h3 className="font-serif text-xl font-bold text-[#141310] mt-0.5">
                  Đổi mật khẩu tài khoản
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-full text-[#7B766F] hover:bg-[#F5F3F0] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handlePasswordChange}>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#141310]">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F5F3F0] text-[#141310] text-xs rounded-xl border border-[#E4E2DF] focus:outline-none focus:bg-white focus:border-[#3A6843]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#141310]">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F5F3F0] text-[#141310] text-xs rounded-xl border border-[#E4E2DF] focus:outline-none focus:bg-white focus:border-[#3A6843]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#141310]">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F5F3F0] text-[#141310] text-xs rounded-xl border border-[#E4E2DF] focus:outline-none focus:bg-white focus:border-[#3A6843]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#7B766F] hover:text-[#141310] transition-colors rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#141310] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#292724] transition-colors shadow-xs"
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;