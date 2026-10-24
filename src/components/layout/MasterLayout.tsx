import React from 'react';
import Header from './Header';
import type { UserRole } from './Header';
import Footer from './Footer';
import { Sidebar } from './Sidebar';
import { GuestSidebar } from './GuestSidebar';
import { UserSidebar } from './UserSidebar';

interface MasterLayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
  onLogout?: () => void;
}

export const MasterLayout: React.FC<MasterLayoutProps> = ({
  children,
  userRole = 'GUEST',
  onLogout,
}) => {
  // Chỉ ADMIN mới dùng Sidebar cố định màu đen, SHOP sẽ dùng layout riêng (OwnerLayout)
  const showAdminSidebar = userRole === 'ADMIN';
  const showGuestSidebar = userRole === 'GUEST';
  const showUserSidebar = userRole === 'USER';

  return (
    <div className="min-h-screen flex flex-col bg-[#fdf9f2] text-stone-900 antialiased">
      {/* Header chung */}
      <Header userRole={userRole} onLogout={onLogout} />

      {/* Body Content */}
      <div className="flex flex-1 w-full">
        {/* Sidebar chỉ ghim cho ADMIN */}
        {showAdminSidebar && <Sidebar role="ADMIN" />}

        {/* Sidebar Drawer cho GUEST */}
        {showGuestSidebar && <GuestSidebar />}

        {/* Sidebar Drawer cho USER */}
        {showUserSidebar && <UserSidebar mode="drawer" />}

        <main className={`flex-1 w-full pt-28 ${showAdminSidebar ? 'px-4 lg:px-8' : ''}`}>
          {children}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MasterLayout;
