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
import ReturnRequest from "./pages/rent/return/ReturnRequest";

import UserWallet from "./pages/wallet/UserWallet";
import ThriftMarketplace from "./pages/thrift/marketplace/ThriftMarketplace";
import ThriftDetail from "./pages/thrift/detail/ThriftDetail";
import ThriftCheckout from "./pages/thrift/checkout/ThriftCheckout";
import MyThriftOrders from "./pages/thrift/orders/MyThriftOrders";
import ThriftOrderDetail from "./pages/thrift/orders/ThriftOrderDetail";

import CategoriesMarketplace from "./pages/categories/marketplace/CategoriesMarketplace";
import CategoryDetail from "./pages/categories/detail/CategoryDetail";
import UserDashboard from "./pages/home/User/UserDashboard";
import Cart from "./pages/cart/Cart";
import Profile from "./pages/profile/Profile";
import PaymentReturn from "./pages/payment/PaymentReturn";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentFailed from "./pages/payment/PaymentFailed";

import Wishlist from "./pages/wishlist/Wishlist";
import NotificationCenter from "./pages/notification/NotificationCenter";
import CustomerKyc from "./pages/kyc/CustomerKyc";
import ChatPage from "./pages/chat/ChatPage";

// Các trang chức năng của Shop Owner
import { CreateRentProduct } from "./pages/rent/shop/CreateRentProduct";
import { EditRentProduct } from "./pages/rent/shop/EditRentProduct";
import { ManageRentProducts } from "./pages/rent/shop/ManageRentProducts";
import { RentProductDetail as ShopRentProductDetail } from "./pages/rent/shop/RentProductDetail";
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

// Layout chuẩn riêng biệt cho Shop Owner
import OwnerLayout from "./components/layout_shop_owner/ownerlayout";

// Các trang chức năng của Admin
import Dashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import UserDetail from "./pages/admin/UserDetail";
import KycApproval from "./pages/admin/KycApproval";
import KycReview from "./pages/admin/KycReview";
import RentReview from "./pages/admin/RentReview";
import ThriftReview from "./pages/admin/ThriftReview";
import ListingApproval from "./pages/admin/ListingApproval";
import ThriftListingApproval from "./pages/admin/ThriftListingApproval";
import CategoryManagement from "./pages/admin/CategoryManagement";
import DisputeManagement from "./pages/admin/DisputeManagement";
import DisputeReview from "./pages/admin/DisputeReview";
import PlatformFinance from "./pages/admin/PlatformFinance";

import PublicRoutes from "./routes/PublicRoutes";
import ProtectedRoutes from "./routes/ProtectedRoutes";

import { MasterLayout } from "./components/layout/MasterLayout";
import { AdminLayout } from "./components/layout/admin/AdminLayout";
import { AuthContext } from "./context/auth-context";
import { ShopProvider } from "./context/ShopContext";

import { NavigationLoader } from "./components/common/NavigationLoader";
import { ScrollRevealManager } from "./components/common/ScrollRevealManager";

const DashboardRouter = () => {
  const auth = useContext(AuthContext);
  const role = (auth?.user?.role as string) || "";
  if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
  if (role === "SHOP_OWNER" || role === "SHOP") return <Navigate to="/shop/dashboard" replace />;
  if (role === "USER" || role === "CUSTOMER") return <Navigate to="/user/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

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

          {/* 2. PUBLIC BROWSING */}
          <Route element={<AppLayout role="GUEST" />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/rent" element={<RentMarketplace />} />
            <Route path="/rent/marketplace" element={<RentMarketplace />} />
            <Route path="/rent/products/:id" element={<RentProductDetail />} />
            <Route path="/rent/detail/:id" element={<RentProductDetail />} />
            <Route path="/rent/orders/:id" element={<RentOrderDetail />} />
            <Route path="/orders/:id" element={<RentOrderDetail />} />
            <Route path="/rent/orders/:id/return" element={<ReturnRequest />} />
            <Route path="/rent/return-inspection/:id" element={<ReturnRequest />} />
            <Route path="/rent/orders" element={<MyRentOrders />} />
            <Route path="/my-rent-orders" element={<MyRentOrders />} />
            <Route path="/rent/checkout" element={<RentCheckout />} />
            <Route path="/rent/checkout/:id" element={<RentCheckout />} />

            <Route path="/thrift" element={<ThriftMarketplace />} />
            <Route path="/thrift/marketplace" element={<ThriftMarketplace />} />
            <Route path="/thrift/:id" element={<ThriftDetail />} />
            <Route path="/thrift/products/:id" element={<ThriftDetail />} />
            <Route path="/thrift/detail/:id" element={<ThriftDetail />} />
            <Route path="/thrift/checkout" element={<ThriftCheckout />} />
            <Route path="/thrift/checkout/:id" element={<ThriftCheckout />} />
            <Route path="/thrift/orders" element={<MyThriftOrders />} />
            <Route path="/my-thrift-orders" element={<MyThriftOrders />} />
            <Route path="/thrift/orders/:id" element={<ThriftOrderDetail />} />

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

          {/* 3. USER KHÁCH HÀNG */}
          <Route element={<ProtectedRoutes allowedRoles={["USER"]} />}>
            <Route element={<AppLayout role="USER" />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/account-settings" element={<Profile />} />
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/saved-items" element={<Wishlist />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/notifications" element={<NotificationCenter />} />
              <Route path="/my-orders" element={<Navigate to="/rent/orders" replace />} />
              <Route path="/wallet" element={<UserWallet />} />
              <Route path="/user/wallet" element={<UserWallet />} />
              <Route path="/kyc" element={<CustomerKyc />} />
              <Route path="/user/kyc" element={<CustomerKyc />} />
              <Route path="/profile/kyc" element={<CustomerKyc />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/user/chat" element={<ChatPage />} />
            </Route>
          </Route>

          {/* 4. KHU VỰC QUẢN TRỊ SHOP OWNER (DÙNG OWNERLAYOUT RIÊNG) */}
          <Route element={<ProtectedRoutes allowedRoles={["SHOP_OWNER"]} />}>
            <Route element={<OwnerLayout />}>
              <Route path="/shop" element={<ShopDashboard />} />
              <Route path="/shop/dashboard" element={<ShopDashboard />} />
              <Route path="/shop/profile" element={<ShopOwnerProfile />} />
              <Route path="/shop/account" element={<ShopOwnerProfile />} />
              <Route path="/shop/owner-profile" element={<ShopOwnerProfile />} />
              <Route path="/shop/kyc" element={<ShopOwnerKyc />} />
              <Route path="/shop/verification" element={<ShopOwnerKyc />} />
              <Route path="/shop/notifications" element={<ShopNotifications />} />
              <Route path="/shop/alerts" element={<ShopNotifications />} />
              <Route path="/shop/inventory" element={<ManageRentProducts />} />

              {/* Quản lý danh sách sản phẩm RENT */}
              <Route path="/shop/rent/products" element={<ManageRentProducts />} />
              <Route path="/shop/rent-products" element={<ManageRentProducts />} />
              <Route path="/shop/rent/products/:id" element={<ShopRentProductDetail />} />
              <Route path="/shop/rent/product/:id" element={<ShopRentProductDetail />} />

              {/* Kho hiện vật cá thể & Thẩm định */}
              <Route path="/shop/rent/inventory" element={<InventoryDashboard />} />
              <Route path="/shop/rent/inventory/:itemId" element={<RentInventoryDetail />} />

              {/* Chuyển đổi RENT sang THRIFT */}
              <Route path="/shop/rent/convert/:id" element={<ConvertToThrift />} />
              <Route path="/shop/rent/convert-to-thrift/:id" element={<ConvertToThrift />} />
              <Route path="/shop/rent/convert-thrift/:id" element={<ConvertToThrift />} />

              {/* Quản lý đơn hàng thuê RENT của Shop */}
              <Route path="/shop/orders" element={<ShopOrders />} />
              <Route path="/shop/rent/orders" element={<ShopOrders />} />
              <Route path="/shop/orders/:id" element={<ShopRentOrderDetail />} />
              <Route path="/shop/rent/orders/:id" element={<ShopRentOrderDetail />} />

              {/* CRUD Sản phẩm cho thuê RENT */}
              <Route path="/shop/rent/create" element={<CreateRentProduct />} />
              <Route path="/shop/rent/create-product" element={<CreateRentProduct />} />
              <Route path="/shop/rent/products/:id/edit" element={<EditRentProduct />} />
              <Route path="/shop/rent/edit/:id" element={<EditRentProduct />} />

              {/* Quản lý bài đăng thanh lý THRIFT */}
              <Route path="/shop/thrift/listings" element={<ShopThriftListings />} />
              <Route path="/shop/thrift-listings" element={<ShopThriftListings />} />
              <Route path="/shop/thrift/listings/create" element={<CreateThriftListing />} />
              <Route path="/shop/thrift/create" element={<CreateThriftListing />} />
              <Route path="/shop/thrift/listings/:id" element={<EditThriftListing />} />
              <Route path="/shop/thrift/listings/:id/edit" element={<EditThriftListing />} />
              <Route path="/shop/thrift/edit/:id" element={<EditThriftListing />} />
              <Route path="/shop/thrift/listings/:id/view" element={<ShopThriftListingDetail />} />
              <Route path="/shop/thrift/:id" element={<EditThriftListing />} />

              {/* Đơn hàng mua đồ THRIFT của Shop */}
              <Route path="/shop/thrift/orders" element={<ShopThriftOrders />} />
              <Route path="/shop/thrift/orders/:id" element={<ShopThriftOrderDetail />} />
              <Route path="/shop/orders/thrift" element={<ShopThriftOrders />} />
              <Route path="/shop/orders/thrift/:id" element={<ShopThriftOrderDetail />} />

              {/* Tài chính & Doanh thu */}
              <Route path="/shop/revenue" element={<RevenueDashboard />} />
              <Route path="/shop/payouts" element={<RevenueDashboard />} />
            </Route>
          </Route>

          {/* 5. ADMIN ONLY */}
          <Route element={<ProtectedRoutes allowedRoles={["ADMIN"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />

              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/users/:id" element={<UserDetail />} />
              <Route path="/admin/user-detail/:id" element={<UserDetail />} />
              <Route path="/admin/user-management" element={<UserManagement />} />
              <Route path="/admin/nguoi-dung" element={<UserManagement />} />
              <Route path="/admin/nguoi-dung/:id" element={<UserDetail />} />

              <Route path="/admin/kyc" element={<KycApproval />} />
              <Route path="/admin/kyc/:id" element={<KycReview />} />
              <Route path="/admin/kyc-review" element={<KycReview />} />
              <Route path="/admin/kyc-review/:id" element={<KycReview />} />
              <Route path="/admin/kyc-approval" element={<KycApproval />} />
              <Route path="/admin/kyc-verification" element={<KycApproval />} />
              <Route path="/admin/xac-thuc-kyc" element={<KycApproval />} />
              <Route path="/admin/xac-thuc-kyc/:id" element={<KycReview />} />

              <Route path="/admin/rent/listings" element={<ListingApproval />} />
              <Route path="/admin/rent/listings/:id" element={<RentReview />} />
              <Route path="/admin/rent-listings" element={<ListingApproval />} />
              <Route path="/admin/rent-approval" element={<ListingApproval />} />
              <Route path="/admin/duyet-rent" element={<ListingApproval />} />
              <Route path="/admin/duyet-rent/:id" element={<RentReview />} />
              <Route path="/admin/rent-review" element={<RentReview />} />
              <Route path="/admin/rent-review/:id" element={<RentReview />} />

              <Route path="/admin/thrift/listings" element={<ThriftListingApproval />} />
              <Route path="/admin/thrift/listings/:id" element={<ThriftReview />} />
              <Route path="/admin/thrift-listings" element={<ThriftListingApproval />} />
              <Route path="/admin/thrift-approval" element={<ThriftListingApproval />} />
              <Route path="/admin/duyet-thrift" element={<ThriftListingApproval />} />
              <Route path="/admin/duyet-thrift/:id" element={<ThriftReview />} />
              <Route path="/admin/thrift-review" element={<ThriftReview />} />
              <Route path="/admin/thrift-review/:id" element={<ThriftReview />} />

              <Route path="/admin/listings" element={<ListingApproval />} />
              <Route path="/admin/listing-approval" element={<ListingApproval />} />
              <Route path="/admin/duyet-tin" element={<ListingApproval />} />
              <Route path="/admin/duyet-tin/:id" element={<ListingApproval />} />

              <Route path="/admin/categories" element={<CategoryManagement />} />
              <Route path="/admin/category-management" element={<CategoryManagement />} />
              <Route path="/admin/danh-muc" element={<CategoryManagement />} />
              <Route path="/admin/danh-muc-san" element={<CategoryManagement />} />

              <Route path="/admin/disputes" element={<DisputeManagement />} />
              <Route path="/admin/disputes/:id" element={<DisputeReview />} />
              <Route path="/admin/dispute-review" element={<DisputeReview />} />
              <Route path="/admin/dispute-review/:id" element={<DisputeReview />} />
              <Route path="/admin/tranh-chap" element={<DisputeManagement />} />
              <Route path="/admin/tranh-chap/:id" element={<DisputeReview />} />

              <Route path="/admin/finance" element={<PlatformFinance />} />
              <Route path="/admin/tai-chinh" element={<PlatformFinance />} />
              <Route path="/admin/tai-chinh-san" element={<PlatformFinance />} />
            </Route>
          </Route>

          {/* 6. ERROR */}
          <Route path="/403" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ShopProvider>
    </>
  );
};

export default App;