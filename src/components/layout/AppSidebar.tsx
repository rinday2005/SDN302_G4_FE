import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserSidebar } from './UserSidebar';
import { GuestSidebar } from './GuestSidebar';

export interface AppSidebarProps {
  className?: string;
  activeKey?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  hideFloatingToggle?: boolean;
}

/**
 * AppSidebar automatically switches between:
 * - UserSidebar (when authenticated as regular customer / user)
 * - GuestSidebar (when browsing as guest without login)
 */
export const AppSidebar: React.FC<AppSidebarProps> = (props) => {
  const { user } = useAuth();

  if (user) {
    return <UserSidebar {...props} />;
  }

  return <GuestSidebar {...props} />;
};

export default AppSidebar;
