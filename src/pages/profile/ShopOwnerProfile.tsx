import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const ShopOwnerProfile: React.FC = () => {
  // State for Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; caption: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditModalOpen(false);
        setIsKycModalOpen(false);
        setLightboxImg(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Form states for Atelier Profile
  const [shopName, setShopName] = useState('Atelier Chronos & Optics Ltd.');
  const [ownerName, setOwnerName] = useState('Vũ Thanh Tùng');
  const [roleTitle, setRoleTitle] = useState('Master Curator & Archival Custodian');
  const [primaryEmail, setPrimaryEmail] = useState('tung.vu@kyoto-optics.vn');
  const [secondaryEmail, setSecondaryEmail] = useState('contact@atelier-chronos.vn');
  const [phoneNumber, setPhoneNumber] = useState('+84 912 345 678');
  const [addressLine, setAddressLine] = useState('742 Evergreen Terrace, Atelier Suite 4B');
  const [cityRegion, setCityRegion] = useState('Ho Chi Minh City / Da Nang Vault Node, Vietnam');
  const [specialization, setSpecialization] = useState(
    'Vintage 35mm & Medium Format Optics (Leica M, Hasselblad V-System, Contax Zeiss T*), high-precision horological CLA benchmark servicing, optical collimation, and verified high-value circular rental fleets.'
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`Đã sao chép ${label}: ${text}`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditModalOpen(false);
    showToast('Hồ sơ xưởng lưu ký đã được cập nhật thành công!');
  };

  return (
    <div className="w-full bg-[#fdf9f2] text-[#1c1c18] min-h-[calc(100vh-5rem)] font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-[#141310] text-[#fdf9f2] shadow-2xl border border-[#dddad3] animate-bounce-subtle">
          <span className="material-symbols-outlined text-[#d8e3ce] text-[20px]">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Editorial Breadcrumb & Cryptographic Session Strip */}
      <section className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 pt-6 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#4a463f]">
            <Link to="/shop/dashboard" className="hover:text-[#141310] transition-colors flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[15px]">warehouse</span>
              <span>Shop</span>
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-[#7b766f]">Account</span>
            <span className="opacity-40">/</span>
            <span className="text-[#141310] font-semibold">Shop Owner Profile (/profile)</span>
          </nav>

          {/* Authenticated Session Pin */}
          <div
            onClick={() => copyToClipboard('VNC-8820-AUTH', 'Mã phiên mã hóa')}
            className="inline-flex items-center gap-2 px-3 py-1 bg-[#f1ede6] hover:bg-[#ebe8e1] cursor-pointer rounded text-[#4a463f] text-xs font-mono transition-colors"
            title="Nhấp để sao chép mã phiên"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#576151] animate-pulse"></span>
            <span className="tracking-widest">CRYPTOGRAPHIC SESSION #VNC-8820-AUTH</span>
            <span className="material-symbols-outlined text-[14px] text-[#7b766f]">content_copy</span>
          </div>
        </div>
      </section>

      {/* Identity Hero / Dossier Header */}
      <section className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 mb-10">
        <div className="relative bg-[#f7f3ec] rounded-2xl p-6 lg:p-10 overflow-hidden shadow-sm border border-[#dddad3]">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#d8e3ce]/30 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative w-24 h-24 lg:w-28 lg:h-28 rounded-xl overflow-hidden shrink-0 shadow-md bg-[#e6e2db] border-2 border-[#dddad3] group">
                <img
                  alt={`Master Curator ${ownerName}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkSktnVijYsv9egEeoe9zYQQgoIpCEyEYypnZ7J0smSq0md777Wn4t7YoVjw76jobBqZIgjb1N1JYla9gBSN_Fypmv24cUlrt0-ukU1eYfnGaAYsGKm2qzfs7-J8I2iFaPoQEQxZrrXGJQmosLHTqgkWD2GMqdVUYXj_e68KsRhEF4LcWv7K_AwxeR54whJydwqqtOnrg5zlFewL0CWugIFCLd0PDZAmOl4TGVpYmdJ6hE0uppdP1W1A"
                />
                <div
                  className="absolute bottom-1 right-1 bg-[#141310] text-[#fdf9f2] rounded p-1 shadow-sm"
                  title="Chữ ký chứng thực số B-Corp cấp 1"
                >
                  <span className="material-symbols-outlined text-[15px] block text-[#d8e3ce]">verified</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#d8e3ce] text-[#3f4a3a] text-xs rounded uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                    ACTIVE • IN GOOD STANDING
                  </span>
                  <span
                    className="px-2.5 py-0.5 bg-[#e6e2db] text-[#4a463f] text-xs rounded uppercase tracking-wider flex items-center gap-1.5 font-bold"
                    title="Verified custodial workshop account"
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#576151]">verified_user</span>
                    ROLE: SHOP OWNER
                  </span>
                  <span className="px-2.5 py-0.5 bg-[#f1ede6] text-[#4a463f] text-xs rounded uppercase tracking-wider">
                    MEMBER SINCE OCT 2024
                  </span>
                </div>

                <div>
                  <h1 className="font-serif text-3xl sm:text-4xl text-[#141310] tracking-tight font-medium">
                    {ownerName}
                  </h1>
                  <p className="text-sm text-[#4a463f] flex flex-wrap items-center gap-2 pt-1">
                    <span className="font-semibold text-[#141310]">{roleTitle}</span>
                    <span className="text-[#ccc5bc]">•</span>
                    <span className="text-[#576151] font-semibold uppercase tracking-wider text-xs">
                      {shopName}
                    </span>
                    <span className="text-[#ccc5bc]">•</span>
                    <span className="font-mono text-xs text-[#7b766f] bg-[#f1ede6] px-1.5 py-0.5 rounded">
                      #OWNER-01
                    </span>
                  </p>
                </div>

                <p className="text-xs text-[#7b766f] italic max-w-xl">
                  &ldquo;Immutable, verified custodial workshop account under Circular Atelier Charter v4.2&rdquo;
                </p>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsKycModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#e6e2db] hover:bg-[#dddad3] text-[#141310] text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs border border-[#dddad3] font-medium"
              >
                <span className="material-symbols-outlined text-[18px] text-[#576151]">workspace_premium</span>
                <span>
                  KYC Status: <strong className="text-[#576151] font-semibold">ACTIVE &amp; FULLY VERIFIED</strong>
                </span>
              </button>

              <Link
                to="/shop/notifications"
                className="relative inline-flex items-center gap-2 px-5 py-3 bg-[#141310] hover:bg-[#292724] text-[#fdf9f2] text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">notifications</span>
                <span>Notifications</span>
                <span className="w-5 h-5 rounded-full bg-[#576151] text-[#fdf9f2] text-[10px] flex items-center justify-center font-bold ml-1">
                  3
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-3 bg-white hover:bg-[#f1ede6] text-[#141310] text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs border border-[#dddad3] font-semibold"
                title="Chỉnh sửa thông tin xưởng"
              >
                <span className="material-symbols-outlined text-[17px]">edit_note</span>
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Circular Performance & Provenance Snapshot Metrics (3 Cards) */}
      <section className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metric 1 */}
          <div className="bg-[#f7f3ec] rounded-xl p-6 flex flex-col justify-between shadow-xs border border-[#dddad3] hover:bg-[#f1ede6] transition-colors relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-[#576151] font-semibold">Circulating Assets</span>
              <div className="w-9 h-9 rounded-lg bg-[#576151]/10 flex items-center justify-center text-[#576151]">
                <span className="material-symbols-outlined text-[20px]">drive_file_stream</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-serif text-5xl text-[#141310] leading-none font-normal">42</div>
              <div className="text-base font-semibold text-[#1c1c18]">Active Rigs in Rental Rotation</div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#ebe8e1] flex items-center justify-between text-xs text-[#7b766f]">
              <span>Current Utilization: <strong className="text-[#141310]">88.4%</strong></span>
              <span className="text-[#576151] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                Healthy Flow
              </span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-[#f7f3ec] rounded-xl p-6 flex flex-col justify-between shadow-xs border border-[#dddad3] hover:bg-[#f1ede6] transition-colors relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-[#576151] font-semibold">Material Conservation</span>
              <div className="w-9 h-9 rounded-lg bg-[#576151]/10 flex items-center justify-center text-[#576151]">
                <span className="material-symbols-outlined text-[20px]">recycling</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-serif text-5xl text-[#141310] leading-none font-normal">18</div>
              <div className="text-base font-semibold text-[#1c1c18]">Second-Life Archival Conversions</div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#ebe8e1] flex items-center justify-between text-xs text-[#7b766f]">
              <span>Zero Carbon Salvage</span>
              <span className="text-[#576151] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">eco</span>
                +4.2 T CO₂e Avoided
              </span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-[#f7f3ec] rounded-xl p-6 flex flex-col justify-between shadow-xs border border-[#dddad3] hover:bg-[#f1ede6] transition-colors relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-[#576151] font-semibold">Custody Quality Standard</span>
              <div className="w-9 h-9 rounded-lg bg-[#576151]/10 flex items-center justify-center text-[#576151]">
                <span className="material-symbols-outlined text-[20px]">handyman</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-serif text-5xl text-[#141310] leading-none font-normal">100%</div>
              <div className="text-base font-semibold text-[#1c1c18]">Bench Authenticity Score</div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#ebe8e1] flex items-center justify-between text-xs text-[#7b766f]">
              <span>Collimator &amp; CLA Verified</span>
              <span className="text-[#576151] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Tier 1 Bench
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Information Dossier: Asymmetrical Layout (12 Cols: 7 Left, 5 Right) */}
      <section className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Shop & Atelier Specifications + Accreditation History (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Card 1: Shop & Atelier Specifications */}
            <div className="bg-[#f7f3ec] rounded-2xl p-6 lg:p-8 shadow-xs border border-[#dddad3]">
              {/* Card Header Strip */}
              <div className="flex items-center justify-between pb-6 mb-6 bg-[#f1ede6]/80 -mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 lg:px-8 pt-6 lg:pt-8 rounded-t-2xl border-b border-[#dddad3]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-[#576151] font-bold">REGISTRY FILE 774</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#d8e3ce] text-[#3f4a3a] text-[10px] font-mono font-bold">
                      SHA-256
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl text-[#141310] font-normal mt-0.5">
                    Shop &amp; Atelier Specifications
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#7b766f] border border-[#dddad3]">
                  <span className="material-symbols-outlined text-[22px]">storefront</span>
                </div>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#7b766f] mb-1 font-medium">
                    Registered Business Entity
                  </div>
                  <div className="text-base text-[#141310] font-semibold">{shopName}</div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-[#7b766f] mb-1 font-medium">
                    Registry UID
                  </div>
                  <div
                    onClick={() => copyToClipboard('#ATELIER-CHRONOS-774', 'Mã Registry UID')}
                    className="inline-flex items-center gap-1.5 text-base text-[#141310] font-mono font-semibold cursor-pointer hover:text-[#576151] transition-colors"
                    title="Nhấp để sao chép"
                  >
                    <span>#ATELIER-CHRONOS-774</span>
                    <span className="material-symbols-outlined text-[15px] text-[#7b766f]">content_copy</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-[#7b766f] mb-1 font-medium">
                    Curatorial Tier
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#d8e3ce]/50 text-[#3f4a3a] rounded-lg text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-[#576151]">diamond</span>
                    Premier Optical &amp; Horological Curation Partner
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-[#7b766f] mb-1 font-medium">
                    Account &amp; Custody Bench Status
                  </div>
                  <div className="text-sm text-[#141310] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#576151]"></span>
                    <span className="font-semibold text-[#576151]">Active &amp; Fully Verified</span>
                    <span className="text-[#7b766f] text-xs">(Da Nang &amp; HCMC Lab)</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-xs uppercase tracking-wider text-[#7b766f] mb-1 font-medium">
                    Curatorial Specialization &amp; Scope
                  </div>
                  <p className="text-sm text-[#1c1c18] leading-relaxed bg-white/70 p-3.5 rounded-xl border border-[#ebe8e1]">
                    {specialization}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <div className="text-xs uppercase tracking-wider text-[#7b766f] mb-1 font-medium">
                    Vault &amp; Physical Showroom Address
                  </div>
                  <div className="p-4 bg-white/90 rounded-xl space-y-1.5 border border-[#dddad3]">
                    <div className="text-base text-[#141310] font-semibold">{addressLine}</div>
                    <div className="text-sm text-[#4a463f]">{cityRegion}</div>
                    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#576151] uppercase tracking-wider font-semibold border-t border-[#f1ede6] mt-2">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">lock_clock</span>
                        By Appointment Only
                      </span>
                      <span className="text-[#ccc5bc]">•</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">local_shipping</span>
                        Secure Dispatch Hub
                      </span>
                      <span className="text-[#ccc5bc]">•</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">shield</span>
                        Nanuk Vault Niêm Phong
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custody Bench & Vault Environment Photos */}
              <div className="mt-8 pt-6 border-t border-[#ebe8e1]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase tracking-wider text-[#4a463f] font-semibold">
                    Custody Bench &amp; Vault Environment
                  </div>
                  <span className="text-[11px] text-[#7b766f]">Nhấp vào ảnh để phóng to</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bench 01 */}
                  <div
                    onClick={() =>
                      setLightboxImg({
                        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCo3dodFh-h-seBHROie0FnSJoQtOlfaRczoAv8YwQuQpReBuS9UlUUhG02rm7pu7xfC9RCgvpAR1YSL0Xfoo10TUkdIQqaRybtzHbMn6Ab2kFpt-TWRwkp1gvAPIR8YOUqzHtX9ERFbshqkJtHOPeTmDIqaMUszZ3lIDPm7-Q-RXbw9-3D0PSe1Hrz3X6NDZUOpcSQ4Ij-MXtw-IOb0soB9w93oAGjKAqynXxELvMyKlf1ZwQF-zi_Lg',
                        caption:
                          'Optical Bench 01: Khu vực căn chuẩn quang sai, máy chuẩn trực quang học Collimator 0.01 micron và phòng vô trùng khí nén HEPA.',
                      })
                    }
                    className="h-48 rounded-xl overflow-hidden relative shadow-xs border border-[#dddad3] cursor-pointer group"
                  >
                    <img
                      alt="Optical Bench 01"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCo3dodFh-h-seBHROie0FnSJoQtOlfaRczoAv8YwQuQpReBuS9UlUUhG02rm7pu7xfC9RCgvpAR1YSL0Xfoo10TUkdIQqaRybtzHbMn6Ab2kFpt-TWRwkp1gvAPIR8YOUqzHtX9ERFbshqkJtHOPeTmDIqaMUszZ3lIDPm7-Q-RXbw9-3D0PSe1Hrz3X6NDZUOpcSQ4Ij-MXtw-IOb0soB9w93oAGjKAqynXxELvMyKlf1ZwQF-zi_Lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="px-2 py-0.5 bg-[#141310]/80 backdrop-blur-sm text-xs uppercase tracking-wider rounded font-medium">
                        Optical Bench 01
                      </span>
                      <span className="material-symbols-outlined text-[18px] opacity-80 group-hover:opacity-100">
                        zoom_in
                      </span>
                    </div>
                  </div>

                  {/* Vault Display */}
                  <div
                    onClick={() =>
                      setLightboxImg({
                        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9thyhtOBZ_8bKGM_JtzDCaiOj8ul1yIeu787g3w-dAHwR2xPqErlFpWSV7NYzrjWenB1F-IxgQbO-KtYsHrlfG2Egb_yK6AM261Iy-BNjSFyiDhSa_q-KA3rHUpCjNmt--SN_0NhM8uYfCvN2gM8AImZ5kIYdr87qt1zlhVMfnDE2gGkADbXAR2nfUOwSLRiH7jlFw8dpBcPTOYQSAbP_Bg4aGrkL8-wCACOvivbl-VtN6DUCe0riwA',
                        caption:
                          'Curated Vault Display: Tủ lưu trữ khí hậu cân bằng ẩm độ 45% RH với các hiện vật Leica, Hasselblad và đồng hồ cổ điển di sản.',
                      })
                    }
                    className="h-48 rounded-xl overflow-hidden relative shadow-xs border border-[#dddad3] cursor-pointer group"
                  >
                    <img
                      alt="Curated Vault Display"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9thyhtOBZ_8bKGM_JtzDCaiOj8ul1yIeu787g3w-dAHwR2xPqErlFpWSV7NYzrjWenB1F-IxgQbO-KtYsHrlfG2Egb_yK6AM261Iy-BNjSFyiDhSa_q-KA3rHUpCjNmt--SN_0NhM8uYfCvN2gM8AImZ5kIYdr87qt1zlhVMfnDE2gGkADbXAR2nfUOwSLRiH7jlFw8dpBcPTOYQSAbP_Bg4aGrkL8-wCACOvivbl-VtN6DUCe0riwA"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="px-2 py-0.5 bg-[#141310]/80 backdrop-blur-sm text-xs uppercase tracking-wider rounded font-medium">
                        Curated Vault Display
                      </span>
                      <span className="material-symbols-outlined text-[18px] opacity-80 group-hover:opacity-100">
                        zoom_in
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Atelier Accreditation History */}
            <div className="bg-[#f7f3ec] rounded-2xl p-6 lg:p-8 shadow-xs border border-[#dddad3]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#576151] font-bold">
                    VERIFICATION PROVENANCE
                  </span>
                  <h2 className="font-serif text-2xl text-[#141310] font-normal mt-0.5">
                    Atelier Accreditation History
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#7b766f] border border-[#dddad3]">
                  <span className="material-symbols-outlined text-[22px]">history_edu</span>
                </div>
              </div>

              {/* Vertical Timeline */}
              <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#dddad3]">
                <div className="relative">
                  <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-[#576151] ring-4 ring-[#f7f3ec]"></div>
                  <div className="text-xs text-[#576151] uppercase tracking-wider font-bold">
                    OCTOBER 2024 • FOUNDATION &amp; ADMISSION
                  </div>
                  <div className="text-base text-[#141310] font-semibold mt-0.5">
                    Chartered as Verified Shop Owner &amp; Premier Partner
                  </div>
                  <p className="text-xs text-[#4a463f] mt-1 leading-relaxed">
                    Master Curator credential authenticated. Member since Oct 2024 under License #ATELIER-CHRONOS-774.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-[#7b766f] ring-4 ring-[#f7f3ec]"></div>
                  <div className="text-xs text-[#7b766f] uppercase tracking-wider font-semibold">
                    OCTOBER 2024 • SETTLEMENT INTEGRATION
                  </div>
                  <div className="text-base text-[#141310] font-semibold mt-0.5">
                    VNPay Escrow Vault Multi-Currency Settlement Activated
                  </div>
                  <p className="text-xs text-[#4a463f] mt-1 leading-relaxed">
                    Institutional bond posted for high-value optical and horological equipment handling. Multi-sig release channel active.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-[#576151] ring-4 ring-[#f7f3ec]"></div>
                  <div className="text-xs text-[#576151] uppercase tracking-wider font-semibold">
                    NOVEMBER 2024 • FORENSIC &amp; SMART-ESCROW AUDIT
                  </div>
                  <div className="text-base text-[#141310] font-semibold mt-0.5">
                    100% Zero-Dispute Circularity Milestone
                  </div>
                  <p className="text-xs text-[#4a463f] mt-1 leading-relaxed">
                    Hoàn tất 44 phiên đối soát tự động không có khiếu nại cọc Nanuk. Đạt chuẩn B-Corp Circular Appraisal Tier-1.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Curator Security & Contact + Atelier Command Shortcuts (5 Cols) */}
          <div className="lg:col-span-5 space-y-8">
            {/* Card 3: Curator Security & Contact */}
            <div className="bg-[#f7f3ec] rounded-2xl p-6 lg:p-8 shadow-xs border border-[#dddad3]">
              {/* Header */}
              <div className="flex items-center justify-between pb-6 mb-6 bg-[#f1ede6]/80 -mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 lg:px-8 pt-6 lg:pt-8 rounded-t-2xl border-b border-[#dddad3]">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#576151] font-bold">
                    AUTHENTICATION LEDGER
                  </span>
                  <h2 className="font-serif text-2xl text-[#141310] font-normal mt-0.5">
                    Curator Security &amp; Contact
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#7b766f] border border-[#dddad3]">
                  <span className="material-symbols-outlined text-[22px]">shield</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Curator Emails */}
                <div className="p-3.5 bg-white/90 rounded-xl flex items-start justify-between gap-3 border border-[#dddad3]">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#7b766f] font-medium">Curator Emails</div>
                    <div className="text-sm font-semibold text-[#141310] truncate max-w-[220px] mt-0.5">
                      {primaryEmail}
                    </div>
                    <div className="text-xs text-[#7b766f] truncate max-w-[220px]">
                      {secondaryEmail}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[#576151] text-xs font-semibold pt-1">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    Verified
                  </span>
                </div>

                {/* Concierge Line */}
                <div className="p-3.5 bg-white/90 rounded-xl flex items-start justify-between gap-3 border border-[#dddad3]">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#7b766f] font-medium">
                      Concierge &amp; Dispatch Line
                    </div>
                    <div className="text-sm font-semibold text-[#141310] font-mono mt-0.5">
                      {phoneNumber}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[#576151] text-xs font-semibold pt-1">
                    <span className="material-symbols-outlined text-[15px]">sms</span>
                    SMS Verified
                  </span>
                </div>

                {/* Escrow Routing */}
                <div className="p-4 bg-white/90 rounded-xl space-y-2 border border-[#dddad3]">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-wider text-[#7b766f] font-semibold">
                      Escrow Settlement Routing
                    </div>
                    <span className="px-2 py-0.5 bg-[#576151]/10 text-[#576151] text-[11px] rounded uppercase font-semibold">
                      Active Node
                    </span>
                  </div>
                  <div className="text-sm text-[#141310] font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#576151] text-[19px]">account_balance</span>
                    <span>VNPay Escrow Vault Account</span>
                  </div>
                  <div
                    onClick={() => copyToClipboard('#ATELIER-774-SETTLEMENT', 'Mã Payout Node')}
                    className="font-mono text-xs text-[#4a463f] bg-[#f1ede6] hover:bg-[#ebe8e1] px-2.5 py-1 rounded inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title="Nhấp để sao chép"
                  >
                    <span>Payout Node: #ATELIER-774-SETTLEMENT</span>
                    <span className="material-symbols-outlined text-[13px] text-[#7b766f]">content_copy</span>
                  </div>
                  <p className="text-xs text-[#7b766f] pt-1 leading-relaxed">
                    Automated multi-sig release upon verified return check-in and bench condition sign-off.
                  </p>
                </div>

                {/* Security Hardware */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs uppercase tracking-wider text-[#7b766f] font-semibold">
                    Security &amp; Hardware Tokens
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#1c1c18] bg-white/60 p-2.5 rounded-lg border border-[#ebe8e1]">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#576151] text-[17px]">key</span>
                      FIDO2 Hardware Key
                    </span>
                    <span className="text-[#576151] font-semibold">Configured (YubiKey 5C)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#1c1c18] bg-white/60 p-2.5 rounded-lg border border-[#ebe8e1]">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#576151] text-[17px]">vpn_lock</span>
                      Session Signature
                    </span>
                    <span className="font-mono text-xs text-[#7b766f]">ed25519-signed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Atelier Command (Management Shortcuts) */}
            <div className="bg-[#f7f3ec] rounded-2xl p-6 lg:p-8 shadow-xs border border-[#dddad3]">
              <div className="mb-5">
                <span className="text-xs uppercase tracking-wider text-[#576151] font-bold">ATELIER COMMAND</span>
                <h2 className="font-serif text-2xl text-[#141310] font-normal mt-0.5">Management Shortcuts</h2>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <Link
                  to="/shop/dashboard"
                  className="flex items-center justify-between p-3.5 bg-white rounded-xl hover:bg-[#f1ede6] transition-colors group border border-[#dddad3]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#141310] flex items-center justify-center text-white shrink-0">
                      <span className="material-symbols-outlined text-[19px]">dashboard</span>
                    </div>
                    <div>
                      <div className="text-sm text-[#141310] font-semibold">Shop Dashboard</div>
                      <div className="text-xs text-[#7b766f]">/shop — Operations &amp; dispatch center</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#7b766f] group-hover:translate-x-1 group-hover:text-[#141310] transition-all text-[20px]">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  to="/shop/rent/products"
                  className="flex items-center justify-between p-3.5 bg-white rounded-xl hover:bg-[#f1ede6] transition-colors group border border-[#dddad3]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#576151] flex items-center justify-center text-white shrink-0">
                      <span className="material-symbols-outlined text-[19px]">cached</span>
                    </div>
                    <div>
                      <div className="text-sm text-[#141310] font-semibold">RENT Products</div>
                      <div className="text-xs text-[#7b766f]">/shop/rent/products — Circulating product catalog</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#7b766f] group-hover:translate-x-1 group-hover:text-[#141310] transition-all text-[20px]">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  to="/shop/rent/inventory"
                  className="flex items-center justify-between p-3.5 bg-white rounded-xl hover:bg-[#f1ede6] transition-colors group border border-[#dddad3]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#e6e2db] flex items-center justify-center text-[#141310] shrink-0">
                      <span className="material-symbols-outlined text-[19px]">inventory</span>
                    </div>
                    <div>
                      <div className="text-sm text-[#141310] font-semibold">RENT Inventory</div>
                      <div className="text-xs text-[#7b766f]">/shop/rent/inventory — 42 optical rigs &amp; deposits</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#7b766f] group-hover:translate-x-1 group-hover:text-[#141310] transition-all text-[20px]">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  to="/shop/thrift/listings"
                  className="flex items-center justify-between p-3.5 bg-white rounded-xl hover:bg-[#f1ede6] transition-colors group border border-[#dddad3]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#e6e2db] flex items-center justify-center text-[#141310] shrink-0">
                      <span className="material-symbols-outlined text-[19px]">inventory_2</span>
                    </div>
                    <div>
                      <div className="text-sm text-[#141310] font-semibold">THRIFT Listings</div>
                      <div className="text-xs text-[#7b766f]">/shop/thrift/listings — Permanent transfer archive</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#7b766f] group-hover:translate-x-1 group-hover:text-[#141310] transition-all text-[20px]">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  to="/shop/revenue"
                  className="flex items-center justify-between p-3.5 bg-white rounded-xl hover:bg-[#f1ede6] transition-colors group border border-[#dddad3]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#2e2618] flex items-center justify-center text-[#f0e0cb] shrink-0">
                      <span className="material-symbols-outlined text-[19px]">payments</span>
                    </div>
                    <div>
                      <div className="text-sm text-[#141310] font-semibold">Sổ Quyết Toán Doanh Thu</div>
                      <div className="text-xs text-[#7b766f]">/shop/revenue — Smart Escrow &amp; đối soát VNPay</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#7b766f] group-hover:translate-x-1 group-hover:text-[#141310] transition-all text-[20px]">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  to="/shop/kyc"
                  className="flex items-center justify-between p-3.5 bg-white rounded-xl hover:bg-[#f1ede6] transition-colors group border border-[#dddad3] text-left w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#d8e3ce] flex items-center justify-center text-[#3f4a3a] shrink-0">
                      <span className="material-symbols-outlined text-[19px]">verified</span>
                    </div>
                    <div>
                      <div className="text-sm text-[#141310] font-semibold">KYC Verification</div>
                      <div className="text-xs text-[#7b766f]">/kyc — Accreditation dossier &amp; credentials</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#7b766f] group-hover:translate-x-1 group-hover:text-[#141310] transition-all text-[20px]">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>

            {/* Banner: Standard Custody Responsibility */}
            <div className="bg-[#d8e3ce]/40 rounded-2xl p-6 flex items-start gap-4 border border-[#576151]/20">
              <span className="material-symbols-outlined text-[#576151] text-[26px] shrink-0 mt-0.5">
                verified_user
              </span>
              <div>
                <div className="text-sm text-[#141310] font-semibold mb-1">
                  Standard Custody Responsibility
                </div>
                <p className="text-xs text-[#1c1c18] leading-relaxed">
                  As an authenticated Shop Owner, all items dispatched must adhere to the ReUse Hub mechanical condition charter. Bench servicing logs are signed directly to the decentralized ledger.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL 1: Edit Atelier Profile */}
      {isEditModalOpen && (
        <div
          onClick={() => setIsEditModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdf9f2] rounded-2xl w-full max-w-xl shadow-2xl border border-[#dddad3] p-6 lg:p-8 relative max-h-[90vh] overflow-y-auto cursor-default"
          >
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f1ede6] flex items-center justify-center text-[#7b766f] hover:text-[#141310] hover:bg-[#e6e2db] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="mb-6">
              <span className="text-xs uppercase tracking-wider text-[#576151] font-bold">PROFILE SETTINGS</span>
              <h3 className="font-serif text-2xl text-[#141310] font-semibold mt-1">
                Cập Nhật Thông Tin Xưởng Lưu Ký
              </h3>
              <p className="text-xs text-[#7b766f] mt-1">
                Các thay đổi sẽ được đồng bộ vào hồ sơ định danh đối tác Atelier #OWNER-01.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#141310] uppercase tracking-wider mb-1">
                  Tên Pháp Nhân Xưởng (Business Entity)
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dddad3] text-sm text-[#141310] focus:outline-none focus:ring-2 focus:ring-[#576151]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141310] uppercase tracking-wider mb-1">
                    Chủ Xưởng / Đại Diện
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dddad3] text-sm text-[#141310] focus:outline-none focus:ring-2 focus:ring-[#576151]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#141310] uppercase tracking-wider mb-1">
                    Chức Danh Giám Định
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dddad3] text-sm text-[#141310] focus:outline-none focus:ring-2 focus:ring-[#576151]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141310] uppercase tracking-wider mb-1">
                    Email Giám Định Chính
                  </label>
                  <input
                    type="email"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dddad3] text-sm text-[#141310] focus:outline-none focus:ring-2 focus:ring-[#576151]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#141310] uppercase tracking-wider mb-1">
                    Email Liên Hệ Phụ
                  </label>
                  <input
                    type="email"
                    value={secondaryEmail}
                    onChange={(e) => setSecondaryEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dddad3] text-sm text-[#141310] focus:outline-none focus:ring-2 focus:ring-[#576151]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141310] uppercase tracking-wider mb-1">
                  Số Điện Thoại Trực Hotline
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dddad3] text-sm text-[#141310] focus:outline-none focus:ring-2 focus:ring-[#576151]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141310] uppercase tracking-wider mb-1">
                    Địa Chỉ Showroom / Vault
                  </label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dddad3] text-sm text-[#141310] focus:outline-none focus:ring-2 focus:ring-[#576151]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#141310] uppercase tracking-wider mb-1">
                    Khu Vực / Thành Phố
                  </label>
                  <input
                    type="text"
                    value={cityRegion}
                    onChange={(e) => setCityRegion(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dddad3] text-sm text-[#141310] focus:outline-none focus:ring-2 focus:ring-[#576151]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141310] uppercase tracking-wider mb-1">
                  Phạm Vi Chuyên Môn &amp; Dịch Vụ Lưu Ký
                </label>
                <textarea
                  rows={3}
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dddad3] text-sm text-[#141310] focus:outline-none focus:ring-2 focus:ring-[#576151]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#dddad3]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#dddad3] text-xs font-semibold uppercase tracking-wider text-[#4a463f] hover:bg-[#f1ede6] transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#141310] hover:bg-[#292724] text-[#fdf9f2] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Interactive KYC & B-Corp Dossier */}
      {isKycModalOpen && (
        <div
          onClick={() => setIsKycModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdf9f2] rounded-2xl w-full max-w-xl shadow-2xl border border-[#dddad3] p-6 lg:p-8 relative cursor-default"
          >
            <button
              onClick={() => setIsKycModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f1ede6] flex items-center justify-center text-[#7b766f] hover:text-[#141310] hover:bg-[#e6e2db] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#d8e3ce] flex items-center justify-center text-[#3f4a3a]">
                <span className="material-symbols-outlined text-[26px]">workspace_premium</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[#576151] font-bold">
                  B-CORP CIRCULAR CERTIFICATION
                </span>
                <h3 className="font-serif text-2xl text-[#141310] font-semibold">
                  Hồ Sơ Giám Định Đối Tác Lưu Ký
                </h3>
              </div>
            </div>

            <div className="space-y-4 text-sm text-[#1c1c18]">
              <div className="p-4 bg-white rounded-xl border border-[#dddad3] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7b766f] uppercase tracking-wider font-semibold">Số Hiệu Chứng Thư</span>
                  <span className="font-mono font-bold text-[#141310]">BCORP-VN-ATELIER-774-LV1</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7b766f] uppercase tracking-wider font-semibold">Thời Hạn Hiệu Lực</span>
                  <span className="text-[#576151] font-semibold">Đến 31/12/2026 (Active)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7b766f] uppercase tracking-wider font-semibold">Cơ Quan Cấp Phép</span>
                  <span className="text-[#141310]">Hội Đồng Thẩm Định Di Sản Tuần Hoàn Đông Dương</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#141310] uppercase tracking-wider">
                  Các Hạng Mục Đã Kiểm Định Thực Địa
                </div>
                <div className="space-y-1.5 text-xs text-[#4a463f]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#576151] text-[16px]">check_circle</span>
                    <span>Phòng lab quang học vô trùng khí nén đạt tiêu chuẩn ISO 14644-1 Class 6.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#576151] text-[16px]">check_circle</span>
                    <span>Chứng chỉ chuyên môn căn chuẩn ống kính Rangefinder Leica &amp; Hasselblad V.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#576151] text-[16px]">check_circle</span>
                    <span>Ký quỹ bảo chứng độc lập 100M VND qua Smart Escrow VNPay.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#dddad3] flex items-center justify-between">
                <span className="text-xs text-[#7b766f] font-mono">VERIFIED BY FORENSIC SHA-256</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsKycModalOpen(false);
                    showToast('Đã xuất bản sao chứng chỉ KYC điện tử!');
                  }}
                  className="px-4 py-2 bg-[#141310] hover:bg-[#292724] text-[#fdf9f2] text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Tải Bản Sao Chứng Thư (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Image Lightbox */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdf9f2] rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#dddad3]"
          >
            <div className="relative max-h-[70vh] bg-black">
              <img src={lightboxImg.src} alt="Archive Specimen" className="w-full h-full object-contain" />
              <button
                onClick={() => setLightboxImg(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-5 bg-[#f7f3ec] border-t border-[#dddad3] flex items-center justify-between">
              <p className="text-sm text-[#141310] font-medium leading-relaxed max-w-2xl">
                {lightboxImg.caption}
              </p>
              <button
                onClick={() => setLightboxImg(null)}
                className="px-4 py-1.5 rounded-lg bg-[#141310] text-[#fdf9f2] text-xs uppercase font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopOwnerProfile;
