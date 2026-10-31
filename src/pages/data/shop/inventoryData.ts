export interface InventoryMetric {
  id: string;
  title: string;
  value: string;
  subValue: string;
  percent: number;
  note: string;
  colorType: 'ready' | 'renting' | 'inspection' | 'maintenance' | 'thrift';
}

export interface InventoryUnitItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  serialNumber: string;
  conditionGrade: string;
  cycleCount: number;
  depreciationRate: string;
  maintenanceNote?: string;
  status: 'AVAILABLE' | 'RENTING' | 'INSPECTION' | 'MAINTENANCE' | 'ELIGIBLE_FOR_THRIFT';
  statusText: string;
  currentOrderCode?: string;
  currentCustomerName?: string;
  returnDueDate?: string;
  readyDate: string;
  readyNote?: string;
  location?: string;
  proposedThriftPrice?: string;
  imageUrl: string;
  shutterActuations?: string;
  curatorName?: string;
  listedRentPrice?: string;
  thumbnailMount?: string;
  thumbnailSensor?: string;
  thumbnailOptics?: string;
  thumbnailCase?: string;
  recentOrders?: {
    orderCode: string;
    customerName: string;
    duration: string;
    revenue: string;
    escrow: string;
    status: string;
    returnCondition: string;
  }[];
}

export const inventoryKpiMetrics: InventoryMetric[] = [
  {
    id: 'kpi-ready',
    title: 'Sẵn sàng xuất kho',
    value: '8',
    subValue: '/ 24 máy (33.3%)',
    percent: 33.3,
    note: 'Niêm phong kiểm định A+',
    colorType: 'ready',
  },
  {
    id: 'kpi-renting',
    title: 'Đang cho thuê',
    value: '14',
    subValue: '/ 24 máy (58.3%)',
    percent: 58.3,
    note: 'Hợp đồng custody hoạt động',
    colorType: 'renting',
  },
  {
    id: 'kpi-inspection',
    title: 'Chờ đối kiểm hoàn trả',
    value: '2',
    subValue: 'hiện vật',
    percent: 25.0,
    note: 'Đang tại trạm Nanuk 4h SLA',
    colorType: 'inspection',
  },
  {
    id: 'kpi-maintenance',
    title: 'Bảo dưỡng buồng máy',
    value: '2',
    subValue: 'hiện vật',
    percent: 25.0,
    note: 'Hiệu chuẩn Collimator quang học',
    colorType: 'maintenance',
  },
  {
    id: 'kpi-thrift',
    title: 'Đủ chuẩn sang THRIFT',
    value: '3',
    subValue: 'hiện vật sẵn sàng',
    percent: 100.0,
    note: '>15 chu kỳ • Khấu hao >85%',
    colorType: 'thrift',
  },
];

export const mockInventoryUnits: InventoryUnitItem[] = [
  {
    id: 'INV-LCA-M10R-01',
    sku: 'LCA-M10R',
    productName: 'Leica M10-R Black Chrome',
    category: '35mm Rangefinder Digital',
    serialNumber: '#LC-98214',
    conditionGrade: 'Excellent 89%',
    cycleCount: 18,
    depreciationRate: '86%',
    maintenanceNote: 'Buồng máy đã qua bảo dưỡng',
    status: 'ELIGIBLE_FOR_THRIFT',
    statusText: 'ĐỦ ĐIỀU KIỆN SANG THRIFT',
    readyDate: 'Mở chuyển đổi THRIFT',
    readyNote: 'Sẵn sàng định giá bán đứt',
    location: 'Trạm tủ ẩm A1 (Q.1, TP.HCM)',
    proposedThriftPrice: '148.000.000 ₫',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBK7q-wXNwM9mQtifEuLln07MzCCWjhLKW72k8Ju_sd9XzTdnHkb_mkrn8yuEh7iV7sIRrjASilOQJ4TsXO50XJELSkZRk5mC9I4VMGwJ7nu5VhhtbAf8lG1aVAd5sdtxkZEdWP7NWFqtNAyoa3RZaB20tFIHkC0udo1w1ak4g1uRq--5lLDVbza1ek1VFUzAGFRheKUcG02GYpRZjOmRZwNhmOPDwp2euls1oy2xYG',
  },
  {
    id: 'INV-HB907-01',
    sku: 'HBL-907X-50C',
    productName: 'Hasselblad 907X 50C Kit',
    category: 'Medium Format Digital',
    serialNumber: '#HB-907-88201',
    conditionGrade: 'Mint- 98.5%',
    cycleCount: 4,
    depreciationRate: '14%',
    maintenanceNote: 'Cảm biến 50MP hoàn hảo',
    status: 'RENTING',
    statusText: 'ĐANG CHO THUÊ',
    currentOrderCode: '#RH-RNT-2024-8845',
    currentCustomerName: 'Elena Rostova',
    returnDueDate: '19/11/2024',
    readyDate: '20/11/2024',
    readyNote: 'Sau quy trình đối kiểm 24h',
    location: 'Trạm tủ ẩm A2 (Khoang bảo quản trung tâm, 40% RH), Atelier Chronos, Quận 1, TP. HCM',
    shutterActuations: '4.820 / 100.000',
    curatorName: 'Phạm Thùy Dương (#01)',
    listedRentPrice: '450.000 ₫ / ngày',
    proposedThriftPrice: '122.000.000 ₫',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCFy5f46CoOQadg7-prFLIs-el0toMHnjtQf9ymNc38P0KNaUw3l6KtNlRYCzI8dF8dsNntW0XxDi1eXQd1xGgqjB777JY8xFnmF3Z-L5XoTG_UQwfGyJ0VOITchqtKYlHFqSSEyRh-ZFHbzjhzmX7HkcxnzHnLENc0jBrr3wlmfP15P02dV9EbiXzj6cvOl-dd43O42HGgQPAB8siWvBpCwEHnozGlUyzoErKVZrNP',
    thumbnailMount:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDitb0iFO2dcnYPH6KgjiP56mzZkZcmiGceB5E5Rpbcx8oixEUNuDSqg0RmBjFPGdAPizXNthegFp8X8LrEGobY_GySclnIhKbx5tLx8qQkN9U4y4zwQ3BGoft98HTlQ-_obYVaQuJ40ULB2lLlFeioeHlGCrEqdcdQxqXINE7qsz7yfKSMH5p29xdq8s5gNIkh2XC2aCKYjaWeiH1U-_Yb2dmrJvonM7zAK3CopLpi',
    thumbnailSensor:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA4UfdQMbf5F6Hdlq9eJtc7ETwHcV7sB9BpXJhUsjfU_BkQ9Q4FojIJcFVWl7viGs2La0p1PNDN2izrjMNl9-_-xFjzq8FrRueFeMqKABMVk4G3jheQBT9WyoMXgOAmJr7jXFSsCMKpOKMb6tbHI1UrM3V-nLsFWCMo0s5m1zNteUNhsPRg8FSrTcvzOygctXViFAwjJ45XXsunWsrA-QAybUz-OF6Ej5vQn9s5c6ub',
    thumbnailOptics:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCX2HooCRe5elnglNDoFPUtCTgVaw6UyBgbTxQ5bXmTY1f08ZirR1Jj5fmDE5fLaMqnY-JXKoJM99Y8ftuZLKS6E8oDrWQ_PSUTU1vPIVtKjjdnwwCQ2iQkCt6lS_ON8YbRYPYepVf6rQP_7YQDYO7x7tyyvElYp-b3ieFEUT5l9nrzvPGJJ22VwywMbejwlmbNrqChtlMsM9i1sGO4Uiq_ZGaT-a0YG26lRyGfUJDs',
    thumbnailCase:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDrsxMB5GGoNT3PjfdLjitR95YnzfgEylkZhJrDhGib_GxnzmM4ExHLKcqYThALbcD4AKmPuFU4BM6t6eWFPA3hlk6aTfVMmpG9M9EdmMXHfncNLk2AEOLOz-ggndOloKvYecHbXHf4ReleZZV8h1us8a91mkkD85D-EsIKFFdY0Fm6ytK_M3ktSSL7b_9Zd8_Ts4s51NOLBDHWwTDbbeV-ScK8x82ZhY3wwfmcqnBH',
    recentOrders: [
      {
        orderCode: '#RH-RNT-2024-8845',
        customerName: 'Elena Rostova',
        duration: '14/11 — 19/11/2024 (5 ngày)',
        revenue: '2.250.000 ₫',
        escrow: '16.000.000 ₫',
        status: 'Đã hoàn cọc 100%',
        returnCondition: 'Hoàn hảo, không vết xước',
      },
      {
        orderCode: '#RH-RNT-2024-8712',
        customerName: 'Trần Quốc Nam',
        duration: '28/10 — 02/11/2024 (5 ngày)',
        revenue: '2.250.000 ₫',
        escrow: '16.000.000 ₫',
        status: 'Đã hoàn tất thanh toán',
        returnCondition: 'Sensor sạch, ngàm tốt',
      },
      {
        orderCode: '#RH-RNT-2024-8501',
        customerName: 'Lê Minh Khoa',
        duration: '10/10 — 15/10/2024 (5 ngày)',
        revenue: '2.250.000 ₫',
        escrow: '16.000.000 ₫',
        status: 'Hoàn tất an toàn',
        returnCondition: 'Tốt, có vết bụi nhẹ đã thổi',
      },
      {
        orderCode: '#RH-RNT-2024-8210',
        customerName: 'Studio Lumina',
        duration: '15/09 — 25/09/2024 (10 ngày)',
        revenue: '4.050.000 ₫',
        escrow: '16.000.000 ₫',
        status: 'Đã hoàn 100%',
        returnCondition: 'Hoàn trả nguyên vẹn phụ kiện',
      },
    ],
  },
  {
    id: 'INV-HB907-02',
    sku: 'HBL-907X-50C',
    productName: 'Hasselblad 907X 50C Kit',
    category: 'Medium Format Digital',
    serialNumber: '#HB-907-88202',
    conditionGrade: 'Mint- 98.0%',
    cycleCount: 6,
    depreciationRate: '22%',
    maintenanceNote: 'Đã niêm phong Nanuk Case',
    status: 'AVAILABLE',
    statusText: 'SẴN SÀNG XUẤT KHO',
    readyDate: 'Ngay hôm nay',
    readyNote: 'Sẵn sàng điều phối',
    location: 'Tủ chống ẩm A2 - Trạm điều phối Q.1, TP.HCM',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCMtl1lqIHxLWwEXwZxYoXj1IkLW1Bwe8KxS46fxO91ZjMs-QMOGm3_1qQR2byVvQmi4GCAoFZaW1TjISma-qgdVCtJCBVfYTK-o_HROKyyMEO99_54mK09J3V7WfSuQBCfkNt6t8Td-Q1fmJCK6fk4RG-Ly2AjgbmbrJouL22FWtHtkYCLGWuBl1F7HYYG7WcJOb5cZEI1f5tk7FkLyad1eHAetmxAYUGu6RHnXFym',
  },
  {
    id: 'INV-HB500-02',
    sku: 'HBL-500CM',
    productName: 'Hasselblad 500C/M Body + 80mm',
    category: 'Classic Medium Format Film',
    serialNumber: '#HB-500-44910',
    conditionGrade: 'Good Vintage 86%',
    cycleCount: 22,
    depreciationRate: '89%',
    maintenanceNote: 'CLA định kỳ hoàn tất tháng 10',
    status: 'ELIGIBLE_FOR_THRIFT',
    statusText: 'ĐỦ ĐIỀU KIỆN SANG THRIFT',
    readyDate: 'Sẵn sàng thanh lý',
    readyNote: 'Chuyển sang bán đứt',
    location: 'Kho lưu trữ triển lãm, Q.1',
    proposedThriftPrice: '48.500.000 ₫',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDUN8HCi3sOXhTeh0dmehNYmo57zAHDye6SQDMIHO6MV0gs1lM8acz6IPVme5655aZzTIZcuBfeWTIShx9pWOMGfQguL-0rQ48jmhYIGGP97rfl7-9ODCHu4Bfr8f0eug6R1WoUO8pCOMtEA18LBcsfab6iSn_7v87Rehv8FjtphcR29tVHavTUarY6T57TmL__j8QfWk--_feDS3RT8vWba8Bigrfx6CdXpyWA-ixS',
  },
  {
    id: 'INV-CAN-R6M2-03',
    sku: 'CAN-R6M2-KIT',
    productName: 'Canon EOS R6 Mark II Kit',
    category: 'Full-Frame Mirrorless',
    serialNumber: '#CN-44091',
    conditionGrade: 'Near Mint 94%',
    cycleCount: 9,
    depreciationRate: '38%',
    maintenanceNote: 'Đang soi buồng cảm biến (4h SLA)',
    status: 'INSPECTION',
    statusText: 'CHỜ ĐỐI KIỂM HOÀN TRẢ',
    currentOrderCode: '#RH-RNT-2024-8819',
    currentCustomerName: 'Atelier Lumina',
    readyDate: 'Dự kiến 18/11/2024',
    readyNote: 'Sau khi nghiệm thu biên bản',
    location: 'Phòng sạch Lab kiểm định, Q.1',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIHLrLcDmPMcS5-_NhJCPF7j8kJeK6ZVVNyM9TleU2xRvucrUFOoBZtCcOPiJSHUjl7Iv01SAasTblH67pco0LosJeDVpwMfNGnlxFjjZQaEIfKVE3qq9KUiKtqHpPjyd__HpuJ3I-0Y423cALOtPLP-n8ZjzSQX4cv0Lfthqb28MOCTdgPczzcjt9U-ITeVCj7267pW-zsHNBukp8W_BJ_-3rRsNEQoQ8_VJrPm_g',
  },
  {
    id: 'INV-SNY-FX3-01',
    sku: 'SNY-FX3-CINE',
    productName: 'Sony FX3 Cinema Line',
    category: 'Cinema Full-Frame Camera',
    serialNumber: '#SNY-0984',
    conditionGrade: '92% (Cần vệ sinh)',
    cycleCount: 11,
    depreciationRate: '45%',
    maintenanceNote: 'Bảo trì quạt tản & ngàm E-mount',
    status: 'MAINTENANCE',
    statusText: 'ĐANG HIỆU CHUẨN',
    readyDate: '22/11/2024',
    readyNote: 'Sau test burn-in 12 tiếng',
    location: 'Bàn kỹ thuật buồng tối',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCu84gzZaU1oQBH1msonY0RgHZVfobALreq_MjWjFf1_k1jCpfH9RVtAK6CtRDEfutBcH4ykf4dEcAkC2J-NovBai5cp-Xq1MTDm5ilZa88kvttk885OruqeFepQTiyABh7GfZRq73PbzSR-RKvPTy7aFURBTAkkHCLgtvW75jyOGevZVPW3tUE-lPNWQ9gn-qDMj9rM_uTzQ70wO16mSXXxo6qEWSlDGpsW_DsRWDg',
  },
  {
    id: 'INV-BO-9000-01',
    sku: 'BO-9000',
    productName: 'Bang & Olufsen Beosound 9000',
    category: 'Iconic Hi-Fi 6-CD System',
    serialNumber: '#BO-88391',
    conditionGrade: 'Collector Vintage 85%',
    cycleCount: 16,
    depreciationRate: '88%',
    maintenanceNote: 'Cơ cấu trượt kính đã thay dây curoa mới',
    status: 'ELIGIBLE_FOR_THRIFT',
    statusText: 'ĐỦ ĐIỀU KIỆN SANG THRIFT',
    readyDate: 'Mở chuyển đổi THRIFT',
    readyNote: 'Sẵn sàng mở đấu giá / bán đứt',
    location: 'Phòng nghe thẩm âm Atelier',
    proposedThriftPrice: '62.000.000 ₫',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB38knZZmbi9zWgicBAKqjw3ok5kYHvpqwWJVWu3_f5RQr0tFf9eZi3DEHIIvZHDFm0irxcVSe2mxmRMWoMH8RdEHNE8y-t_FW3muBRFPEAg0ijITyCYAaINNSZPJ6e88C9ir6KYbi8eqAoge61mBAAyuKXEMUVqDNDU6h_usC8_PkxcUJWXykYpj0Cb7uRTixsWi1hKFr49vZuNlhdHKvMf9w5uk3SZaXC0zTfI3iz',
  },
  {
    id: 'INV-VG-R3A-01',
    sku: 'VG-R3A-GRY',
    productName: 'Voigtländer Bessa R3A Grey',
    category: '35mm Film Rangefinder 1:1 View',
    serialNumber: '#VG-002891',
    conditionGrade: 'Mint 96%',
    cycleCount: 7,
    depreciationRate: '28%',
    maintenanceNote: 'Khung ngắm 1:1 sáng rõ',
    status: 'RENTING',
    statusText: 'ĐANG CHO THUÊ',
    currentOrderCode: '#RH-RNT-2024-8904',
    currentCustomerName: 'Marcus Chen',
    returnDueDate: '17/11/2024',
    readyDate: '18/11/2024',
    readyNote: 'Sau quy trình khử ẩm xưởng',
    location: 'Đang lưu hành ngoại cảnh',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDHBIhzNU1KLjxGLRtN0SxV2rbBC1Zv6P39euzIA76bUTUeScjh8f8wnFu8Jja6Odb5sGTKgEpw4SB4jz2Zf-CrLkeKrRQ90hPkSfeUJ_h-wBo5CrL4uD_OziSn3U94QPI31TK77F9sxM-HvCPGK9DXgAZs0YSWD0ZtQVYkrpvx6dETnEoAuYN1T6Z1bWQ0jX8Dn8cZLGZEDiFo1UAFXSHeellpucrCIjxZUqv7R7CV',
  },
];