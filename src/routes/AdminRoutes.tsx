import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import AdminLayout from "../components/layout/admin/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import UserManagement from "../pages/admin/UserManagement";
import UserDetail from "../pages/admin/UserDetail";
import KycApproval from "../pages/admin/KycApproval";
import KycReview from "../pages/admin/KycReview";
import RentReview from "../pages/admin/RentReview";
import ThriftReview from "../pages/admin/ThriftReview";
import ListingApproval from "../pages/admin/ListingApproval";
import ThriftListingApproval from "../pages/admin/ThriftListingApproval";
import CategoryManagement from "../pages/admin/CategoryManagement";
import DisputeManagement from "../pages/admin/DisputeManagement";
import DisputeReview from "../pages/admin/DisputeReview";
import PlatformFinance from "../pages/admin/PlatformFinance";

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="user-detail/:id" element={<UserDetail />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="kyc" element={<KycApproval />} />
        <Route path="kyc/:id" element={<KycReview />} />
        <Route path="kyc-review" element={<KycReview />} />
        <Route path="kyc-review/:id" element={<KycReview />} />
        <Route path="kyc-approval" element={<KycApproval />} />
        <Route path="rent/listings" element={<ListingApproval />} />
        <Route path="rent/listings/:id" element={<RentReview />} />
        <Route path="rent-listings" element={<ListingApproval />} />
        <Route path="rent-approval" element={<ListingApproval />} />
        <Route path="duyet-rent" element={<ListingApproval />} />
        <Route path="duyet-rent/:id" element={<RentReview />} />
        <Route path="rent-review" element={<RentReview />} />
        <Route path="rent-review/:id" element={<RentReview />} />
        <Route path="thrift/listings" element={<ThriftListingApproval />} />
        <Route path="thrift/listings/:id" element={<ThriftReview />} />
        <Route path="thrift-listings" element={<ThriftListingApproval />} />
        <Route path="thrift-approval" element={<ThriftListingApproval />} />
        <Route path="duyet-thrift" element={<ThriftListingApproval />} />
        <Route path="duyet-thrift/:id" element={<ThriftReview />} />
        <Route path="thrift-review" element={<ThriftReview />} />
        <Route path="thrift-review/:id" element={<ThriftReview />} />
        <Route path="listings" element={<ListingApproval />} />
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="category-management" element={<CategoryManagement />} />
        <Route path="danh-muc-san" element={<CategoryManagement />} />
        <Route path="disputes" element={<DisputeManagement />} />
        <Route path="disputes/:id" element={<DisputeReview />} />
        <Route path="dispute-review" element={<DisputeReview />} />
        <Route path="dispute-review/:id" element={<DisputeReview />} />
        <Route path="tranh-chap" element={<DisputeManagement />} />
        <Route path="tranh-chap/:id" element={<DisputeReview />} />
        <Route path="finance" element={<PlatformFinance />} />
        <Route path="tai-chinh" element={<PlatformFinance />} />
        <Route path="tai-chinh-san" element={<PlatformFinance />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
