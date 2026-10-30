import React from 'react';
import { Link } from 'react-router-dom';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface EmptyStateProps {
  type?: 'cart' | 'wishlist' | 'orders' | 'search' | 'filter' | 'inventory' | 'notification' | 'generic';
  icon?: string | React.ReactNode;
  badge?: string;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  tertiaryAction?: EmptyStateAction;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  icon,
  badge,
  title,
  description,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  className = '',
  children,
}) => {
  // Default icon based on type
  const resolvedIcon = icon || (() => {
    switch (type) {
      case 'cart':
        return 'shopping_bag';
      case 'wishlist':
        return 'favorite_border';
      case 'orders':
        return 'receipt_long';
      case 'search':
        return 'search_off';
      case 'filter':
        return 'filter_alt_off';
      case 'inventory':
        return 'inventory_2';
      case 'notification':
        return 'notifications_off';
      case 'generic':
      default:
        return 'inbox';
    }
  })();

  const renderAction = (action?: EmptyStateAction) => {
    if (!action) return null;

    const baseClasses =
      'px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95';

    let variantClasses = 'bg-[#141310] text-[#E7E1DD] hover:bg-[#292724] hover:shadow-md';
    if (action.variant === 'secondary') {
      variantClasses = 'bg-[#F1EDE6] text-[#1C1C18] hover:bg-[#EBE8E1] border border-[#E8E4DC]';
    } else if (action.variant === 'outline') {
      variantClasses =
        'bg-white text-[#1C1C18] border border-[#E8E4DC] hover:bg-[#F7F3EC] hover:border-[#141310]';
    }

    if (action.href) {
      return (
        <Link to={action.href} className={`${baseClasses} ${variantClasses}`}>
          {action.icon && <span className="material-symbols-outlined text-[18px]">{action.icon}</span>}
          <span>{action.label}</span>
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={action.onClick}
        className={`${baseClasses} ${variantClasses}`}
      >
        {action.icon && <span className="material-symbols-outlined text-[18px]">{action.icon}</span>}
        <span>{action.label}</span>
      </button>
    );
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-14 bg-white/90 backdrop-blur-xs rounded-3xl border border-[#E8E4DC] shadow-xs relative overflow-hidden ${className}`}
    >
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#F2EDE4]/60 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Center Icon Badge */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#F7F3EC] border border-[#E8E4DC]/80 flex items-center justify-center mb-5 text-[#5E6D5B] shadow-inner group">
        {typeof resolvedIcon === 'string' ? (
          <span className="material-symbols-outlined text-[42px] sm:text-[48px] text-[#5E6D5B] group-hover:scale-110 transition-transform duration-300">
            {resolvedIcon}
          </span>
        ) : (
          resolvedIcon
        )}
      </div>

      {/* Optional Badge */}
      {badge && (
        <span className="px-3 py-1 rounded-full bg-[#EEF2EC] text-[#5E6D5B] text-[11px] font-bold uppercase tracking-wider mb-2.5 border border-[#D5E0D4]">
          {badge}
        </span>
      )}

      {/* Title */}
      <h3 className="font-serif text-xl sm:text-2xl text-[#141310] font-bold max-w-lg tracking-tight">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs sm:text-sm text-[#76726B] max-w-md mt-2 mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* Actions Row */}
      {(primaryAction || secondaryAction || tertiaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
          {renderAction(primaryAction)}
          {renderAction(secondaryAction)}
          {renderAction(tertiaryAction)}
        </div>
      )}

      {/* Custom Child Elements */}
      {children && <div className="mt-6 w-full">{children}</div>}
    </div>
  );
};

export default EmptyState;
