import React from "react";
import { Link } from "react-router-dom";

export const AdminFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#f7f3ec] text-[#4a463f] border-t border-[#ccc5bc]/40 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand monograph */}
          <div className="space-y-4 lg:col-span-1">
            <div className="font-serif text-2xl font-bold text-[#1c1c18]">
              ReUse Hub
            </div>
            <p className="text-sm text-[#4a463f] leading-relaxed">
              An intentional architectural monograph for the circular economy. Curating circular luxury and pre-owned guardianship.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d8e3ce] text-[#5b6655] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#576151]"></span>
              <span>CERTIFIED B-CORP CIRCULAR STANDARD</span>
            </div>
          </div>

          {/* RENT column */}
          <div className="space-y-3">
            <div className="text-sm uppercase tracking-wider font-semibold text-[#1c1c18]">
              RENT
            </div>
            <ul className="space-y-2.5 text-sm text-[#4a463f]">
              <li>
                <Link to="/rent" className="hover:text-[#1c1c18] transition-colors">
                  Khám phá đồ thuê
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[#1c1c18] transition-colors">
                  Quy trình RENT
                </Link>
              </li>
              <li>
                <a href="#escrow-policy" className="hover:text-[#1c1c18] transition-colors">
                  Bảo hiểm lưu ký
                </a>
              </li>
              <li>
                <a href="#return-terms" className="hover:text-[#1c1c18] transition-colors">
                  Chính sách hoàn trả
                </a>
              </li>
            </ul>
          </div>

          {/* THRIFT column */}
          <div className="space-y-3">
            <div className="text-sm uppercase tracking-wider font-semibold text-[#1c1c18]">
              THRIFT
            </div>
            <ul className="space-y-2.5 text-sm text-[#4a463f]">
              <li>
                <Link to="/thrift" className="hover:text-[#1c1c18] transition-colors">
                  Bộ sưu tập Secondhand
                </Link>
              </li>
              <li>
                <a href="#inspection" className="hover:text-[#1c1c18] transition-colors">
                  Chứng nhận Giám định
                </a>
              </li>
              <li>
                <a href="#restoration" className="hover:text-[#1c1c18] transition-colors">
                  Vật phẩm phục chế
                </a>
              </li>
              <li>
                <a href="#digital-passport" className="hover:text-[#1c1c18] transition-colors">
                  Sổ tay lưu ký số
                </a>
              </li>
            </ul>
          </div>

          {/* ABOUT & GOVERNANCE column */}
          <div className="space-y-3">
            <div className="text-sm uppercase tracking-wider font-semibold text-[#1c1c18]">
              ABOUT & GOVERNANCE
            </div>
            <ul className="space-y-2.5 text-sm text-[#4a463f]">
              <li>
                <Link to="/about" className="hover:text-[#1c1c18] transition-colors">
                  Tuyên ngôn Tuần hoàn
                </Link>
              </li>
              <li>
                <a href="#b-corp" className="hover:text-[#1c1c18] transition-colors">
                  Tiêu chuẩn B-Corp
                </a>
              </li>
              <li>
                <a href="#custody-rules" className="hover:text-[#1c1c18] transition-colors">
                  Quy chế Lưu ký
                </a>
              </li>
              <li>
                <a href="#transparency" className="hover:text-[#1c1c18] transition-colors">
                  Báo cáo minh bạch
                </a>
              </li>
            </ul>
          </div>

          {/* ACCOUNT & SUPPORT column */}
          <div className="space-y-3">
            <div className="text-sm uppercase tracking-wider font-semibold text-[#1c1c18]">
              ACCOUNT & SUPPORT
            </div>
            <ul className="space-y-2.5 text-sm text-[#4a463f]">
              <li>
                <Link to="/admin/dashboard" className="hover:text-[#1c1c18] transition-colors font-medium">
                  Cổng Quản Trị Viên
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#1c1c18] transition-colors">
                  Điều khoản Dịch vụ
                </Link>
              </li>
              <li>
                <a href="#appraisal-center" className="hover:text-[#1c1c18] transition-colors">
                  Trung tâm Giám định
                </a>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#1c1c18] transition-colors">
                  Hỗ trợ Khẩn cấp
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-16 pt-8 border-t border-[#ccc5bc]/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#7b766f]">
          <div className="text-center md:text-left">
            © 2026 ReUse Hub Platform Administration. Certified Circular Platform B-Corp.
          </div>
          <div className="flex items-center gap-6 uppercase tracking-wider font-semibold text-[11px]">
            <span>Encrypted Platform Clearance</span>
            <span>•</span>
            <span>Node 4.1 Authenticated</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;
