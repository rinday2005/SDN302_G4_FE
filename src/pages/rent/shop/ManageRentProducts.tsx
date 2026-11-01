import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../../../context/ShopContext';

export const ManageRentProducts: React.FC = () => {
  const { products, deleteProduct, toggleVisibility } = useShop();

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10; // Đạt chuẩn AC phân trang 10 item/trang

  const handleDelete = (sku: string, name: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}" (SKU: ${sku})?`)) {
      deleteProduct(sku);
    }
  };

  // Lọc sản phẩm
  const filteredProducts = products.filter((p) => {
    if (activeTab === 'APPROVED' && p.approvalStatus !== 'APPROVED') return false;
    if (activeTab === 'PENDING' && p.approvalStatus !== 'PENDING') return false;
    if (activeTab === 'REJECTED' && p.approvalStatus !== 'REJECTED') return false;
    if (activeTab === 'VISIBLE' && !p.isVisible) return false;
    if (activeTab === 'HIDDEN' && p.isVisible) return false;

    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Phân trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full flex flex-col font-sans text-[#1c1c18] bg-[#fdf9f2]">
      <div className="max-w-[1440px] mx-auto px-5 lg:px-12 py-8 w-full flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#141310]">
              Quản lý Sản phẩm Cho thuê RENT
            </h1>
            <p className="text-xs text-[#7b766f] mt-1">Danh mục sản phẩm thuộc Shop Owner hiện tại ({products.length} sản phẩm)</p>
          </div>
          <Link
            to="/shop/rent/create"
            className="px-5 py-2.5 rounded bg-[#141310] text-white text-xs uppercase tracking-wider font-semibold shadow hover:bg-[#292724] transition-all"
          >
            + Tạo sản phẩm mới
          </Link>
        </div>

        {/* Tab & Tìm kiếm */}
        <div className="p-4 bg-[#f7f3ec] rounded border border-[#ebe8e1] space-y-3">
          <div className="flex gap-2 overflow-x-auto text-xs uppercase font-semibold">
            <button
              onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded ${activeTab === 'ALL' ? 'bg-[#141310] text-white' : 'bg-white text-gray-700'}`}
            >
              Tất cả ({products.length})
            </button>
            <button
              onClick={() => { setActiveTab('APPROVED'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded ${activeTab === 'APPROVED' ? 'bg-[#141310] text-white' : 'bg-white text-gray-700'}`}
            >
              Đã duyệt ({products.filter((p) => p.approvalStatus === 'APPROVED').length})
            </button>
            <button
              onClick={() => { setActiveTab('PENDING'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded ${activeTab === 'PENDING' ? 'bg-[#141310] text-white' : 'bg-white text-gray-700'}`}
            >
              Chờ duyệt ({products.filter((p) => p.approvalStatus === 'PENDING').length})
            </button>
            <button
              onClick={() => { setActiveTab('VISIBLE'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded ${activeTab === 'VISIBLE' ? 'bg-[#141310] text-white' : 'bg-white text-gray-700'}`}
            >
              Đang hiện ({products.filter((p) => p.isVisible).length})
            </button>
            <button
              onClick={() => { setActiveTab('HIDDEN'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded ${activeTab === 'HIDDEN' ? 'bg-[#141310] text-white' : 'bg-white text-gray-700'}`}
            >
              Đang ẩn ({products.filter((p) => !p.isVisible).length})
            </button>
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm theo tên máy, SKU, hãng sản xuất..."
            className="w-full px-4 py-2 bg-white rounded border border-[#ebe8e1] text-xs focus:outline-none"
          />
        </div>

        {/* Danh sách Table */}
        <div className="bg-white rounded border border-[#ebe8e1] overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f1ede6] uppercase tracking-wider font-semibold text-[#4a463f]">
              <tr>
                <th className="py-3 px-4">Hiện vật &amp; SKU</th>
                <th className="py-3 px-4">Giá thuê / Cọc</th>
                <th className="py-3 px-4">Trạng thái duyệt</th>
                <th className="py-3 px-4">Hiển thị</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1ede6]">
              {paginatedProducts.map((p) => (
                <tr key={p.sku} className="hover:bg-[#f7f3ec]/50">
                  <td className="py-4 px-4 flex items-center gap-3">
                    <Link to={`/shop/rent/products/${p.sku}`} className="shrink-0 hover:opacity-80 transition-opacity">
                      <img src={p.coverImage} alt={p.name} className="w-12 h-12 object-cover rounded border border-[#ebe8e1]" />
                    </Link>
                    <div>
                      <Link to={`/shop/rent/products/${p.sku}`} className="font-semibold text-sm hover:underline block text-[#141310]">
                        {p.name}
                      </Link>
                      <span className="font-mono text-[#7b766f]">SKU: {p.sku}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-[#141310]">{p.pricePerDay.toLocaleString()} ₫/ngày</div>
                    <div className="text-[#7b766f]">Cọc: {p.deposit.toLocaleString()} ₫</div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.approvalStatus === 'APPROVED'
                          ? 'bg-[#d8e3ce] text-[#3f4a3a]'
                          : p.approvalStatus === 'PENDING'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-red-100 text-red-900'
                      }`}
                    >
                      {p.approvalStatus === 'APPROVED' ? 'ĐÃ DUYỆT' : p.approvalStatus === 'PENDING' ? 'CHỜ DUYỆT' : p.approvalStatus}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(p.sku)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                        p.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {p.isVisible ? 'ĐANG HIỆN' : 'TẠM ẨN'}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                    {/* Nút Xem chi tiết trỏ đúng sang trang RentProductDetail */}
                    <Link
                      to={`/shop/rent/products/${p.sku}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#141310] hover:bg-[#292724] text-white rounded font-semibold text-[11px] shadow-xs transition-colors"
                      title="Xem chi tiết sản phẩm cho thuê"
                    >
                      <span className="material-symbols-outlined text-[13px]">visibility</span>
                      Chi tiết
                    </Link>

                    {/* Nút Sửa hồ sơ sản phẩm */}
                    <Link
                      to={`/shop/rent/edit/${p.sku}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f1ede6] hover:bg-[#ebe8e1] text-[#141310] rounded font-semibold text-[11px] transition-colors"
                      title="Chỉnh sửa thông tin thiết bị"
                    >
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                      Sửa
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(p.sku, p.name)}
                      className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded font-semibold text-[11px] transition-colors"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Phân trang 10 item/trang */}
          <div className="p-4 bg-[#f7f3ec] flex items-center justify-between text-xs border-t">
            <span>
              Hiển thị trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> (Tổng {filteredProducts.length} sản phẩm)
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 bg-white rounded border disabled:opacity-50"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  className={`w-7 h-7 rounded border ${currentPage === num ? 'bg-[#141310] text-white font-bold' : 'bg-white'}`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 bg-white rounded border disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};