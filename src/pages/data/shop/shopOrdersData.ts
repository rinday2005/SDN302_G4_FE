export interface RentalOrder {
  id: string;
  productName: string;
  customerName: string;
  rentalPeriod: string;
  totalAmount: number;
  depositAmount?: number;
  status: 'PENDING' | 'PAID' | 'SHIPPING' | 'RENTING' | 'INSPECTING' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED';
  shippingCarrier?: string;
  trackingCode?: string;
  shippedAt?: string;
}

export const INITIAL_RENTAL_ORDERS: RentalOrder[] = [
  {
    id: 'RH-RNT-2024-8845',
    productName: 'Hasselblad 907X 50C + Lens XCD 45mm (+ Filter B+W)',
    customerName: 'Elena Rostova',
    rentalPeriod: '14/11/2024 - 19/11/2024',
    totalAmount: 2650000,
    depositAmount: 17500000,
    status: 'INSPECTING', // Đang trong lab nghiệm thu hoàn trả
  },
  {
    id: 'RENT-8950',
    productName: 'Sony FX3 Cinema Line Kit + XLR Handle',
    customerName: 'Phạm Thuỳ Dương',
    rentalPeriod: '16/10/2026 - 19/10/2026',
    totalAmount: 1850000,
    depositAmount: 25000000,
    status: 'PAID', // Đủ điều kiện: Sẽ hiện nút "Xác nhận gửi hàng"
  },
  {
    id: 'ORD-98214',
    productName: 'Leica M6 Classic Titanium Finish (1994)',
    customerName: 'Nguyễn Văn A',
    rentalPeriod: '15/10/2026 - 18/10/2026',
    totalAmount: 1200000,
    depositAmount: 20000000,
    status: 'PAID', // Đủ điều kiện gửi hàng
  },
  {
    id: 'ORD-98215',
    productName: 'Canon EOS R6 Mark II + RF 24-70mm',
    customerName: 'Trần Thị B',
    rentalPeriod: '20/10/2026 - 22/10/2026',
    totalAmount: 900000,
    depositAmount: 12500000,
    status: 'PENDING', // Chưa thanh toán -> Nút thao tác disabled
  },
  {
    id: 'ORD-98216',
    productName: 'Hasselblad 907X 50C + Lens Kit',
    customerName: 'Lê Hoàng C',
    rentalPeriod: '12/10/2026 - 15/10/2026',
    totalAmount: 1350000,
    depositAmount: 16000000,
    status: 'SHIPPING',
    shippingCarrier: 'GHTK',
    trackingCode: 'GHTK987654321',
    shippedAt: '2026-10-14T08:30:00.000Z',
  },
];