import React from 'react';
import Header from './Header';
import type { UserRole } from './Header';
import Footer from './Footer';
import { Sidebar } from './Sidebar';
import { GuestSidebar } from './GuestSidebar';
import { UserSidebar } from './UserSidebar';
import AdminLayout from './admin/AdminLayout';

interface MasterLayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
  onLogout?: () => void;
}

export const MasterLayout: React.FC<MasterLayoutProps> = ({
  children,
  userRole = 'GUEST',
  onLogout
}) => {
  // Dedicated layout for ADMIN role
  if (userRole === 'ADMIN') {
    return <AdminLayout>{children}</AdminLayout>;
  }

  const showShopSidebar = userRole === 'SHOP';
  const showGuestSidebar = userRole === 'GUEST';
  const showUserSidebar = userRole === 'USER';

  return (
    <div className="min-h-screen flex flex-col bg-[#fdf9f2] text-stone-900 antialiased">
      {/* Header */}
      <Header userRole={userRole} onLogout={onLogout} />

      {/* Body Content */}
      <div className="flex flex-1 w-full">
        {/* Sidebar SHOP — luôn hiện bên trái */}
        {showShopSidebar && (
          <Sidebar role="SHOP" />
        )}

        {/* Sidebar GUEST — toggle overlay khi role GUEST */}
        {showGuestSidebar && <GuestSidebar />}

        {/* Sidebar CUSTOMER / USER — toggle overlay khi role CUSTOMER */}
        {showUserSidebar && <UserSidebar mode="drawer" />}

        <main className={`flex-1 w-full pt-28 ${showShopSidebar ? 'px-4 lg:px-8' : ''}`}>
          {children}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MasterLayout;
