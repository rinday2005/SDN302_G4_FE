import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import AdminLayout from "../components/layout/admin/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import UserManagement from "../pages/admin/UserManagement";

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="kyc" element={<Dashboard />} />
        <Route path="rent/listings" element={<Dashboard />} />
        <Route path="thrift/listings" element={<Dashboard />} />
        <Route path="listings" element={<Dashboard />} />
        <Route path="categories" element={<Dashboard />} />
        <Route path="disputes" element={<Dashboard />} />
        <Route path="finance" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
