import { useContext } from "react";
import {
  Navigate,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Unauthorized from "./pages/errors/Unauthorized";

import Home from "./pages/home/Home";
import HowItWorks from "./pages/home/HowItWorks";
import AboutPage from "./pages/home/About";
import FaqPage from "./pages/home/FAQ";
import ContactPage from "./pages/home/Contact";

import RentMarketplace from "./pages/rent/marketplace/RentMarketplace";
import RentProductDetail from "./pages/rent/detail/RentProductDetail";
import RentOrderDetail from "./pages/rent/orders/RentOrderDetail";
import MyRentOrders from "./pages/rent/orders/MyRentOrders";
import RentCheckout from "./pages/rent/checkout/RentCheckout";

import ThriftMarketplace from "./pages/thrift/marketplace/ThriftMarketplace";
import ThriftDetail from "./pages/thrift/detail/ThriftDetail";
import ThriftCheckout from "./pages/thrift/checkout/ThriftCheckout";

import CategoriesMarketplace from "./pages/categories/marketplace/CategoriesMarketplace";
import CategoryDetail from "./pages/categories/detail/CategoryDetail";

import UserDashboard from "./pages/home/User/UserDashboard";
import Cart from "./pages/cart/Cart";
import Profile from "./pages/profile/Profile";
import PaymentReturn from "./pages/payment/PaymentReturn";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentFailed from "./pages/payment/PaymentFailed";

// Các trang chức năng của Shop Owner
import { CreateRentProduct } from "./pages/rent/shop/CreateRentProduct";
import { ManageRentProducts } from "./pages/rent/shop/ManageRentProducts";
import { ShopOrders } from "./pages/rent/shop/ShopOrders";
import { InventoryDashboard } from "./pages/rent/shop/InventoryDashboard";
import { RentInventoryDetail } from "./pages/rent/shop/RentInventoryDetail";
import { ConvertToThrift } from "./pages/rent/shop/ConvertToThrift";
import { ShopThriftListings } from "./pages/thrift/shop/ShopThriftListings";
import { CreateThriftListing } from "./pages/thrift/shop/CreateThriftListing";
import { ShopThriftListingDetail } from "./pages/thrift/shop/ShopThriftListingDetail";
import { EditThriftListing } from "./pages/thrift/shop/EditThriftListing";
import { ShopThriftOrders } from "./pages/thrift/orders/ShopThriftOrders";
import { ShopThriftOrderDetail } from "./pages/thrift/orders/ShopThriftOrderDetail";
import { ShopRentOrderDetail } from "./pages/rent/shop/ShopRentOrderDetail";
import { RevenueDashboard } from "./pages/finance/RevenueDashboard";
import { ShopOwnerProfile } from "./pages/profile/ShopOwnerProfile";
import { ShopDashboard } from "./pages/rent/shop/ShopDashboard";
import { ShopOwnerKyc } from "./pages/kyc/ShopOwnerKyc";
import { ShopNotifications } from "./pages/notification/ShopNotifications";

// Import Layout chuẩn riêng biệt cho Shop Owner
import OwnerLayout from "./components/layout_shop_owner/ownerlayout";
import PublicRoutes from "./routes/PublicRoutes";
import ProtectedRoutes from "./routes/ProtectedRoutes";

import { MasterLayout } from "./components/layout/MasterLayout";
import { AuthContext } from "./context/auth-context";
import { ShopProvider } from "./context/ShopContext";

import { NavigationLoader } from "./components/common/NavigationLoader";
import { ScrollRevealManager } from "./components/common/ScrollRevealManager";

const AppLayout = ({
  role,
}: {
  role?: "GUEST" | "USER" | "SHOP" | "ADMIN";
}) => {
  const auth = useContext(AuthContext);
  const user = auth?.user;

  const getMappedRole = (rawRole?: string) => {
    if (rawRole === "SHOP_OWNER" || rawRole === "SHOP") return "SHOP";
    if (rawRole === "CUSTOMER" || rawRole === "USER") return "USER";
    if (rawRole === "ADMIN") return "ADMIN";
    return undefined;
  };

  const activeRole = role || getMappedRole(user?.role) || "GUEST";

  return (
    <MasterLayout
      userRole={activeRole}
      onLogout={auth?.logout}
    >
      <Outlet />
    </MasterLayout>
  );
};

const SavedItemsPage = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-bold text-gray-800">
      Danh Sách Yêu Thích (Wishlist)
    </h1>
  </div>
);

const NotificationsPage = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-bold text-gray-800">
      Thông Báo Của Tôi
    </h1>
  </div>
);

const MyOrdersPage = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-bold text-gray-800">
      Đơn Hàng Của Tôi
    </h1>
  </div>
);

const AdminDashboard = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-bold text-gray-800">
      Admin Dashboard
    </h1>
  </div>
);

const DashboardRouter = () => {
  const auth = useContext(AuthContext);
  if (auth?.user) {
    return <UserDashboard />;
  }
  return <Home />;
};

const App = () => {
  return (
    <>
      <NavigationLoader />
      <ScrollRevealManager />

      <ShopProvider>
        <Routes>
          {/* 1. PUBLIC AUTH */}
          <Route element={<PublicRoutes />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* 2. PUBLIC BROWSING (Layout GUEST cho khách) */}
          <Route element={<AppLayout role="GUEST" />}>
            <Route path="/" element={<Home />} />
            <Route path="/rent" element={<RentMarketplace />} />
            <Route path="/rent/marketplace" element={<RentMarketplace />} />
            <Route path="/rent/products/:id" element={<RentProductDetail />} />
            <Route path="/rent/orders/:id" element={<RentOrderDetail />} />
            <Route path="/rent/orders" element={<MyRentOrders />} />
            <Route path="/my-rent-orders" element={<MyRentOrders />} />
            <Route path="/rent/detail/:id" element={<RentProductDetail />} />
            <Route path="/rent/checkout" element={<RentCheckout />} />
            <Route path="/rent/checkout/:id" element={<RentCheckout />} />
            <Route path="/thrift" element={<ThriftMarketplace />} />
            <Route path="/thrift/marketplace" element={<ThriftMarketplace />} />
            <Route path="/thrift/:id" element={<ThriftDetail />} />
            <Route path="/thrift/products/:id" element={<ThriftDetail />} />
            <Route path="/thrift/checkout" element={<ThriftCheckout />} />
            <Route path="/thrift/checkout/:id" element={<ThriftCheckout />} />
            <Route path="/categories" element={<CategoriesMarketplace />} />
            <Route path="/categories/marketplace" element={<CategoriesMarketplace />} />
            <Route path="/categories/:slug" element={<CategoryDetail />} />
            <Route path="/categories/detail/:slug" element={<CategoryDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/payment/vnpay-return" element={<PaymentReturn />} />
            <Route path="/payments/vnpay-return" element={<PaymentReturn />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-failed" element={<PaymentFailed />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          {/* 3. USER KHÁCH HÀNG (Layout USER) */}
          <Route element={<ProtectedRoutes allowedRoles={["USER"]} />}>
            <Route element={<AppLayout role="USER" />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/saved-items" element={<SavedItemsPage />} />
              <Route path="/wishlist" element={<SavedItemsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/account-settings" element={<Profile />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
            </Route>
          </Route>

          {/* 4. KHU VỰC QUẢN TRỊ SHOP OWNER (DÙNG OWNERLAYOUT RIÊNG) */}
          <Route element={<OwnerLayout />}>
            <Route path="/shop" element={<ShopDashboard />} />
            <Route path="/shop/dashboard" element={<ShopDashboard />} />
            <Route path="/shop/profile" element={<ShopOwnerProfile />} />
            <Route path="/shop/account" element={<ShopOwnerProfile />} />
            <Route path="/shop/owner-profile" element={<ShopOwnerProfile />} />
            <Route path="/shop/kyc" element={<ShopOwnerKyc />} />
            <Route path="/shop/verification" element={<ShopOwnerKyc />} />
            <Route path="/kyc" element={<ShopOwnerKyc />} />
            <Route path="/shop/notifications" element={<ShopNotifications />} />
            <Route path="/shop/alerts" element={<ShopNotifications />} />
            <Route path="/shop/inventory" element={<ManageRentProducts />} />

            {/* Quản lý danh sách sản phẩm RENT */}
            <Route path="/shop/rent/products" element={<ManageRentProducts />} />
            <Route path="/shop/rent-products" element={<ManageRentProducts />} />

            {/* Kho hiện vật cá thể & Thẩm định */}
            <Route path="/shop/rent/inventory" element={<InventoryDashboard />} />
            <Route path="/shop/rent/inventory/:itemId" element={<RentInventoryDetail />} />

            {/* Chức năng [FE-S4-04] Chuyển sang thanh lý đồ cũ (Convert RENT to THRIFT) */}
            <Route path="/shop/rent/convert/:id" element={<ConvertToThrift />} />
            <Route path="/shop/rent/convert-thrift/:id" element={<ConvertToThrift />} />
            <Route path="/shop/convert-thrift/:id" element={<ConvertToThrift />} />

            {/* Khởi tạo & Chỉnh sửa sản phẩm RENT */}
            <Route path="/shop/rent/create" element={<CreateRentProduct />} />
            <Route path="/shop/rent/edit/:id" element={<CreateRentProduct />} />

            {/* Quản lý đơn hàng RENT (Có Modal xác nhận gửi hàng & Sổ lệnh chi tiết) */}
            <Route path="/shop/orders" element={<ShopOrders />} />
            <Route path="/shop/orders/:id" element={<ShopRentOrderDetail />} />
            <Route path="/shop/rent/orders" element={<ShopOrders />} />
            <Route path="/shop/rent/orders/:id" element={<ShopRentOrderDetail />} />

            {/* Quản lý mục đăng & đơn bán THRIFT */}
            <Route path="/shop/thrift/listings" element={<ShopThriftListings />} />
            <Route path="/shop/thrift/listings/create" element={<CreateThriftListing />} />
            <Route path="/shop/thrift/create" element={<CreateThriftListing />} />
            <Route path="/shop/thrift/listings/:id" element={<EditThriftListing />} />
            <Route path="/shop/thrift/listings/:id/edit" element={<EditThriftListing />} />
            <Route path="/shop/thrift/listings/:id/view" element={<ShopThriftListingDetail />} />
            <Route path="/shop/thrift/:id" element={<EditThriftListing />} />
            <Route path="/shop/thrift/orders" element={<ShopThriftOrders />} />
            <Route path="/shop/thrift/orders/:id" element={<ShopThriftOrderDetail />} />
            <Route path="/shop/orders/thrift" element={<ShopThriftOrders />} />
            <Route path="/shop/orders/thrift/:id" element={<ShopThriftOrderDetail />} />
            <Route path="/shop/revenue" element={<RevenueDashboard />} />
            <Route path="/shop/payouts" element={<RevenueDashboard />} />
          </Route>

          {/* 5. ADMIN ONLY */}
          <Route element={<ProtectedRoutes allowedRoles={["ADMIN"]} />}>
            <Route element={<AppLayout role="ADMIN" />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/listings" element={<AdminDashboard />} />
              <Route path="/admin/kyc" element={<AdminDashboard />} />
              <Route path="/admin/disputes" element={<AdminDashboard />} />
              <Route path="/admin/finance" element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* 6. ERROR & FALLBACK */}
          <Route path="/403" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ShopProvider>
    </>
  );
};

export default App;