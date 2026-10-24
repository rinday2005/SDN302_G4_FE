export interface GalleryImage {
  id: string;
  url: string;
  label: string;
}

export interface ThriftConvertData {
  unitId: string;
  sku: string;
  title: string;
  category: string;
  condition: string;
  price: string;
  originalPrice?: string;
  depreciationText?: string;
  description: string;
  heroImage: string;
  images: GalleryImage[];
  status: 'ELIGIBLE' | 'PENDING_APPROVAL' | 'CONVERTED_TO_THRIFT';
  convertedAt?: string;
  currentRentStatus: 'COMPLETED' | 'RENTING';
  hasFutureBooking: boolean;
  serialNumber: string;
  cycleCount: number;
  daysRented: number;
  totalRevenue: string;
  sourceTag: string;
  inspectorName: string;
  certificateCode: string;
  hashProof: string;
  recentOrderCode?: string;
  recentCustomer?: string;
}

export interface ConvertibleSpecimenProfile {
  id: string;
  sku: string;
  productName: string;
  category: string;
  serialNumber: string;
  conditionGrade: string;
  cycleCount: number;
  daysRented: number;
  totalRevenue: string;
  depreciationRate: string;
  price: string;
  originalPrice: string;
  depreciationText: string;
  status: 'ELIGIBLE' | 'RENTING' | 'FUTURE_BOOKING' | 'PENDING_APPROVAL';
  currentRentStatus: 'COMPLETED' | 'RENTING';
  hasFutureBooking: boolean;
  recentOrderCode: string;
  recentCustomer: string;
  location: string;
  curatorName: string;
  certificateCode: string;
  hashProof: string;
  description: string;
  heroImage: string;
  images: GalleryImage[];
}

export const SPECIMEN_PROFILES: Record<string, ConvertibleSpecimenProfile> = {
  'INV-HB907-01': {
    id: 'INV-HB907-01',
    sku: 'HBL-907X-50C',
    productName: 'Hasselblad 907X 50C + Lens XCD 45mm f/4 P Kit',
    category: 'Camera & Quang học / Medium Format Digital',
    serialNumber: '#HB-907-88201',
    conditionGrade: 'Mint- 98.0%',
    cycleCount: 14,
    daysRented: 78,
    totalRevenue: '31.500.000 ₫',
    depreciationRate: '86.5%',
    price: '122.000.000 ₫',
    originalPrice: '145.000.000 ₫',
    depreciationText: 'Khấu hao -18.5% so với giá mới (145.000.000 ₫)',
    status: 'ELIGIBLE',
    currentRentStatus: 'COMPLETED',
    hasFutureBooking: false,
    recentOrderCode: '#RH-RNT-2024-8845',
    recentCustomer: 'Elena Rostova',
    location: 'Trạm tủ ẩm A2 (Khoang bảo quản trung tâm, 40% RH), Atelier Chronos, Quận 1, TP. HCM',
    curatorName: 'Vũ Thanh Tùng (#01)',
    certificateCode: '#CERT-9942-VN',
    hashProof: 'sha256:d894b8e2f073c683b58498ffaa10e8e9766914fa28db323d61b69827b5e49e21',
    description:
      'Hiện vật lưu trữ chính hãng từ Atelier Chronos & Optics. Số lần trập màn trập thực tế (Shutter Count): 4.820 shot. Tình trạng cảm biến Medium Format 50MP không điểm chết, không bụi vi hạt sau quy trình vệ sinh Class 1000 Cleanroom ngày 24/10/2024. Ống kính XCD 45mm f/4 P thấu kính không trầy xước, vòng lấy nét êm ái tuyệt đối.\n\nPhụ kiện đi kèm: 01 Vali chống sốc Nanuk 935 chuyên dụng, 02 pin Hasselblad 3400mAh chính hãng, cáp USB-C bện dù, ngàm kẹp release và Chứng chỉ Giám định Tuần hoàn ReUse Hub #CERT-9942.',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9ew2A1dXAwNLJzGMghu7qQZKfdoUktXpUYMMMZgSzkPxMWttKQhRJ_-YFaNymqCAx6v0g_PiGASnAzKlVPQ-3eYbLJf4Hp2XS52ZNictAWODfEMfjVty4iFXwrdkJsJWCSLLgt3iYNUNyYgMb-ng_e2ahKvktVuKm0bQAn99Xs_Rof6uVYVv0PAFmruTPt2Kc1u9GHBdL_giqrRwKSomPsx0CLzd1DqPZt8o1Eht_',
    images: [
      {
        id: 'hero',
        label: 'HERO',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9ew2A1dXAwNLJzGMghu7qQZKfdoUktXpUYMMMZgSzkPxMWttKQhRJ_-YFaNymqCAx6v0g_PiGASnAzKlVPQ-3eYbLJf4Hp2XS52ZNictAWODfEMfjVty4iFXwrdkJsJWCSLLgt3iYNUNyYgMb-ng_e2ahKvktVuKm0bQAn99Xs_Rof6uVYVv0PAFmruTPt2Kc1u9GHBdL_giqrRwKSomPsx0CLzd1DqPZt8o1Eht_',
      },
      {
        id: 'sensor',
        label: 'SENSOR',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQvh_Lh0hAruQ5t3sl7t3o4NnQ_m8XjEkwDmjyiEzZYjGysKMRzxQ_5K1Bf6tUqQjXbsXqTbDNMLubljXMDDVg4WXx9kL-s3aTUL-iF1yZ2oo7oDyWnJBjyjvGlNsU1IZPdY51YQJ19hmaQbCFf5ppBVFV8BvBeiulUkMhcqKEUM-T5LTF4RTXQqWxrkgCJKBSQeK43vH2u8Wu-7Qr48zrevkF7QRwvm3u--oSaSmu',
      },
      {
        id: 'dials',
        label: 'DIALS',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUUwaoa-ksSKhJIs6iiDYrYokH8C3myEIpNz2f7miF_0CsrlvmMj1_olRmQGDT6-eMdLl-LXetw2kZtsc8vwvSps-LGeNYPXQ7YXkCHAZplQDIecDHPcQYuapXqDtvUoBHOacrePwPf5Nn-EjKwP8Z0V6Umy2njdVpbOCdaoL-GGwKX1IRfcvQg3EdTK7e_NLpMLrNHUfzr8P4EJmubDz__NV7RxH5tKqRgJC0-Lwo',
      },
      {
        id: 'serial',
        label: 'SERIAL',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjEHNIq4DAvJT-MgHsfaFwBcCuDqb3R5lxWbSdxqzmBSBKNsIfq9W0s7HvhkV3gPbrk-HUcbFJCbZqvNpdenA7lxCa9aRxRKCZxyezuhAL6A8cUQrrjPrNDQDJg8oVtUGr2Mfa7Gmz_WJb_ITSpu8AGRxsCVgmeFyTi5PxVqPcLYCNwYdKCSHBtThQ4ubkPIkZAFk-hzIO3aLjwUHRoH0piiOY0GS3sbOw__5FbYP5',
      },
      {
        id: 'case',
        label: 'CASE',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmRB29b3jWNLq9rlxZdOmPq4swRshMmc9zqbKO3JqMiqRB5ZMx9J8XBSYLPoyZPv3lazUQYk5Off-ILzRxpWeriY8U1KvjMe9MUBy-AGDsKLd5D5oVmOWtznUFdui6HTZYcGSgBMvexv2_dH82WMTFfaMpi6Ef4IcliZRfTqNSOlURsDljaztkvtOksHABRo5cid89gx4lfTYAYs60WUhqsxOwgf9pKhuDsPYp7YFv',
      },
    ],
  },

  'INV-LCA-M10R-01': {
    id: 'INV-LCA-M10R-01',
    sku: 'LCA-M10R',
    productName: 'Leica M10-R Black Chrome Finish',
    category: 'Camera & Quang học / 35mm Rangefinder Digital',
    serialNumber: '#LC-98214',
    conditionGrade: 'Excellent 89.0%',
    cycleCount: 18,
    daysRented: 92,
    totalRevenue: '42.800.000 ₫',
    depreciationRate: '86.0%',
    price: '148.000.000 ₫',
    originalPrice: '215.000.000 ₫',
    depreciationText: 'Khấu hao -31.1% so với giá mới (215.000.000 ₫)',
    status: 'ELIGIBLE',
    currentRentStatus: 'COMPLETED',
    hasFutureBooking: false,
    recentOrderCode: '#RH-RNT-2024-8702',
    recentCustomer: 'Đặng Minh Trí',
    location: 'Trạm tủ ẩm A1 (Khoang Leica Master), Atelier Chronos, Quận 1, TP. HCM',
    curatorName: 'Vũ Thanh Tùng (#01)',
    certificateCode: '#CERT-8819-VN',
    hashProof: 'sha256:7f3a992bc44101e4a773d1000bb78a2e1f4044c010a3d4f849ef9b071aa57c32',
    description:
      'Hiện vật Leica M10-R cảm biến 40MP chuẩn Đức. Đã qua 18 chu kỳ cho thuê tuyển chọn, buồng cơ khí lấy nét rangefinder được căn chỉnh Collimator quang học chuẩn xác 100%. Lớp mạ đen ánh đồng nhẹ ở viền kim loại mang đậm dấu ấn patina di sản nghệ thuật.\n\nPhụ kiện đi kèm: Hộp da Leica nguyên bản, 02 pin Leica BP-SCL5 zin, đế báng tay cầm kim loại, nắp cap body kim loại và Giấy chứng thực lưu ký ReUse Hub.',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBK7q-wXNwM9mQtifEuLln07MzCCWjhLKW72k8Ju_sd9XzTdnHkb_mkrn8yuEh7iV7sIRrjASilOQJ4TsXO50XJELSkZRk5mC9I4VMGwJ7nu5VhhtbAf8lG1aVAd5sdtxkZEdWP7NWFqtNAyoa3RZaB20tFIHkC0udo1w1ak4g1uRq--5lLDVbza1ek1VFUzAGFRheKUcG02GYpRZjOmRZwNhmOPDwp2euls1oy2xYG',
    images: [
      {
        id: 'hero',
        label: 'HERO',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBK7q-wXNwM9mQtifEuLln07MzCCWjhLKW72k8Ju_sd9XzTdnHkb_mkrn8yuEh7iV7sIRrjASilOQJ4TsXO50XJELSkZRk5mC9I4VMGwJ7nu5VhhtbAf8lG1aVAd5sdtxkZEdWP7NWFqtNAyoa3RZaB20tFIHkC0udo1w1ak4g1uRq--5lLDVbza1ek1VFUzAGFRheKUcG02GYpRZjOmRZwNhmOPDwp2euls1oy2xYG',
      },
      {
        id: 'sensor',
        label: 'SENSOR',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQvh_Lh0hAruQ5t3sl7t3o4NnQ_m8XjEkwDmjyiEzZYjGysKMRzxQ_5K1Bf6tUqQjXbsXqTbDNMLubljXMDDVg4WXx9kL-s3aTUL-iF1yZ2oo7oDyWnJBjyjvGlNsU1IZPdY51YQJ19hmaQbCFf5ppBVFV8BvBeiulUkMhcqKEUM-T5LTF4RTXQqWxrkgCJKBSQeK43vH2u8Wu-7Qr48zrevkF7QRwvm3u--oSaSmu',
      },
      {
        id: 'dials',
        label: 'TOP PLATE',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUUwaoa-ksSKhJIs6iiDYrYokH8C3myEIpNz2f7miF_0CsrlvmMj1_olRmQGDT6-eMdLl-LXetw2kZtsc8vwvSps-LGeNYPXQ7YXkCHAZplQDIecDHPcQYuapXqDtvUoBHOacrePwPf5Nn-EjKwP8Z0V6Umy2njdVpbOCdaoL-GGwKX1IRfcvQg3EdTK7e_NLpMLrNHUfzr8P4EJmubDz__NV7RxH5tKqRgJC0-Lwo',
      },
      {
        id: 'case',
        label: 'BOX & CASE',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmRB29b3jWNLq9rlxZdOmPq4swRshMmc9zqbKO3JqMiqRB5ZMx9J8XBSYLPoyZPv3lazUQYk5Off-ILzRxpWeriY8U1KvjMe9MUBy-AGDsKLd5D5oVmOWtznUFdui6HTZYcGSgBMvexv2_dH82WMTFfaMpi6Ef4IcliZRfTqNSOlURsDljaztkvtOksHABRo5cid89gx4lfTYAYs60WUhqsxOwgf9pKhuDsPYp7YFv',
      },
    ],
  },

  'INV-HB500-02': {
    id: 'INV-HB500-02',
    sku: 'HBL-500CM',
    productName: 'Hasselblad 500C/M Body + Carl Zeiss Planar 80mm f/2.8 T*',
    category: 'Camera & Quang học / Classic Medium Format Film',
    serialNumber: '#HB-500-44910',
    conditionGrade: 'Good Vintage 86.0%',
    cycleCount: 22,
    daysRented: 110,
    totalRevenue: '38.000.000 ₫',
    depreciationRate: '89.0%',
    price: '48.500.000 ₫',
    originalPrice: '65.000.000 ₫',
    depreciationText: 'Khấu hao -25.4% so với giá thị trường vintage (65.000.000 ₫)',
    status: 'ELIGIBLE',
    currentRentStatus: 'COMPLETED',
    hasFutureBooking: false,
    recentOrderCode: '#RH-RNT-2024-8114',
    recentCustomer: 'Lê Hoàng Nam',
    location: 'Kho lưu trữ triển lãm Vintage, Atelier Chronos, Quận 1, TP. HCM',
    curatorName: 'Vũ Thanh Tùng (#01)',
    certificateCode: '#CERT-7731-VN',
    hashProof: 'sha256:33bc91928aee77bb0198cc21a4f00129bc81109aed8271e89921bcff40128821',
    description:
      'Huyền thoại cơ khí Thụy Điển Hasselblad 500C/M kết hợp cùng thấu kính Carl Zeiss Planar 80mm T* kinh điển. Máy đã hoàn thành 22 chu kỳ chụp thời trang analog, buồng gương lật đã qua CLA toàn diện tháng 10/2024. Kính ngắm Waist-Level trong vắt, back phim A12 lên film mượt mà 100% không chồng hình.\n\nPhụ kiện đi kèm: Back film A12 zin trùng serial, kính ngắm thể thao WLF, dây đeo da thủ công Atelier, hood che nắng Carl Zeiss kim loại.',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDUN8HCi3sOXhTeh0dmehNYmo57zAHDye6SQDMIHO6MV0gs1lM8acz6IPVme5655aZzTIZcuBfeWTIShx9pWOMGfQguL-0rQ48jmhYIGGP97rfl7-9ODCHu4Bfr8f0eug6R1WoUO8pCOMtEA18LBcsfab6iSn_7v87Rehv8FjtphcR29tVHavTUarY6T57TmL__j8QfWk--_feDS3RT8vWba8Bigrfx6CdXpyWA-ixS',
    images: [
      {
        id: 'hero',
        label: 'HERO',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUN8HCi3sOXhTeh0dmehNYmo57zAHDye6SQDMIHO6MV0gs1lM8acz6IPVme5655aZzTIZcuBfeWTIShx9pWOMGfQguL-0rQ48jmhYIGGP97rfl7-9ODCHu4Bfr8f0eug6R1WoUO8pCOMtEA18LBcsfab6iSn_7v87Rehv8FjtphcR29tVHavTUarY6T57TmL__j8QfWk--_feDS3RT8vWba8Bigrfx6CdXpyWA-ixS',
      },
      {
        id: 'optics',
        label: 'PLANAR 80MM',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUUwaoa-ksSKhJIs6iiDYrYokH8C3myEIpNz2f7miF_0CsrlvmMj1_olRmQGDT6-eMdLl-LXetw2kZtsc8vwvSps-LGeNYPXQ7YXkCHAZplQDIecDHPcQYuapXqDtvUoBHOacrePwPf5Nn-EjKwP8Z0V6Umy2njdVpbOCdaoL-GGwKX1IRfcvQg3EdTK7e_NLpMLrNHUfzr8P4EJmubDz__NV7RxH5tKqRgJC0-Lwo',
      },
      {
        id: 'back',
        label: 'A12 BACK',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjEHNIq4DAvJT-MgHsfaFwBcCuDqb3R5lxWbSdxqzmBSBKNsIfq9W0s7HvhkV3gPbrk-HUcbFJCbZqvNpdenA7lxCa9aRxRKCZxyezuhAL6A8cUQrrjPrNDQDJg8oVtUGr2Mfa7Gmz_WJb_ITSpu8AGRxsCVgmeFyTi5PxVqPcLYCNwYdKCSHBtThQ4ubkPIkZAFk-hzIO3aLjwUHRoH0piiOY0GS3sbOw__5FbYP5',
      },
    ],
  },

  'INV-CAN-R6M2-03': {
    id: 'INV-CAN-R6M2-03',
    sku: 'CAN-R6M2-KIT',
    productName: 'Canon EOS R6 Mark II + RF 24-70mm f/2.8L IS USM',
    category: 'Camera & Quang học / Full-Frame Hybrid Mirrorless',
    serialNumber: '#CN-44091',
    conditionGrade: 'Near Mint 94.0%',
    cycleCount: 9,
    daysRented: 45,
    totalRevenue: '20.250.000 ₫',
    depreciationRate: '38.0%',
    price: '68.000.000 ₫',
    originalPrice: '82.000.000 ₫',
    depreciationText: 'Khấu hao -17.1% so với giá mới (82.000.000 ₫)',
    status: 'RENTING',
    currentRentStatus: 'RENTING',
    hasFutureBooking: false,
    recentOrderCode: '#RH-RNT-2024-8819',
    recentCustomer: 'Atelier Lumina',
    location: 'Trạm kiểm định cơ giới, Atelier Chronos, Quận 1, TP. HCM',
    curatorName: 'Vũ Thanh Tùng (#01)',
    certificateCode: '#CERT-6610-VN',
    hashProof: 'sha256:11ac4481023aeb990022cc447711fe900bb11881aa0022ff8811dd6622aa33bb',
    description:
      'Bộ máy Hybrid chuyên nghiệp Canon EOS R6 Mark II kèm ống kính đỏ đa dụng RF 24-70mm f/2.8L IS USM. Tốc độ chụp thể thao 40fps điện tử và quay video 4K60p oversampled 6K không giới hạn thời gian. Thân máy và ống kính giữ gìn kỹ lưỡng, không va chạm góc cạnh.\n\nPhụ kiện đi kèm: 02 pin Canon LP-E6NH zin, sạc đôi Canon, kính lọc bảo vệ B+W nano, hood che nắng RF và vali Nanuk chống sốc.',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIHLrLcDmPMcS5-_NhJCPF7j8kJeK6ZVVNyM9TleU2xRvucrUFOoBZtCcOPiJSHUjl7Iv01SAasTblH67pco0LosJeDVpwMfNGnlxFjjZQaEIfKVE3qq9KUiKtqHpPjyd__HpuJ3I-0Y423cALOtPLP-n8ZjzSQX4cv0Lfthqb28MOCTdgPczzcjt9U-ITeVCj7267pW-zsHNBukp8W_BJ_-3rRsNEQoQ8_VJrPm_g',
    images: [
      {
        id: 'hero',
        label: 'HERO',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIHLrLcDmPMcS5-_NhJCPF7j8kJeK6ZVVNyM9TleU2xRvucrUFOoBZtCcOPiJSHUjl7Iv01SAasTblH67pco0LosJeDVpwMfNGnlxFjjZQaEIfKVE3qq9KUiKtqHpPjyd__HpuJ3I-0Y423cALOtPLP-n8ZjzSQX4cv0Lfthqb28MOCTdgPczzcjt9U-ITeVCj7267pW-zsHNBukp8W_BJ_-3rRsNEQoQ8_VJrPm_g',
      },
      {
        id: 'lens',
        label: 'RF 24-70L',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUUwaoa-ksSKhJIs6iiDYrYokH8C3myEIpNz2f7miF_0CsrlvmMj1_olRmQGDT6-eMdLl-LXetw2kZtsc8vwvSps-LGeNYPXQ7YXkCHAZplQDIecDHPcQYuapXqDtvUoBHOacrePwPf5Nn-EjKwP8Z0V6Umy2njdVpbOCdaoL-GGwKX1IRfcvQg3EdTK7e_NLpMLrNHUfzr8P4EJmubDz__NV7RxH5tKqRgJC0-Lwo',
      },
    ],
  },

  'LCA-M6-TITAN': {
    id: 'LCA-M6-TITAN',
    sku: 'LCA-M6-TITAN',
    productName: 'Leica M6 Classic Titanium Finish (1994)',
    category: 'Camera & Quang học / 35mm Analog Film Rangefinder',
    serialNumber: '#LC-M6-1994-098',
    conditionGrade: 'Near Mint 95.0%',
    cycleCount: 16,
    daysRented: 64,
    totalRevenue: '24.320.000 ₫',
    depreciationRate: '85.0%',
    price: '85.000.000 ₫',
    originalPrice: '95.000.000 ₫',
    depreciationText: 'Khấu hao -10.5% so với giá thị trường sưu tầm (95.000.000 ₫)',
    status: 'FUTURE_BOOKING',
    currentRentStatus: 'COMPLETED',
    hasFutureBooking: true,
    recentOrderCode: '#RH-RNT-2024-8501',
    recentCustomer: 'Vũ Quốc Bảo',
    location: 'Tủ kính bảo mật tầng 2, Atelier Chronos, Quận 1, TP. HCM',
    curatorName: 'Vũ Thanh Tùng (#01)',
    certificateCode: '#CERT-5509-VN',
    hashProof: 'sha256:88ee1100aa77ffbb2299dd3366cc0011883399eedd2211bb7744ff8899aa1100',
    description:
      'Phiên bản Leica M6 Classic Titanium cực hiếm xuất xưởng năm 1994 tại Solms, Đức. Vỏ bọc da đà điểu nguyên bản màu xám khói, khung máy phủ titanium chống oxy hóa tuyệt đối. Kính ngắm 0.72x sáng rõ, đo sáng điểm nhạy bén, hoạt động cơ khí 100% không cần pin vẫn trập chính xác mọi tốc độ.\n\nPhụ kiện đi kèm: Dây da Leica titan đặc chủng, nắp cap body titanium, bao da mềm và Hộ chiếu bảo hành ReUse Hub.',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCmYdkWVRHHB9Xxm1mQhTzNT9Xt1x3TNJOxHqrHlSpsLP_iZle-nGzIIVxf4RIBPGf5eZ4ZP98H0CxD0lNmbkzzPkI7Ow6AE9fbAimD9cu9Oe4AT_l62Fyf-KlsvRKaSUQEv_aod7MoRX-Hqzl57xvMvo_q5tNsH0LJzegWuVpl2aAB8-OzZZk1AIB0gYfWSEwcBs92HBanEw8QlQWEPkSmVx6S5dbVSx7Fn_k1bbiB',
    images: [
      {
        id: 'hero',
        label: 'HERO',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmYdkWVRHHB9Xxm1mQhTzNT9Xt1x3TNJOxHqrHlSpsLP_iZle-nGzIIVxf4RIBPGf5eZ4ZP98H0CxD0lNmbkzzPkI7Ow6AE9fbAimD9cu9Oe4AT_l62Fyf-KlsvRKaSUQEv_aod7MoRX-Hqzl57xvMvo_q5tNsH0LJzegWuVpl2aAB8-OzZZk1AIB0gYfWSEwcBs92HBanEw8QlQWEPkSmVx6S5dbVSx7Fn_k1bbiB',
      },
      {
        id: 'shutter',
        label: 'SHUTTER DIAL',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUUwaoa-ksSKhJIs6iiDYrYokH8C3myEIpNz2f7miF_0CsrlvmMj1_olRmQGDT6-eMdLl-LXetw2kZtsc8vwvSps-LGeNYPXQ7YXkCHAZplQDIecDHPcQYuapXqDtvUoBHOacrePwPf5Nn-EjKwP8Z0V6Umy2njdVpbOCdaoL-GGwKX1IRfcvQg3EdTK7e_NLpMLrNHUfzr8P4EJmubDz__NV7RxH5tKqRgJC0-Lwo',
      },
    ],
  },
};

/**
 * Lấy dữ liệu khởi tạo chuẩn cho một hiện vật bất kỳ dựa trên ID hoặc SKU
 */
export function getInitialThriftDataForUnit(unitIdOrSku?: string): ThriftConvertData {
  const key = unitIdOrSku || 'INV-HB907-01';
  const profile = SPECIMEN_PROFILES[key] || SPECIMEN_PROFILES['INV-HB907-01'];

  return {
    unitId: profile.id,
    sku: profile.sku,
    title: `${profile.productName} (Ex-Rental Archive ${profile.conditionGrade.split(' ')[0]})`,
    category: profile.category,
    condition: `${profile.conditionGrade} - Đã qua thẩm định buồng máy`,
    price: profile.price,
    originalPrice: profile.originalPrice,
    depreciationText: profile.depreciationText,
    description: profile.description,
    heroImage: profile.heroImage,
    images: profile.images,
    status: profile.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'ELIGIBLE',
    currentRentStatus: profile.currentRentStatus,
    hasFutureBooking: profile.hasFutureBooking,
    serialNumber: profile.serialNumber,
    cycleCount: profile.cycleCount,
    daysRented: profile.daysRented,
    totalRevenue: profile.totalRevenue,
    sourceTag: 'Returned RENT Inventory (Chuyển giao từ Kho RENT)',
    inspectorName: profile.curatorName,
    certificateCode: profile.certificateCode,
    hashProof: profile.hashProof,
    recentOrderCode: profile.recentOrderCode,
    recentCustomer: profile.recentCustomer,
  };
}

/**
 * Danh sách tóm tắt tất cả hiện vật có thể chuyển đổi để render bộ chuyển đổi nhanh
 */
export const AVAILABLE_CONVERT_SPECIMENS = Object.values(SPECIMEN_PROFILES).map((p) => ({
  id: p.id,
  sku: p.sku,
  name: p.productName,
  price: p.price,
  condition: p.conditionGrade,
  status: p.status,
  isEligible: p.currentRentStatus !== 'RENTING' && !p.hasFutureBooking,
}));
