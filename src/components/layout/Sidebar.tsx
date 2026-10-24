import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, ShieldCheck, AlertTriangle, DollarSign, Package, ShoppingBag } from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'SHOP';
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Duyệt bài đăng', path: '/admin/listings', icon: CheckSquare },
    { name: 'Duyệt KYC', path: '/admin/kyc', icon: ShieldCheck },
    { name: 'Quản lý tranh chấp', path: '/admin/disputes', icon: AlertTriangle },
    { name: 'Thống kê doanh thu', path: '/admin/finance', icon: DollarSign },
  ];

  const shopLinks = [
    { name: 'Quản lý kho', path: '/shop/inventory', icon: Package },
    { name: 'Đăng sản phẩm thuê', path: '/shop/rent/create', icon: ShoppingBag },
    { name: 'Đơn hàng bán/cho thuê', path: '/shop/orders', icon: CheckSquare },
  ];

  const links = role === 'ADMIN' ? adminLinks : shopLinks;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 sticky top-28 h-[calc(100vh-7rem)] overflow-y-auto self-start p-4 flex flex-col shrink-0 [scrollbar-width:thin]">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">
        {role === 'ADMIN' ? 'Admin Management' : 'Shop Management'}
      </div>
      <nav className="space-y-1 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};