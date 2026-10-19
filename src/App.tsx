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

import CategoriesMarketplace from "./pages/categories/marketplace/CategoriesMarketplace";
import CategoryDetail from "./pages/categories/detail/CategoryDetail";

import UserDashboard from "./pages/home/User/UserDashboard";
import Cart from "./pages/cart/Cart";
import Profile from "./pages/profile/Profile";
import Wishlist from "./pages/wishlist/Wishlist";
import NotificationCenter from "./pages/notification/NotificationCenter";
import PaymentReturn from "./pages/payment/PaymentReturn";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentFailed from "./pages/payment/PaymentFailed";

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
    if (
      rawRole === "SHOP_OWNER" ||
      rawRole === "SHOP"
    ) {
      return "SHOP";
    }

    if (
      rawRole === "CUSTOMER" ||
      rawRole === "USER"
    ) {
      return "USER";
    }

    if (rawRole === "ADMIN") {
      return "ADMIN";
    }

    return undefined;
  };

  const activeRole =
    getMappedRole(user?.role) || role || "GUEST";

  return (
    <MasterLayout
      userRole={activeRole}
      onLogout={auth?.logout}
    >
      <Outlet />
    </MasterLayout>
  );
};

const ShopDashboard = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-bold text-gray-800">
      Shop Owner Dashboard
    </h1>
  </div>
);


const App = () => {
  return (
    <>
      <NavigationLoader />
      <ScrollRevealManager />

      <Routes>
        {/* PUBLIC */}
        <Route element={<PublicRoutes />}>
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />
        </Route>

        {/* PUBLIC BROWSING */}
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/rent"
            element={<RentMarketplace />}
          />

          <Route
            path="/rent/marketplace"
            element={<RentMarketplace />}
          />

          <Route
            path="/rent/products/:id"
            element={<RentProductDetail />}
          />

          <Route
            path="/rent/orders/:id"
            element={<RentOrderDetail />}
          />
          <Route
            path="/rent/orders/:id/return"
            element={<ReturnRequest />}
          />
          <Route
            path="/rent/return-inspection/:id"
            element={<ReturnRequest />}
          />

          <Route
            path="/rent/orders"
            element={<MyRentOrders />}
          />
          <Route
            path="/my-rent-orders"
            element={<MyRentOrders />}
          />

          <Route
            path="/rent/detail/:id"
            element={<RentProductDetail />}
          />

          <Route
            path="/rent/checkout"
            element={<RentCheckout />}
          />

          <Route
            path="/rent/checkout/:id"
            element={<RentCheckout />}
          />

          <Route
            path="/thrift"
            element={<ThriftMarketplace />}
          />

          <Route
            path="/thrift/marketplace"
            element={<ThriftMarketplace />}
          />

          <Route
            path="/thrift/:id"
            element={<ThriftDetail />}
          />

          <Route
            path="/thrift/products/:id"
            element={<ThriftDetail />}
          />

          <Route
            path="/thrift/checkout"
            element={<ThriftCheckout />}
          />

          <Route
            path="/thrift/checkout/:id"
            element={<ThriftCheckout />}
          />

          <Route
            path="/categories"
            element={<CategoriesMarketplace />}
          />

          <Route
            path="/categories/marketplace"
            element={<CategoriesMarketplace />}
          />

          <Route
            path="/categories/:slug"
            element={<CategoryDetail />}
          />

          <Route
            path="/categories/detail/:slug"
            element={<CategoryDetail />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/payment/vnpay-return"
            element={<PaymentReturn />}
          />

          <Route
            path="/payments/vnpay-return"
            element={<PaymentReturn />}
          />

          <Route
            path="/payment-success"
            element={<PaymentSuccess />}
          />

          <Route
            path="/payment-failed"
            element={<PaymentFailed />}
          />

          <Route
            path="/how-it-works"
            element={<HowItWorks />}
          />

          <Route
            path="/about"
            element={<AboutPage />}
          />

          <Route
            path="/faq"
            element={<FaqPage />}
          />

          <Route
            path="/contact"
            element={<ContactPage />}
          />
        </Route>

        {/* USER ONLY */}
        <Route
          element={
            <ProtectedRoutes
              allowedRoles={["USER"]}
            />
          }
        >
          <Route
            element={<AppLayout role="USER" />}
          >
            {/* NOTE [An - Sprint 1 Profile]:
                Profile is available only for authenticated USER role.
            */}
            <Route
              path="/profile"
              element={<Profile />}
            />

            <Route
              path="/user/dashboard"
              element={<UserDashboard />}
            />

            <Route
              path="/dashboard"
              element={<UserDashboard />}
            />

            <Route
              path="/saved-items"
              element={<Wishlist />}
            />

            <Route
              path="/wishlist"
              element={<Wishlist />}
            />

            <Route
              path="/notifications"
              element={<NotificationCenter />}
            />

            <Route
              path="/account-settings"
              element={<Profile />}
            />

            <Route
              path="/my-orders"
              element={<Navigate to="/rent/orders" replace />}
            />

            <Route
              path="/wallet"
              element={<UserWallet />}
            />

            <Route
              path="/user/wallet"
              element={<UserWallet />}
            />
          </Route>
        </Route>

        {/* SHOP OWNER ONLY */}
        <Route
          element={
            <ProtectedRoutes
              allowedRoles={["SHOP_OWNER"]}
            />
          }
        >
          <Route
            element={<AppLayout role="SHOP" />}
          >
            <Route
              path="/shop/dashboard"
              element={<ShopDashboard />}
            />

            <Route
              path="/shop/inventory"
              element={<ShopDashboard />}
            />

            <Route
              path="/shop/rent/create"
              element={<ShopDashboard />}
            />

            <Route
              path="/shop/orders"
              element={<ShopDashboard />}
            />
          </Route>
        </Route>

        {/* ADMIN ONLY */}
        <Route
          element={
            <ProtectedRoutes
              allowedRoles={["ADMIN"]}
            />
          }
        >
          <Route element={<AdminLayout />}>
            <Route
              path="/admin"
              element={<Dashboard />}
            />

            <Route
              path="/admin/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/admin/users"
              element={<UserManagement />}
            />

            <Route
              path="/admin/users/:id"
              element={<UserDetail />}
            />

            <Route
              path="/admin/user-detail/:id"
              element={<UserDetail />}
            />

            <Route
              path="/admin/user-management"
              element={<UserManagement />}
            />

            <Route
              path="/admin/kyc"
              element={<KycApproval />}
            />

            <Route
              path="/admin/kyc/:id"
              element={<KycReview />}
            />

            <Route
              path="/admin/kyc-review"
              element={<KycReview />}
            />

            <Route
              path="/admin/kyc-review/:id"
              element={<KycReview />}
            />

            <Route
              path="/admin/kyc-approval"
              element={<KycApproval />}
            />

            <Route
              path="/admin/kyc-verification"
              element={<KycApproval />}
            />

            <Route
              path="/admin/rent/listings"
              element={<ListingApproval />}
            />

            <Route
              path="/admin/rent/listings/:id"
              element={<RentReview />}
            />

            <Route
              path="/admin/rent-listings"
              element={<ListingApproval />}
            />

            <Route
              path="/admin/rent-approval"
              element={<ListingApproval />}
            />

            <Route
              path="/admin/duyet-rent"
              element={<ListingApproval />}
            />

            <Route
              path="/admin/duyet-rent/:id"
              element={<RentReview />}
            />

            <Route
              path="/admin/rent-review"
              element={<RentReview />}
            />

            <Route
              path="/admin/rent-review/:id"
              element={<RentReview />}
            />

            <Route
              path="/admin/thrift/listings"
              element={<ThriftListingApproval />}
            />

            <Route
              path="/admin/thrift/listings/:id"
              element={<ThriftReview />}
            />

            <Route
              path="/admin/thrift-listings"
              element={<ThriftListingApproval />}
            />

            <Route
              path="/admin/thrift-approval"
              element={<ThriftListingApproval />}
            />

            <Route
              path="/admin/duyet-thrift"
              element={<ThriftListingApproval />}
            />

            <Route
              path="/admin/duyet-thrift/:id"
              element={<ThriftReview />}
            />

            <Route
              path="/admin/thrift-review"
              element={<ThriftReview />}
            />

            <Route
              path="/admin/thrift-review/:id"
              element={<ThriftReview />}
            />

            <Route
              path="/admin/listings"
              element={<ListingApproval />}
            />

            <Route
              path="/admin/categories"
              element={<CategoryManagement />}
            />

            <Route
              path="/admin/category-management"
              element={<CategoryManagement />}
            />

            <Route
              path="/admin/danh-muc-san"
              element={<CategoryManagement />}
            />

            <Route
              path="/admin/disputes"
              element={<DisputeManagement />}
            />

            <Route
              path="/admin/disputes/:id"
              element={<DisputeReview />}
            />

            <Route
              path="/admin/dispute-review"
              element={<DisputeReview />}
            />

            <Route
              path="/admin/dispute-review/:id"
              element={<DisputeReview />}
            />

            <Route
              path="/admin/tranh-chap"
              element={<DisputeManagement />}
            />

            <Route
              path="/admin/tranh-chap/:id"
              element={<DisputeReview />}
            />

            <Route
              path="/admin/finance"
              element={<PlatformFinance />}
            />

            <Route
              path="/admin/tai-chinh"
              element={<PlatformFinance />}
            />

            <Route
              path="/admin/tai-chinh-san"
              element={<PlatformFinance />}
            />
          </Route>
        </Route>

        {/* ERROR */}
        <Route
          path="/403"
          element={<Unauthorized />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    </>
  );
};

export default App;