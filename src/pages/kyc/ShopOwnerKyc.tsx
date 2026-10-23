import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

type KycLifecycleState = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export const ShopOwnerKyc: React.FC = () => {
  // State for current lifecycle simulator tab
  const [activeState, setActiveState] = useState<KycLifecycleState>('APPROVED');

  // Modals state
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isHashModalOpen, setIsHashModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isOmbudsmanModalOpen, setIsOmbudsmanModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCertModalOpen(false);
        setIsHashModalOpen(false);
        setIsSubmitModalOpen(false);
        setIsOmbudsmanModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  return (
    <div className="w-full bg-[#fdf9f2] text-[#1c1c18] min-h-[calc(100vh-5rem)] font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-[#141310] text-[#fdf9f2] shadow-2xl border border-[#dddad3] animate-bounce-subtle">
          <span className="material-symbols-outlined text-[#d8e3ce] text-[20px]">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-12">
        {/* Editorial Navigation / Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 mb-8 text-[#7b766f] text-xs uppercase tracking-widest">
          <Link to="/shop" className="hover:text-[#141310] transition-colors flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[15px]">warehouse</span>
            <span>Shop</span>
          </Link>
          <span className="opacity-40">/</span>
          <Link to="/shop/profile" className="hover:text-[#141310] transition-colors flex items-center gap-1 font-medium">
            <span>Atelier Chronos &amp; Optics • Vũ Thanh Tùng (#OWNER-01)</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-[#141310] font-semibold">Identity &amp; Atelier Verification (/kyc)</span>
        </div>

        {/* Editorial Header Block with Architectural Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-12 mb-12 border-b border-[#ebe8e1]">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#d8e3ce] text-[#3f4a3a] rounded-lg text-xs font-semibold tracking-wider uppercase shadow-xs">
              <span className="material-symbols-outlined text-[17px] text-[#576151]">shield_with_heart</span>
              <span>Atelier Compliance Protocol 4.2</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[44px] leading-tight text-[#141310] tracking-tight font-medium">
              Atelier &amp; Merchant Verification <span className="italic font-normal font-serif text-[#576151]">(KYC)</span>
            </h1>
            <p className="text-base sm:text-lg text-[#4a463f] max-w-2xl leading-relaxed">
              Institutional identity validation, business licensing, and bench calibration certification for circular custody dispatch across high-value archival artifacts.
            </p>
          </div>

          {/* Quick Action / Cert Badge Box */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 justify-end">
            <button
              onClick={() => setIsCertModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#141310] text-[#fdf9f2] text-xs font-semibold uppercase tracking-wider rounded-xl shadow-sm hover:bg-[#292724] transition-all"
            >
              <span className="material-symbols-outlined text-[19px] text-[#d8e3ce]">workspace_premium</span>
              <span>Download Certificate (PDF)</span>
            </button>
            <div className="flex items-center gap-3 text-xs text-[#7b766f]">
              <Link to="/shop/profile" className="hover:text-[#141310] font-medium transition-colors">
                Xem hồ sơ Atelier
              </Link>
              <span className="text-[#dddad3]">•</span>
              <button
                onClick={() => setIsHashModalOpen(true)}
                className="text-[#576151] hover:text-[#141310] font-semibold uppercase tracking-widest underline underline-offset-4 transition-colors"
              >
                Audit Feed Hash
              </button>
            </div>
          </div>
        </div>

        {/* Notice Banner: Role Permeability Principle */}
        <div className="mb-12 p-6 md:p-8 bg-[#f1ede6] rounded-2xl shadow-xs border border-[#dddad3] flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#e6e2db] flex items-center justify-center shrink-0 text-[#141310] border border-[#dddad3]">
            <span className="material-symbols-outlined text-[30px]">account_balance</span>
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#576151] font-bold">
              <span className="material-symbols-outlined text-[17px]">gavel</span>
              <span>Governance Principle &amp; Custody Policy • Quy Chuẩn Định Danh Bất Biến</span>
            </div>
            <p className="text-sm md:text-base text-[#1c1c18] leading-relaxed">
              KYC approval does <strong className="font-semibold text-[#141310] uppercase">NOT</strong> change the user&apos;s authenticated account role. The account remains permanently designated as{' '}
              <span className="font-mono bg-[#e6e2db] px-2.5 py-1 rounded text-[#141310] text-xs font-bold border border-[#dddad3]">
                SHOP_OWNER
              </span>.
            </p>
            <p className="text-xs md:text-sm text-[#7b766f] italic leading-relaxed border-l-2 border-[#576151]/50 pl-3">
              (Quy chuẩn định danh không thay đổi phân vai tài khoản. Tài khoản luôn được ấn định là SHOP OWNER — toàn quyền điều phối danh mục ký gửi, kho thẩm định &amp; thanh toán ký quỹ).
            </p>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <div className="px-6 py-4 bg-[#f7f3ec] border border-[#dddad3] rounded-xl text-center shadow-xs">
              <span className="block text-[11px] uppercase tracking-wider text-[#7b766f] font-medium">
                Authenticated Role
              </span>
              <span className="block font-serif text-lg text-[#141310] font-semibold tracking-wider mt-0.5">
                SHOP OWNER
              </span>
              <span className="block font-mono text-xs text-[#576151] font-bold mt-0.5">
                #OWNER-01 (LOCKED)
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Bento: Active Verification Ledger & Interactive Lifecycle Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Primary Live Clearance Card (Atelier Chronos & Optics) (7 cols) */}
          <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#dddad3] flex flex-col justify-between">
            <div>
              {/* Card Header / Status Stamp */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 mb-6 border-b border-[#f1ede6]">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#7b766f] block mb-1 font-semibold">
                    Active Ledger Accreditation
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#141310] font-normal">
                    Atelier Chronos &amp; Optics
                  </h2>
                  <p className="text-xs sm:text-sm text-[#576151] font-mono mt-1">
                    Registry UID: CHR-99201-VAULT • Geneva &amp; North America Hub
                  </p>
                </div>
                <div className="px-4 py-2 bg-[#d8e3ce] text-[#3f4a3a] rounded-xl inline-flex items-center gap-2 shadow-xs border border-[#576151]/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#576151] animate-pulse"></span>
                  <span className="text-xs uppercase tracking-widest font-bold">
                    APPROVED • LEVEL 3 CLEARANCE
                  </span>
                </div>
              </div>

              {/* Chronology & Audit Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 bg-[#f7f3ec] rounded-xl mb-8 border border-[#ebe8e1]">
                <div>
                  <span className="block text-xs uppercase tracking-wider text-[#7b766f] font-medium">Attested Date</span>
                  <span className="font-serif text-lg text-[#141310] font-semibold">Oct 14, 2024</span>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-wider text-[#7b766f] font-medium">Annual Audit Due</span>
                  <span className="font-serif text-lg text-[#141310] font-semibold">Oct 2025</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="block text-xs uppercase tracking-wider text-[#7b766f] font-medium">Escrow Ceiling</span>
                  <span className="font-serif text-lg text-[#576151] font-semibold">Unlimited Tier</span>
                </div>
              </div>

              {/* Verified Document Roster */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-[#141310] font-bold flex items-center justify-between pb-2 border-b border-[#f1ede6]">
                  <span>Verified Custody Credentials (Shop Owner Dossier)</span>
                  <span className="text-[#576151] font-normal text-xs">4 of 4 Verified</span>
                </h3>

                {/* Doc 1 */}
                <div className="p-4 bg-[#f7f3ec] rounded-xl flex items-start justify-between gap-4 transition-all hover:bg-[#f1ede6] border border-[#ebe8e1]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#d8e3ce] text-[#3f4a3a] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">verified</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#141310]">
                        1. Commercial Entity &amp; Corporate Tax Registry
                      </div>
                      <div className="text-xs text-[#7b766f] mt-0.5 leading-relaxed">
                        Filing Ref: #US-8842-CORP / MST 0318920192 • Certified by Department of Revenue &amp; General Tax Authority
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#e6e2db] text-[#141310] text-xs uppercase tracking-wider rounded-lg shrink-0 font-bold">
                    Validated
                  </span>
                </div>

                {/* Doc 2 */}
                <div className="p-4 bg-[#f7f3ec] rounded-xl flex items-start justify-between gap-4 transition-all hover:bg-[#f1ede6] border border-[#ebe8e1]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#d8e3ce] text-[#3f4a3a] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">drive_file_rename_outline</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#141310]">
                        2. Master Curator &amp; Optical Bench CLA Certification
                      </div>
                      <div className="text-xs text-[#7b766f] mt-0.5 leading-relaxed">
                        Accredited: Leica Wetzlar Spec &amp; Carl Zeiss Optical Bench Calibration Master
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#e6e2db] text-[#141310] text-xs uppercase tracking-wider rounded-lg shrink-0 font-bold">
                    Validated
                  </span>
                </div>

                {/* Doc 3 */}
                <div className="p-4 bg-[#f7f3ec] rounded-xl flex items-start justify-between gap-4 transition-all hover:bg-[#f1ede6] border border-[#ebe8e1]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#d8e3ce] text-[#3f4a3a] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#141310]">
                        3. Escrow Settlement Bank Details
                      </div>
                      <div className="text-xs text-[#7b766f] mt-0.5 leading-relaxed">
                        VNPay QR &amp; Escrow Account Gateway • Instant T+1 Disbursement Channel Active
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#e6e2db] text-[#141310] text-xs uppercase tracking-wider rounded-lg shrink-0 font-bold">
                    Active
                  </span>
                </div>

                {/* Doc 4 */}
                <div className="p-4 bg-[#f7f3ec] rounded-xl flex items-start justify-between gap-4 transition-all hover:bg-[#f1ede6] border border-[#ebe8e1]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#d8e3ce] text-[#3f4a3a] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">thermostat</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#141310]">
                        4. Physical Vault Security &amp; Climate Compliance
                      </div>
                      <div className="text-xs text-[#7b766f] mt-0.5 leading-relaxed">
                        Class IV Vault Protocol • 45-50% RH Precision Sensors Active • Inspected
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#e6e2db] text-[#141310] text-xs uppercase tracking-wider rounded-lg shrink-0 font-bold">
                    Passed
                  </span>
                </div>
              </div>
            </div>

            {/* Micro Provenance Ledger Footer Inside Card */}
            <div className="mt-8 pt-6 border-t border-[#ebe8e1] flex items-center justify-between text-[#7b766f] text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[17px] text-[#576151]">encrypted</span>
                <span className="font-mono">Cryptographically sealed under Ledger Block #84910</span>
              </div>
              <button
                type="button"
                onClick={() => setIsHashModalOpen(true)}
                className="text-[#141310] hover:text-[#576151] hover:underline uppercase tracking-wider font-semibold transition-colors"
              >
                Inspect Hash
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Lifecycle Showcase / Protocol Simulator (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Showcase Heading & Tab Switcher */}
            <div className="bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-[#dddad3]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#576151] font-bold">
                    Verification Blueprint
                  </span>
                  <h3 className="font-serif text-2xl text-[#141310] font-normal mt-0.5">
                    Lifecycle Flow Explorer
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#f7f3ec] flex items-center justify-center text-[#576151] border border-[#dddad3]">
                  <span className="material-symbols-outlined text-[20px]">schema</span>
                </div>
              </div>
              <p className="text-xs text-[#7b766f] mb-6 leading-relaxed">
                ReUse Hub orchestrates a four-phase custodial verification before allowing high-value listings. Click each status below to explore compliance expectations and remediation procedures.
              </p>

              {/* Status Selector Buttons */}
              <div className="grid grid-cols-2 gap-2 bg-[#f7f3ec] p-1.5 rounded-xl border border-[#ebe8e1]">
                <button
                  type="button"
                  onClick={() => setActiveState('NOT_SUBMITTED')}
                  className={`px-3 py-2 text-center rounded-lg text-xs uppercase tracking-wider transition-all ${
                    activeState === 'NOT_SUBMITTED'
                      ? 'bg-[#141310] text-[#fdf9f2] font-semibold shadow-xs'
                      : 'text-[#4a463f] hover:text-[#141310] hover:bg-[#ebe8e1]'
                  }`}
                >
                  1. Not Submitted
                </button>
                <button
                  type="button"
                  onClick={() => setActiveState('PENDING')}
                  className={`px-3 py-2 text-center rounded-lg text-xs uppercase tracking-wider transition-all ${
                    activeState === 'PENDING'
                      ? 'bg-[#141310] text-[#fdf9f2] font-semibold shadow-xs'
                      : 'text-[#4a463f] hover:text-[#141310] hover:bg-[#ebe8e1]'
                  }`}
                >
                  2. Review Pending
                </button>
                <button
                  type="button"
                  onClick={() => setActiveState('APPROVED')}
                  className={`px-3 py-2 text-center rounded-lg text-xs uppercase tracking-wider transition-all ${
                    activeState === 'APPROVED'
                      ? 'bg-[#141310] text-[#fdf9f2] font-semibold shadow-xs'
                      : 'text-[#4a463f] hover:text-[#141310] hover:bg-[#ebe8e1]'
                  }`}
                >
                  3. Approved (Active)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveState('REJECTED')}
                  className={`px-3 py-2 text-center rounded-lg text-xs uppercase tracking-wider transition-all ${
                    activeState === 'REJECTED'
                      ? 'bg-[#ba1a1a] text-[#ffffff] font-semibold shadow-xs'
                      : 'text-[#4a463f] hover:text-[#ba1a1a] hover:bg-[#ebe8e1]'
                  }`}
                >
                  4. Remediate (Rejected)
                </button>
              </div>
            </div>

            {/* Dynamic State Card Display Area */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#dddad3] flex-1">
              {/* STATE: APPROVED (Default Shown) */}
              {activeState === 'APPROVED' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl bg-[#d8e3ce] text-[#3f4a3a] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">verified_user</span>
                    </span>
                    <div>
                      <span className="text-xs uppercase tracking-widest text-[#576151] font-bold">
                        Active State
                      </span>
                      <h4 className="font-serif text-xl text-[#141310] font-semibold">
                        Cleared for High-Custody Dispatch
                      </h4>
                    </div>
                  </div>

                  <p className="text-sm text-[#4a463f] leading-relaxed">
                    Atelier Chronos &amp; Optics is fully sanctioned. You hold automated settlement release triggers, high-value optical consignment custody, and white-glove courier dispatch privileges.
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center gap-3 text-xs text-[#1c1c18]">
                      <span className="material-symbols-outlined text-[#576151] text-[18px]">check</span>
                      <span>Zero collateral lock-up required on consignments up to $50,000</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#1c1c18]">
                      <span className="material-symbols-outlined text-[#576151] text-[18px]">check</span>
                      <span>Certified Atelier Badge visible across all public listings</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#1c1c18]">
                      <span className="material-symbols-outlined text-[#576151] text-[18px]">check</span>
                      <span>Direct API connection to VNPay Escrow routing network</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCertModalOpen(true)}
                      className="w-full py-3 px-4 bg-[#f1ede6] hover:bg-[#e6e2db] text-[#141310] text-xs uppercase tracking-wider rounded-xl transition-colors font-semibold"
                    >
                      Request Audit Certificate Re-issuance
                    </button>
                  </div>
                </div>
              )}

              {/* STATE: NOT_SUBMITTED */}
              {activeState === 'NOT_SUBMITTED' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl bg-[#e6e2db] text-[#141310] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">draft</span>
                    </span>
                    <div>
                      <span className="text-xs uppercase tracking-widest text-[#7b766f] font-bold">
                        Status State 01
                      </span>
                      <h4 className="font-serif text-xl text-[#141310] font-semibold">
                        Not Submitted (Dossier Draft)
                      </h4>
                    </div>
                  </div>

                  <p className="text-sm text-[#4a463f] leading-relaxed">
                    Atelier credentials are currently drafted. While your authenticated role remains permanently as Shop Owner, tier-3 escrow limits require submitting the 4 custody proofs below.
                  </p>

                  <div className="p-4 bg-[#f7f3ec] rounded-xl space-y-2 text-xs border border-[#ebe8e1]">
                    <div className="text-xs uppercase tracking-wider text-[#141310] font-bold">
                      Mandatory Shop Owner Credentials:
                    </div>
                    <p className="text-[#4a463f]">• Corporate Tax Registry (#US-8842-CORP / MST 0318920192)</p>
                    <p className="text-[#4a463f]">• Leica &amp; Zeiss Optical Bench CLA Certification</p>
                    <p className="text-[#4a463f]">• VNPay Escrow Routing &amp; Bank Settlement Gateway</p>
                    <p className="text-[#4a463f]">• Class IV Vault Security &amp; 45-50% RH Climate Log</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="w-full py-3.5 px-4 bg-[#141310] hover:bg-[#292724] text-[#fdf9f2] text-xs uppercase tracking-wider rounded-xl transition-colors font-semibold shadow-xs"
                  >
                    Submit Verification Dossier
                  </button>
                </div>
              )}

              {/* STATE: PENDING */}
              {activeState === 'PENDING' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl bg-[#f1ede6] text-[#141310] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">hourglass_top</span>
                    </span>
                    <div>
                      <span className="text-xs uppercase tracking-widest text-[#7b766f] font-bold">
                        Step 02 / Curation Queue
                      </span>
                      <h4 className="font-serif text-xl text-[#141310] font-semibold">
                        Under Manual Verification
                      </h4>
                    </div>
                  </div>

                  <p className="text-sm text-[#4a463f] leading-relaxed">
                    Your dossier has been routed to the ReUse Hub Atelier Compliance Board. Our human horologists and legal specialists perform manual cross-checks within 24 hours.
                  </p>

                  <div className="p-4 bg-[#f7f3ec] rounded-xl space-y-3 border border-[#ebe8e1]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#7b766f]">Review Turnaround</span>
                      <span className="text-[#141310] font-semibold">Est. 14 hours remaining</span>
                    </div>
                    <div className="w-full bg-[#e6e2db] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#576151] h-full w-2/3 rounded-full"></div>
                    </div>
                    <span className="block text-right text-[11px] text-[#7b766f] font-mono">
                      Desk Queue: #14 of 42
                    </span>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => showToast('Đã kích hoạt thông báo tiến độ qua SMS & In-app!')}
                      className="text-xs text-[#576151] hover:text-[#141310] hover:underline font-semibold"
                    >
                      Enable SMS and In-App Review Notifications
                    </button>
                  </div>
                </div>
              )}

              {/* STATE: REJECTED */}
              {activeState === 'REJECTED' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">warning</span>
                    </span>
                    <div>
                      <span className="text-xs uppercase tracking-widest text-[#ba1a1a] font-bold">
                        Action Required
                      </span>
                      <h4 className="font-serif text-xl text-[#141310] font-semibold">
                        Remediation Notice
                      </h4>
                    </div>
                  </div>

                  {/* Real-World Example Remediation Alert */}
                  <div className="p-4 bg-[#ffdad6]/40 rounded-xl text-[#1c1c18] space-y-2 border border-[#ffdad6]">
                    <div className="text-xs font-bold text-[#ba1a1a] flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[17px]">error</span>
                      <span>Curator Board Remediation Note:</span>
                    </div>
                    <p className="text-xs text-[#4a463f] leading-relaxed">
                      &ldquo;The submitted Optical Bench CLA Certificate expired on August 31, 2024. In addition, the legal business tax extract (#TX-992) had unreadable seals on page 2. Please upload valid calibration credentials.&rdquo;
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-[#f7f3ec] rounded-xl flex items-center justify-between border border-[#ebe8e1]">
                      <div className="flex items-center gap-2 text-xs text-[#1c1c18]">
                        <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">cancel</span>
                        <span>Optical Bench Accreditation</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="text-xs uppercase tracking-wider text-[#141310] underline font-bold hover:text-[#576151]"
                      >
                        Upload File
                      </button>
                    </div>

                    <div className="p-3 bg-[#f7f3ec] rounded-xl flex items-center justify-between border border-[#ebe8e1]">
                      <div className="flex items-center gap-2 text-xs text-[#1c1c18]">
                        <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">cancel</span>
                        <span>Corporate Tax PDF</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="text-xs uppercase tracking-wider text-[#141310] underline font-bold hover:text-[#576151]"
                      >
                        Re-Scan
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="w-full py-3.5 px-4 bg-[#141310] hover:bg-[#292724] text-[#fdf9f2] text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors font-semibold"
                  >
                    Resubmit Remediation Dossier
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editorial Workshop Visual Feature / Custody Guarantee Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#f1ede6] p-8 md:p-12 rounded-2xl mb-12 border border-[#dddad3]">
          <div className="lg:col-span-5 relative overflow-hidden rounded-xl aspect-[4/3] shadow-xs border border-[#dddad3]">
            <img
              className="w-full h-full object-cover rounded-xl"
              alt="A serene watchmaker and optical specialist bench inside a high-end luxury circular atelier."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtdGk8f6IzGEEgRLG35uZoZoHX368H3E-Q594uXCFX57erGOycAAJXTZodYGzovODk65otINlQEenCbwlrbQuFprRkSQGceZn59c5mWKJtZOV4gisPL-yjSex_7Ud4yn1NnnnzsA8RHxFZIKKcM6Qp8FPO9e-_uu3fJZ2GUoBPT-0LPY9fWSKG2hOAEVbuOSKpvxhH_QLd-eTNvMoeFHnIgQL52CxIbT8E0AYvFvJ5BCREyADGjrUz0A"
            />
            <div className="absolute bottom-3 left-3 bg-[#141310]/85 backdrop-blur-sm px-3 py-1 rounded-lg text-[#fdf9f2] text-[10px] uppercase tracking-widest font-mono">
              Bench Station 02 • Zurich Node
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs uppercase tracking-widest text-[#576151] font-bold">
              Why We Enforce Atelier Calibration
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#141310] font-normal">
              Preserving Value Across Multiple Lifecycles
            </h3>
            <p className="text-sm md:text-base text-[#4a463f] leading-relaxed">
              ReUse Hub is not an anonymous exchange. We operate as an editorial steward. By proving your workshop maintains optical test benches, certified pressure-testing chambers, and genuine horological parts archives, we guarantee to prospective collectors that artifacts under your care retain museum provenance.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#576151] text-[20px]">verified</span>
                <span className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                  Leica Camera AG Calibrated
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#576151] text-[20px]">verified</span>
                <span className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                  ISO 2859 Quality Inspection
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#576151] text-[20px]">verified</span>
                <span className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                  Encrypted Chain-of-Custody
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Concierge Help Strip */}
        <div className="border-t border-[#dddad3] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#7b766f] text-xs">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#576151] text-[22px]">support_agent</span>
            <span>Have compliance questions regarding bench accreditation or tax certificates?</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOmbudsmanModalOpen(true)}
            className="text-xs uppercase tracking-wider text-[#141310] hover:text-[#576151] font-bold flex items-center gap-1 transition-colors"
          >
            <span>Speak with Atelier Ombudsman</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Download Official Certificate (PDF / Print View) */}
      {isCertModalOpen && (
        <div
          onClick={() => setIsCertModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdf9f2] rounded-2xl w-full max-w-2xl shadow-2xl border border-[#dddad3] p-8 lg:p-10 relative cursor-default max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsCertModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f1ede6] flex items-center justify-center text-[#7b766f] hover:text-[#141310] hover:bg-[#e6e2db] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            {/* Certificate Header */}
            <div className="text-center pb-8 border-b border-[#dddad3]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#d8e3ce] text-[#3f4a3a] text-xs uppercase tracking-widest font-semibold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                LEVEL 3 HIGH-CUSTODY CLEARANCE
              </div>
              <h2 className="font-serif text-3xl text-[#141310] font-normal tracking-tight">
                Certificate of Circular Custody Accreditation
              </h2>
              <p className="text-xs uppercase tracking-widest text-[#7b766f] mt-1 font-mono">
                DISPATCH LICENSE #BCORP-VN-ATELIER-774-LV1
              </p>
            </div>

            {/* Certificate Body */}
            <div className="py-6 space-y-4">
              <p className="text-sm text-[#1c1c18] text-center leading-relaxed max-w-lg mx-auto">
                This certifies that <strong className="text-[#141310]">Atelier Chronos &amp; Optics</strong> operated by{' '}
                <strong className="text-[#141310]">Master Curator Vũ Thanh Tùng (#OWNER-01)</strong> has fulfilled the forensic calibration and vault security criteria mandated by the ReUse Hub Archival Alliance.
              </p>

              <div className="grid grid-cols-2 gap-4 p-5 bg-[#f7f3ec] rounded-xl border border-[#ebe8e1] text-xs">
                <div>
                  <span className="block text-[#7b766f] uppercase tracking-wider font-semibold">Legal Tax Registry</span>
                  <span className="font-mono text-[#141310] font-bold">#US-8842-CORP / MST 0318920192</span>
                </div>
                <div>
                  <span className="block text-[#7b766f] uppercase tracking-wider font-semibold">Optical Bench Spec</span>
                  <span className="font-mono text-[#141310] font-bold">Leica Wetzlar &amp; Zeiss CLA</span>
                </div>
                <div>
                  <span className="block text-[#7b766f] uppercase tracking-wider font-semibold">Escrow Node</span>
                  <span className="font-mono text-[#141310] font-bold">#ATELIER-774-SETTLEMENT</span>
                </div>
                <div>
                  <span className="block text-[#7b766f] uppercase tracking-wider font-semibold">Audit Expiry</span>
                  <span className="font-mono text-[#576151] font-bold">October 31, 2025</span>
                </div>
              </div>
            </div>

            {/* Certificate Footer / Print CTA */}
            <div className="pt-6 border-t border-[#dddad3] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#7b766f] font-mono">
                <span className="material-symbols-outlined text-[17px] text-[#576151]">verified</span>
                <span>CRYPTOGRAPHIC SEAL SHA-256</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#dddad3] text-xs font-semibold uppercase tracking-wider text-[#4a463f] hover:bg-[#f1ede6]"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    showToast('Đang mở hộp thoại in / lưu PDF chứng chỉ...');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#141310] hover:bg-[#292724] text-[#fdf9f2] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[17px]">print</span>
                  <span>In / Lưu PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Inspect Hash & Cryptographic Ledger */}
      {isHashModalOpen && (
        <div
          onClick={() => setIsHashModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdf9f2] rounded-2xl w-full max-w-xl shadow-2xl border border-[#dddad3] p-6 lg:p-8 relative cursor-default"
          >
            <button
              onClick={() => setIsHashModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f1ede6] flex items-center justify-center text-[#7b766f] hover:text-[#141310] hover:bg-[#e6e2db] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#d8e3ce] flex items-center justify-center text-[#3f4a3a]">
                <span className="material-symbols-outlined text-[26px]">encrypted</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[#576151] font-bold">
                  LEDGER PROVENANCE BLOCK #84910
                </span>
                <h3 className="font-serif text-2xl text-[#141310] font-semibold">
                  Sổ Cái Bằng Chứng Mật Mã
                </h3>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs text-[#1c1c18]">
              <div className="p-3 bg-white rounded-xl border border-[#dddad3] space-y-1">
                <span className="text-[#7b766f] text-[11px] uppercase tracking-wider font-sans font-semibold">Block Hash</span>
                <div
                  onClick={() =>
                    copyToClipboard(
                      '0x84910a39fbc892d8471e9a2b849102c9849201f829c481928471029384719201',
                      'Block Hash'
                    )
                  }
                  className="font-mono text-xs text-[#141310] break-all cursor-pointer hover:text-[#576151]"
                  title="Nhấp để sao chép"
                >
                  0x84910a39fbc892d8471e9a2b849102c9849201f829c481928471029384719201
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#dddad3] space-y-1">
                <span className="text-[#7b766f] text-[11px] uppercase tracking-wider font-sans font-semibold">Merkle Root</span>
                <div className="font-mono text-xs text-[#141310] break-all">
                  0x9c481928471029384719201a39fbc892d8471e9a2b849102c9849201f829c481
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-[#dddad3]">
                  <span className="text-[#7b766f] text-[11px] uppercase tracking-wider font-sans font-semibold">Timestamp</span>
                  <div className="text-xs text-[#141310] font-semibold mt-0.5">14/10/2024 16:20:01 GMT+7</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#dddad3]">
                  <span className="text-[#7b766f] text-[11px] uppercase tracking-wider font-sans font-semibold">Validator Node</span>
                  <div className="text-xs text-[#576151] font-semibold mt-0.5">#NODE-SGN-01 (ACTIVE)</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#dddad3] flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setIsHashModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#141310] text-[#fdf9f2] text-xs font-semibold uppercase tracking-wider"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Submit / Re-scan Dossier Modal */}
      {isSubmitModalOpen && (
        <div
          onClick={() => setIsSubmitModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdf9f2] rounded-2xl w-full max-w-xl shadow-2xl border border-[#dddad3] p-6 lg:p-8 relative cursor-default max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f1ede6] flex items-center justify-center text-[#7b766f] hover:text-[#141310] hover:bg-[#e6e2db] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="mb-6">
              <span className="text-xs uppercase tracking-wider text-[#576151] font-bold">
                DOSSIER SUBMISSION
              </span>
              <h3 className="font-serif text-2xl text-[#141310] font-semibold mt-1">
                Tải Lên Hồ Sơ Thẩm Định Xưởng
              </h3>
              <p className="text-xs text-[#7b766f] mt-1 leading-relaxed">
                Hội đồng thẩm định ReUse Hub sẽ xử lý kiểm tra tài liệu trong vòng 24 giờ làm việc.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsSubmitModalOpen(false);
                setActiveState('PENDING');
                showToast('Hồ sơ đã được gửi thành công! Đang chuyển sang trạng thái chờ duyệt (Pending).');
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#141310] uppercase tracking-wider mb-1">
                  1. Giấy Phép ĐKKD / Mã Số Thuế Doanh Nghiệp (PDF)
                </label>
                <div className="border-2 border-dashed border-[#ccc5bc] rounded-xl p-4 text-center hover:bg-[#f1ede6] transition-colors cursor-pointer bg-white">
                  <span className="material-symbols-outlined text-[28px] text-[#7b766f]">upload_file</span>
                  <div className="text-xs text-[#141310] font-medium mt-1">Kéo thả file PDF hoặc nhấp để chọn</div>
                  <div className="text-[10px] text-[#7b766f]">Tối đa 25MB • Định dạng PDF, PNG, JPG</div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#141310] uppercase tracking-wider mb-1">
                  2. Chứng Chỉ Căn Chuẩn Quang Học Collimator &amp; CLA
                </label>
                <div className="border-2 border-dashed border-[#ccc5bc] rounded-xl p-4 text-center hover:bg-[#f1ede6] transition-colors cursor-pointer bg-white">
                  <span className="material-symbols-outlined text-[28px] text-[#7b766f]">verified</span>
                  <div className="text-xs text-[#141310] font-medium mt-1">Chứng chỉ Leica, Hasselblad, Carl Zeiss</div>
                  <div className="text-[10px] text-[#7b766f]">Đính kèm bản scan công chứng còn hạn</div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#141310] uppercase tracking-wider mb-1">
                  3. Ảnh Chụp Bàn Thao Tác &amp; Tủ Hút Ẩm (Showroom Vault)
                </label>
                <div className="border-2 border-dashed border-[#ccc5bc] rounded-xl p-4 text-center hover:bg-[#f1ede6] transition-colors cursor-pointer bg-white">
                  <span className="material-symbols-outlined text-[28px] text-[#7b766f]">photo_camera</span>
                  <div className="text-xs text-[#141310] font-medium mt-1">Ảnh thực địa phòng lab kiểm định</div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#dddad3] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#dddad3] text-xs font-semibold uppercase tracking-wider text-[#4a463f] hover:bg-[#f1ede6]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#141310] hover:bg-[#292724] text-[#fdf9f2] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Gửi Hồ Sơ Xét Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Ombudsman Contact Channel */}
      {isOmbudsmanModalOpen && (
        <div
          onClick={() => setIsOmbudsmanModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdf9f2] rounded-2xl w-full max-w-lg shadow-2xl border border-[#dddad3] p-6 lg:p-8 relative cursor-default"
          >
            <button
              onClick={() => setIsOmbudsmanModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f1ede6] flex items-center justify-center text-[#7b766f] hover:text-[#141310] hover:bg-[#e6e2db] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#d8e3ce] flex items-center justify-center text-[#3f4a3a]">
                <span className="material-symbols-outlined text-[24px]">support_agent</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[#576151] font-bold">
                  DIRECT ESCALATION DESK
                </span>
                <h3 className="font-serif text-2xl text-[#141310] font-semibold">
                  Atelier Ombudsman Office
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#4a463f] leading-relaxed mb-4">
              Đường dây nóng hỗ trợ độc lập dành riêng cho các chủ xưởng lưu ký. Chuyên giải quyết khúc mắc về chỉ số phòng lab, thẩm định quang học và đối soát Escrow.
            </p>

            <div className="space-y-3 text-xs mb-6">
              <div className="p-3 bg-white rounded-xl border border-[#dddad3] flex items-center justify-between">
                <div>
                  <span className="text-[#7b766f] block">Ombudsman Desk Hotline</span>
                  <span className="font-mono font-bold text-[#141310] text-sm">+84 (0) 28 8849 0192</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#d8e3ce] text-[#3f4a3a] text-[10px] font-bold uppercase">
                  Available 24/7
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#dddad3] flex items-center justify-between">
                <div>
                  <span className="text-[#7b766f] block">Direct Counsel Email</span>
                  <span className="font-mono font-bold text-[#141310]">ombudsman@reusehub.archetype</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#e6e2db] text-[#141310] text-[10px] font-bold uppercase">
                  PGP Signed
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsOmbudsmanModalOpen(false);
                  showToast('Đã gửi yêu cầu kết nối tới văn phòng Ombudsman!');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#141310] text-[#fdf9f2] text-xs font-semibold uppercase tracking-wider hover:bg-[#292724]"
              >
                Gửi Yêu Cầu Kết Nối Trực Tiếp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopOwnerKyc;
