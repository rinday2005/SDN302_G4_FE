import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShippingModal } from '../../../components/orders/ShippingModal';
import type { ShippingData } from '../../../components/orders/ShippingModal';
import { INITIAL_RENTAL_ORDERS } from '../../data/shop/shopOrdersData';
import type { RentalOrder } from '../../data/shop/shopOrdersData';

const STORAGE_KEY = 'REUSE_HUB_RENTAL_ORDERS';

export const ShopOrders: React.FC = () => {
  // Khởi tạo state từ localStorage nếu có, nếu chưa có thì dùng INITIAL_RENTAL_ORDERS
  const [orders, setOrders] = useState<RentalOrder[]>(() => {
    try {
      const savedOrders = localStorage.getItem(STORAGE_KEY);
      if (savedOrders) {
        return JSON.parse(savedOrders);
      }
    } catch (e) {
      console.error('Không thể đọc dữ liệu từ localStorage', e);
    }
    return INITIAL_RENTAL_ORDERS;
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Tự động lưu dữ liệu vào localStorage mỗi khi danh sách đơn hàng có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Không thể lưu dữ liệu vào localStorage', e);
    }
  }, [orders]);

  // Nghiệp vụ: Chỉ mở modal khi đơn hàng đang ở trạng thái PAID
  const handleOpenShippingModal = (order: RentalOrder) => {
    if (order.status !== 'PAID') {
      alert('Đơn hàng chưa thanh toán hoặc đang trong trạng thái khác, không thể gửi hàng.');
      return;
    }
    setSelectedOrderId(order.id);
  };

  // Cập nhật trạng thái đơn thành SHIPPING và lưu thông tin vận chuyển
  const handleConfirmShipping = async (orderId: string, data: ShippingData) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: 'SHIPPING',
            shippingCarrier: data.carrier,
            trackingCode: data.trackingCode,
            shippedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );
  };

  // Hàm tiện ích: Khôi phục lại dữ liệu mẫu ban đầu khi cần test lại từ đầu
  const handleResetData = () => {
    if (window.confirm('Khôi phục danh sách đơn hàng về trạng thái mẫu ban đầu?')) {
      localStorage.removeItem(STORAGE_KEY);
      setOrders(INITIAL_RENTAL_ORDERS);
    }
  };

  return (
    <div className="max-w-[1536px] mx-auto px-4 lg:px-8 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#141310]">
            Đơn Hàng Cho Thuê (RENT Orders)
          </h1>
          <p className="text-xs text-[#78716c] mt-1">
            Theo dõi và bàn giao bưu cục khi khách hàng đã thanh toán bảo chứng qua Smart Escrow.
          </p>
        </div>

        {/* Nút reset dữ liệu test tiện lợi cho quá trình phát triển/demo */}
        <button
          type="button"
          onClick={handleResetData}
          className="text-[11px] text-[#78716c] hover:text-[#1c1c18] border border-[#dddad3] hover:border-[#1c1c18] px-2.5 py-1 rounded-lg transition-colors cursor-pointer bg-white"
          title="Reset về dữ liệu ban đầu để test lại"
        >
          Đặt lại dữ liệu mẫu
        </button>
      </div>

      {/* Bảng đơn hàng */}
      <div className="bg-white rounded-2xl border border-[#dddad3] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f7f3ec] border-b border-[#dddad3] text-[#78716c] font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Mã đơn</th>
                <th className="py-3 px-4">Thiết bị &amp; Khách hàng</th>
                <th className="py-3 px-4">Thời gian thuê</th>
                <th className="py-3 px-4">Tổng tiền &amp; Cọc</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Vận chuyển</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dddad3]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#fdfbf7] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#141310] whitespace-nowrap">
                    <Link
                      to={`/shop/rent/orders/${order.id}`}
                      className="hover:text-[#6c5937] hover:underline flex items-center gap-1"
                      title="Xem chi tiết sổ lệnh lưu ký"
                    >
                      <span>{order.id}</span>
                      <span className="material-symbols-outlined text-[13px] text-[#78716c]">open_in_new</span>
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#1c1c18]">{order.productName}</div>
                    <div className="text-[11px] text-[#78716c] mt-0.5">Khách: {order.customerName}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[#78716c] whitespace-nowrap">
                    {order.rentalPeriod}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-[#141310]">
                      {order.totalAmount.toLocaleString('vi-VN')} ₫
                    </div>
                    {order.depositAmount !== undefined && (
                      <div className="text-[11px] text-[#78716c]">
                        Cọc: {order.depositAmount.toLocaleString('vi-VN')} ₫
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {order.status === 'INSPECTING' && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#caebc9] text-[#05210c] border border-[#afcfae] flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#48654b] animate-pulse"></span>
                        Nghiệm thu hoàn trả
                      </span>
                    )}
                    {order.status === 'PAID' && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Đã thanh toán
                      </span>
                    )}
                    {order.status === 'PENDING' && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        Chờ thanh toán
                      </span>
                    )}
                    {order.status === 'RENTING' && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                        Đang cho thuê
                      </span>
                    )}
                    {order.status === 'SHIPPING' && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 w-fit">
                        <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                        Đang giao hàng
                      </span>
                    )}
                    {order.status === 'COMPLETED' && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                        Đã hoàn tất
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {order.status === 'SHIPPING' ? (
                      <div className="font-mono text-[11px] text-[#44403c]">
                        <span className="font-semibold text-[#141310]">{order.shippingCarrier}: </span>
                        <span>{order.trackingCode}</span>
                      </div>
                    ) : order.status === 'INSPECTING' ? (
                      <span className="text-xs text-[#48654b] font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">biotech</span>
                        Lab đối kiểm
                      </span>
                    ) : (
                      <span className="text-[#a8a29e]">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {order.status === 'INSPECTING' ? (
                      <Link
                        to={`/shop/rent/orders/${order.id}`}
                        className="px-3 py-1.5 rounded-lg bg-[#6c5937] text-white hover:bg-[#554424] transition-colors font-medium text-xs inline-flex items-center gap-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">troubleshoot</span>
                        <span>Vào nghiệm thu</span>
                      </Link>
                    ) : order.status === 'PAID' ? (
                      <button
                        type="button"
                        onClick={() => handleOpenShippingModal(order)}
                        className="px-3 py-1.5 rounded-lg bg-[#141310] text-white hover:bg-black transition-colors font-medium text-xs inline-flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">local_shipping</span>
                        <span>Xác nhận gửi hàng</span>
                      </button>
                    ) : (
                      <Link
                        to={`/shop/rent/orders/${order.id}`}
                        className="px-2.5 py-1 rounded-lg border border-[#dddad3] text-[#4a463f] hover:bg-[#f2ede9] transition-colors text-xs font-medium inline-flex items-center gap-1"
                      >
                        <span>Sổ lệnh</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal gửi hàng */}
      <ShippingModal
        isOpen={Boolean(selectedOrderId)}
        orderId={selectedOrderId || ''}
        onClose={() => setSelectedOrderId(null)}
        onSubmit={handleConfirmShipping}
      />
    </div>
  );
};

export default ShopOrders;