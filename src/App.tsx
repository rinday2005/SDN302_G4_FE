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
import Wishlist from "./pages/wishlist/Wishlist";
import NotificationCenter from "./pages/notification/NotificationCenter";
import PaymentReturn from "./pages/payment/PaymentReturn";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentFailed from "./pages/payment/PaymentFailed";
import CustomerKyc from "./pages/kyc/CustomerKyc";
import ChatPage from "./pages/chat/ChatPage";

import PublicRoutes from "./routes/PublicRoutes";
import ProtectedRoutes from "./routes/ProtectedRoutes";

import { MasterLayout } from "./components/layout/MasterLayout";
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
            path="/dashboard"
            element={<DashboardRouter />}
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
            path="/thrift/orders"
            element={<MyThriftOrders />}
          />

          <Route
            path="/thrift/orders/:id"
            element={<ThriftOrderDetail />}
          />

          <Route
            path="/my-thrift-orders"
            element={<MyThriftOrders />}
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
            path="/kyc"
            element={<CustomerKyc />}
          />

          <Route
            path="/chat"
            element={<ChatPage />}
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

            <Route
              path="/kyc"
              element={<CustomerKyc />}
            />

            <Route
              path="/user/kyc"
              element={<CustomerKyc />}
            />

            <Route
              path="/chat"
              element={<ChatPage />}
            />

            <Route
              path="/user/chat"
              element={<ChatPage />}
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
          <Route
            element={<AppLayout role="ADMIN" />}
          >
            <Route
              path="/admin/dashboard"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/listings"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/kyc"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/disputes"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/finance"
              element={<AdminDashboard />}
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