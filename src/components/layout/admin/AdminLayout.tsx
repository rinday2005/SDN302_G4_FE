import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import AdminFooter from "./AdminFooter";
import { fetchAdminDashboardData } from "../../../services/admin.api";

interface AdminLayoutProps {
  children?: React.ReactNode;
  rentCount?: number;
  thriftCount?: number;
  kycCount?: number;
  disputeCount?: number;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  rentCount: propRentCount,
  thriftCount: propThriftCount,
  kycCount: propKycCount,
  disputeCount: propDisputeCount,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [counts, setCounts] = useState({
    rent: propRentCount ?? 0,
    thrift: propThriftCount ?? 0,
    kyc: propKycCount ?? 1,
    dispute: propDisputeCount ?? 0,
  });

  useEffect(() => {
    let isMounted = true;
    fetchAdminDashboardData().then((data) => {
      if (isMounted && data) {
        setCounts({
          rent: data.metrics.pendingRentListingsCount,
          thrift: data.metrics.pendingThriftListingsCount,
          kyc: data.metrics.pendingKycCount,
          dispute: data.metrics.openDisputesCount,
        });
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdf9f2] text-[#1c1c18] font-sans antialiased selection:bg-[#d8e3ce] selection:text-[#1c1c18]">
      {/* Dedicated Admin Header */}
      <AdminHeader
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Container with optional Sidebar drawer */}
      <div className="flex flex-1 w-full pt-16">
        {/* Dedicated Admin Sidebar (drawer on mobile / toggleable) */}
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          rentCount={counts.rent}
          thriftCount={counts.thrift}
          kycCount={counts.kyc}
          disputeCount={counts.dispute}
        />

        {/* Content Area */}
        <main className="flex-1 w-full flex flex-col">
          {children || <Outlet />}
        </main>
      </div>

      {/* Dedicated Admin Footer */}
      <AdminFooter />
    </div>
  );
};

export default AdminLayout;
