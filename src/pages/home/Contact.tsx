import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppSidebar } from '../../components/layout/AppSidebar';

interface ContactFormData {
  fullName: string;
  email: string;
  phone: string;
  topic: string;
  orderId: string;
  message: string;
}

export const ContactPage: React.FC = () => {
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
  const [activeTab, setActiveTab] = useState<'form' | 'success'>('form');
  const [copied, setCopied] = useState<boolean>(false);
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    phone: '',
    topic: '',
    orderId: '',
    message: '',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@reusehub.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab('success');
  };

  return (
    <div className="w-full min-h-screen bg-[#FBF9F5] text-[#1C1A18] antialiased py-6 sm:py-10 px-4 sm:px-6 lg:px-8 contact-page-scope">
      {/* Khung căn giữa tương thích MasterLayout */}
            {/* ── MAIN WORKSPACE CONTAINER WITH PERSISTENT SIDEBAR ── */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* Navigation Sidebar */}
        <AppSidebar activeKey="contact" />

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* Quick inline restore chip if user clicked collapse button to hide sidebar */}
          {isSidebarCollapsed && (
            <div className="flex items-center gap-2 -mb-4 animate-fade-in">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('reuse_user_sidebar_toggle', { detail: false }))}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E4DC] text-xs font-semibold text-[#1C1A18] hover:bg-[#F6F3EE] hover:border-[#1C1A18]/40 transition-all shadow-2xs cursor-pointer group"
                title="Mở lại menu điều hướng"
              >
                <span className="material-symbols-outlined text-[18px] text-[#5E6D5B] group-hover:scale-110 transition-transform">
                  menu
                </span>
                <span>Hiện menu điều hướng</span>
              </button>
            </div>
          )}

          <div className="w-full flex flex-col">
        {/* Style injection đồng bộ 100% với FAQ.tsx */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

          .contact-page-scope {
            font-family: 'Plus Jakarta Sans', sans-serif !important;
          }

          .contact-page-scope .font-serif,
          .contact-page-scope h1,
          .contact-page-scope h2,
          .contact-page-scope h3 {
            font-family: 'Playfair Display', Georgia, serif !important;
          }

          .contact-page-scope .material-symbols-outlined {
            font-family: 'Material Symbols Outlined' !important;
            font-weight: normal;
            font-style: normal;
            display: inline-block;
            line-height: 1;
            text-transform: none;
            letter-spacing: normal;
            word-wrap: normal;
            white-space: nowrap;
            direction: ltr;
            -webkit-font-smoothing: antialiased;
          }

          .contact-page-scope input:focus,
          .contact-page-scope select:focus,
          .contact-page-scope textarea:focus {
            outline: none !important;
            border-color: #1C1A18 !important;
            box-shadow: 0 0 0 1px #1C1A18 !important;
          }
        `}</style>

        {/* 1. BREADCRUMBS */}
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-stone-500 mb-6 flex items-center gap-2 tracking-wide">
          <Link className="hover:text-stone-900 transition-colors" to="/">Trang chủ</Link>
          <span className="text-stone-300">/</span>
          <Link className="hover:text-stone-900 transition-colors" to="/how-it-works">Hệ sinh thái</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-900 font-semibold">Liên hệ hỗ trợ</span>
        </nav>

        {/* 2. HERO HEADER */}
        <header className="mb-10 pb-8 border-b border-[#E7E2DA]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F0EA] border border-[#E7E2DA] text-[11px] uppercase tracking-widest font-semibold text-stone-800 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1C1A18]"></span>
            Hỗ trợ · Liên hệ trực tiếp
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-[#1C1A18] mb-3">
            Liên hệ ReUse Hub
          </h1>
          <p className="text-base text-[#5E5A53] max-w-2xl leading-relaxed font-sans">
            Bạn có câu hỏi về thuê, mua, thanh toán hoặc đơn hàng? Đội ngũ hỗ trợ chuyên sâu của ReUse Hub sẵn sàng giải đáp và đồng hành cùng hành trình tuần hoàn của bạn.
          </p>
        </header>

        {/* 3. TWO-COLUMN GRID: THÔNG TIN & FORM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* CỘT TRÁI: THÔNG TIN LIÊN HỆ */}
          <section className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#1C1A18] mb-2.5">
                Chúng tôi có thể giúp gì cho bạn?
              </h2>
              <p className="text-[13px] leading-relaxed text-[#5E5A53]">
                ReUse Hub tiếp nhận mọi thắc mắc từ khách hàng cá nhân, đại diện doanh nghiệp, và các chủ sở hữu thiết bị (Shop Owner) tham gia mạng lưới ký gửi tuần hoàn.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Email */}
              <div className="p-4 rounded-2xl bg-white border border-[#E7E2DA] flex items-start justify-between shadow-xs hover:border-[#1C1A18] transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#FBF9F5] border border-[#E7E2DA] flex items-center justify-center shrink-0 text-[#1C1A18]">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold tracking-wider text-[#78736A] uppercase">Hộp thư hỗ trợ</span>
                    <a className="block text-sm font-bold text-[#1C1A18] hover:underline mt-0.5" href="mailto:support@reusehub.com">
                      support@reusehub.com
                    </a>
                    <span className="text-[11px] text-[#78736A]">Phản hồi nhanh trong 2–4 giờ</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="text-[11px] text-[#5E5A53] hover:text-[#1C1A18] border border-[#E7E2DA] hover:border-[#1C1A18] rounded px-2.5 py-1 mt-0.5 transition-colors font-medium"
                >
                  {copied ? 'Đã sao chép' : 'Copy'}
                </button>
              </div>

              {/* Phone */}
              <div className="p-4 rounded-2xl bg-white border border-[#E7E2DA] flex items-start gap-3.5 shadow-xs hover:border-[#1C1A18] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#FBF9F5] border border-[#E7E2DA] flex items-center justify-center shrink-0 text-[#1C1A18]">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-[#78736A] uppercase">Tổng đài Concierge</span>
                  <div className="text-sm font-bold text-[#1C1A18] mt-0.5">
                    <a className="hover:underline" href="tel:+842873008899">+84 (0) 28 7300 8899</a>
                    <span className="text-[#B5B0A4] font-normal mx-1">·</span>
                    <a className="hover:underline" href="tel:+84908421892">+84 908 421 892</a>
                  </div>
                  <span className="text-[11px] text-[#78736A]">Bàn làm việc giám sát giao nhận</span>
                </div>
              </div>

              {/* Giờ làm việc */}
              <div className="p-4 rounded-2xl bg-white border border-[#E7E2DA] flex items-start gap-3.5 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-[#FBF9F5] border border-[#E7E2DA] flex items-center justify-center shrink-0 text-[#1C1A18]">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                </div>
                <div className="text-[12px] leading-relaxed">
                  <span className="text-[11px] font-semibold tracking-wider text-[#78736A] uppercase">Khung giờ hoạt động</span>
                  <div className="font-medium text-[#1C1A18] mt-0.5">Thứ Hai – Thứ Sáu: <span className="font-bold">08:00 – 17:30 (ICT)</span></div>
                  <div className="font-medium text-[#1C1A18]">Thứ Bảy: <span className="font-bold">08:30 – 12:30 (ICT)</span></div>
                  <div className="text-[#78736A] text-[11px] mt-0.5">Chủ Nhật & Ngày lễ: Trực tin nhắn khẩn cấp qua kênh Escrow</div>
                </div>
              </div>

              {/* Trạm giao nhận Hub */}
              <div className="p-4 rounded-2xl bg-white border border-[#E7E2DA] flex items-start gap-3.5 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-[#FBF9F5] border border-[#E7E2DA] flex items-center justify-center shrink-0 text-[#1C1A18]">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
                <div className="text-[12px] space-y-1">
                  <span className="text-[11px] font-semibold tracking-wider text-[#78736A] uppercase">Trạm đối soát & Giao nhận</span>
                  <div className="text-[#1C1A18]">
                    <strong className="font-semibold">Hub TP. Hồ Chí Minh:</strong> Hub A-12, Thảo Điền, TP. Thủ Đức.
                  </div>
                  <div className="text-[#1C1A18]">
                    <strong className="font-semibold">Hub Hà Nội:</strong> Hub 24, Phố Tràng Tiền, Quận Hoàn Kiếm.
                  </div>
                </div>
              </div>
            </div>

            {/* Nhóm chủ đề ưu tiên */}
            <div className="p-5 rounded-2xl bg-[#F4F0EA] border border-[#E7E2DA]">
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#1C1A18] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1C1A18]"></span>
                Các nhóm chủ đề được hỗ trợ ưu tiên
              </h3>
              <ul className="space-y-2 text-[12px] text-[#5E5A53]">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#52796F]">check_circle</span>
                  <span><strong>Dịch vụ RENT:</strong> Điều chỉnh lịch thuê, hoàn cọc Escrow, kiểm tra thiết bị</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#52796F]">check_circle</span>
                  <span><strong>Dịch vụ THRIFT:</strong> Nhật ký kiểm định Audit Bench, chính sách hoàn trả 72h</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#52796F]">check_circle</span>
                  <span><strong>Thanh toán VNPay:</strong> Tra cứu mã giao dịch, hóa đơn VAT công ty</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#52796F]">check_circle</span>
                  <span><strong>Vận chuyển & Giao nhận:</strong> Tình trạng đóng thùng và bàn giao niêm phong</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#52796F]">check_circle</span>
                  <span><strong>Định danh KYC:</strong> Mở rộng hạn mức bảo lãnh thiết bị cao cấp</span>
                </li>
              </ul>
            </div>

            {/* FAQ Box */}
            <div className="p-5 rounded-2xl bg-white border border-[#E7E2DA] flex items-start gap-4 shadow-xs">
              <span className="text-2xl mt-0.5">💡</span>
              <div className="space-y-1.5">
                <h4 className="text-[13px] font-bold text-[#1C1A18]">Bạn muốn tìm câu trả lời tức thì?</h4>
                <p className="text-[12px] text-[#78736A] leading-relaxed">
                  Hơn 30 câu hỏi về tiền cọc, quy trình vận chuyển, tiêu chuẩn vệ sinh đã được giải đáp chi tiết trong mục Hỏi & Đáp.
                </p>
                <Link className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#1C1A18] hover:underline pt-1" to="/faq">
                  Xem câu hỏi thường gặp FAQ →
                </Link>
              </div>
            </div>
          </section>

          {/* CỘT PHẢI: FORM GỬI YÊU CẦU */}
          <section className="lg:col-span-7">
            <div className="bg-white p-7 md:p-9 rounded-3xl border border-[#E7E2DA] shadow-xs relative">
              {/* Header của Box Form */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#E7E2DA]">
                <div>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-[#1C1A18]">
                    Gửi yêu cầu hỗ trợ
                  </h3>
                  <p className="text-[12px] text-[#78736A] mt-0.5">
                    Khách vãng lai và thành viên đều có thể gửi tin nhắn mà không bắt buộc đăng nhập trước.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-[#FBF9F5] p-1 rounded-lg border border-[#E7E2DA] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className={`px-3 py-1.5 rounded font-semibold transition-all ${
                      activeTab === 'form' ? 'bg-[#1C1A18] text-white shadow-xs' : 'text-[#78736A] hover:text-[#1C1A18]'
                    }`}
                  >
                    Form nhập liệu
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('success')}
                    className={`px-3 py-1.5 rounded font-semibold transition-all ${
                      activeTab === 'success' ? 'bg-[#1C1A18] text-white shadow-xs' : 'text-[#78736A] hover:text-[#1C1A18]'
                    }`}
                  >
                    Mẫu đã gửi
                  </button>
                </div>
              </div>

              {/* TRẠNG THÁI 1: FORM NHẬP LIỆU */}
              {activeTab === 'form' ? (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-bold text-[#1C1A18]" htmlFor="fullName">
                        Họ và tên <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        required
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g. Nguyễn Văn An"
                        className="w-full text-[13px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl focus:bg-white text-[#1C1A18] placeholder-[#A09B90] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-bold text-[#1C1A18]" htmlFor="email">
                        Email liên hệ <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        required
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com - để nhận phản hồi"
                        className="w-full text-[13px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl focus:bg-white text-[#1C1A18] placeholder-[#A09B90] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-bold text-[#1C1A18]" htmlFor="phone">
                        Số điện thoại <span className="text-[11px] font-normal text-[#78736A]">(Tùy chọn)</span>
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+84 908 xxx xxx"
                        className="w-full text-[13px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl focus:bg-white text-[#1C1A18] placeholder-[#A09B90] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-bold text-[#1C1A18]" htmlFor="topic">
                        Chủ đề yêu cầu <span className="text-rose-600">*</span>
                      </label>
                      <select
                        id="topic"
                        name="topic"
                        required
                        value={formData.topic}
                        onChange={handleChange}
                        className="w-full text-[13px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl focus:bg-white text-[#1C1A18] transition-colors"
                      >
                        <option value="" disabled>Chọn lĩnh vực bạn cần tư vấn</option>
                        <option value="rent">Hỗ trợ đơn thuê RENT (Cọc & Escrow)</option>
                        <option value="thrift">Hỏi về sản phẩm THRIFT & Kiểm định</option>
                        <option value="payment">Thanh toán VNPay & Hóa đơn VAT</option>
                        <option value="shipping">Quy trình vận chuyển & Giao nhận</option>
                        <option value="kyc">Xác minh danh tính KYC & Bảo lãnh</option>
                        <option value="feedback">Góp ý dịch vụ hoặc Khiếu nại</option>
                        <option value="other">Khác (Hợp tác / Đối tác cung ứng)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[12px] font-bold text-[#1C1A18]" htmlFor="orderId">
                        Mã đơn hàng liên quan <span className="text-[11px] font-normal text-[#78736A]">(Nếu có)</span>
                      </label>
                      <span className="text-[11px] text-[#9D988E]">Ví dụ: #RH-RNT-8821 hoặc #RH-THF-3012</span>
                    </div>
                    <input
                      id="orderId"
                      name="orderId"
                      type="text"
                      value={formData.orderId}
                      onChange={handleChange}
                      placeholder="#RH-RNT-xxxx hoặc #RH-THF-xxxx"
                      className="w-full text-[13px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl focus:bg-white text-[#1C1A18] placeholder-[#A09B90] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-bold text-[#1C1A18]" htmlFor="message">
                      Nội dung tin nhắn <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Mô tả chi tiết câu hỏi, thời gian thuê dự kiến hoặc sự cố bạn gặp phải. Chúng tôi sẽ phân công nhân sự chuyên môn phản hồi lại bạn..."
                      className="w-full text-[13px] p-3.5 bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl focus:bg-white text-[#1C1A18] placeholder-[#A09B90] transition-colors resize-y leading-relaxed"
                    ></textarea>
                  </div>

                  <div className="p-3 bg-[#FBF9F5] rounded-xl border border-dashed border-[#D6D0C4] flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2.5 text-[#5E5A53]">
                      <span className="material-symbols-outlined text-base text-[#1C1A18]">attach_file</span>
                      <span>Đính kèm ảnh hiện trạng hoặc biên lai chuyển khoản (tùy chọn)</span>
                    </div>
                    <label className="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-[#1C1A18] hover:underline bg-white px-3 py-1.5 rounded-lg border border-[#E7E2DA]">
                      Chọn tệp
                      <input type="file" accept="image/*,.pdf" className="hidden" />
                    </label>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      id="privacy-consent"
                      required
                      defaultChecked
                      type="checkbox"
                      className="mt-1 h-3.5 w-3.5 rounded text-[#1C1A18] border-[#D6D0C4] focus:ring-0"
                    />
                    <label htmlFor="privacy-consent" className="text-[11px] text-[#78736A] leading-relaxed">
                      Tôi đồng ý để ReUse Hub xử lý dữ liệu liên hệ trên nhằm mục đích hỗ trợ và đối soát thông tin đơn hàng theo chính sách bảo mật dữ liệu.
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-[#1C1A18] hover:bg-neutral-800 text-white font-medium py-3.5 px-6 rounded-full text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
                    >
                      <span>Gửi tin nhắn hỗ trợ</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                    <div className="text-center text-[11px] text-[#78736A] mt-2.5 flex items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-emerald-600">check_circle</span>
                      <span>Cam kết bảo mật • Phản hồi qua email trong vòng 2–4 giờ làm việc</span>
                    </div>
                  </div>
                </form>
              ) : (
                /* TRẠNG THÁI 2: ĐÃ GỬI THÀNH CÔNG */
                <div className="py-8 px-4 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-[#EFF5F2] border border-[#C5DDD2] text-[#396956] flex items-center justify-center mx-auto shadow-sm">
                    <span className="material-symbols-outlined text-3xl">check</span>
                  </div>
                  <div className="space-y-2">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#396956] bg-[#E8F0ED] px-3 py-1 rounded-full">
                      Tiếp nhận thành công
                    </span>
                    <h4 className="text-2xl font-serif font-bold text-[#1C1A18]">
                      Yêu cầu hỗ trợ đã được ghi nhận!
                    </h4>
                    <p className="text-[13px] text-[#78736A] max-w-md mx-auto leading-relaxed">
                      Mã số phiếu tiếp nhận của bạn là <strong className="text-[#1C1A18] font-mono">#RH-REQ-8492</strong>. Một thông báo xác nhận tự động đã được gửi tới email của bạn.
                    </p>
                  </div>

                  <div className="bg-[#FBF9F5] border border-[#E7E2DA] p-5 rounded-2xl max-w-md mx-auto text-left text-[12px] space-y-2.5">
                    <div className="flex justify-between pb-2 border-b border-[#E7E2DA]">
                      <span className="text-[#78736A]">Thời gian tạo:</span>
                      <span className="font-medium text-[#1C1A18]">Hôm nay (Giờ Việt Nam)</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-[#E7E2DA]">
                      <span className="text-[#78736A]">Phân loại hỗ trợ:</span>
                      <span className="font-semibold text-[#1C1A18]">Dịch vụ RENT & Smart Escrow</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#78736A]">Dự kiến phản hồi:</span>
                      <span className="font-medium text-[#396956]">Trong vòng 2–4 giờ</span>
                    </div>
                  </div>

                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('form')}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#1C1A18] text-[#1C1A18] hover:bg-[#1C1A18] hover:text-white transition-colors text-[13px] font-medium"
                    >
                      Gửi yêu cầu khác
                    </button>
                    <Link
                      to="/faq"
                      className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1C1A18] text-white hover:bg-neutral-800 transition-colors text-[13px] font-medium"
                    >
                      Khám phá thêm FAQ
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 4. BOTTOM SUPPORT BANNER */}
        <section className="mt-16 bg-[#1C1A18] text-[#FBF9F5] rounded-3xl p-8 md:p-12 text-center relative overflow-hidden border border-black shadow-lg">
          <div className="relative z-10 max-w-2xl mx-auto space-y-3.5">
            <div className="text-[10px] tracking-widest uppercase font-semibold text-[#78736A]">
              KẾT NỐI VỚI CHUYÊN VIÊN
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-white">
              Bạn vẫn cần hỗ trợ?
            </h2>
            <p className="text-[13px] text-[#E7E2DA]/80 leading-relaxed">
              Đội ngũ chuyên viên tư vấn của ReUse Hub luôn sẵn sàng giải đáp mọi thắc mắc về điều khoản thuê, hợp đồng và quy trình bảo chứng.
            </p>
            <div className="pt-2">
              <a
                className="inline-flex items-center gap-2 bg-white text-[#1C1A18] hover:bg-[#F4F0EA] font-medium px-6 py-2.5 rounded-full text-[13px] transition-all shadow-sm"
                href="mailto:support@reusehub.com"
              >
                <span>Liên hệ ReUse Hub</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
            <div className="pt-3 text-[11px] text-[#78736A] flex items-center justify-center gap-4">
              <Link className="hover:text-white transition-colors" to="/how-it-works">Xem Cách hoạt động</Link>
              <span>·</span>
              <Link className="hover:text-white transition-colors" to="/about">Về ReUse Hub</Link>
            </div>
          </div>
        </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContactPage;