import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * Base Skeleton primitive
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
  width,
  height,
  animation = 'shimmer',
}) => {
  const variantClass =
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'text'
      ? 'rounded-md h-4 my-1'
      : variant === 'rectangular'
      ? 'rounded-none'
      : 'rounded-2xl';

  const animationClass =
    animation === 'pulse'
      ? 'animate-pulse bg-[#EBE7DF]'
      : animation === 'shimmer'
      ? 'relative overflow-hidden bg-[#EAE6DE] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent'
      : 'bg-[#EAE6DE]';

  return (
    <div
      className={`${variantClass} ${animationClass} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
};

/**
 * Skeleton for Marketplace Product Cards (RENT & THRIFT)
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col bg-white rounded-3xl p-3 sm:p-4 border border-[#E8E4DC]/80 shadow-2xs space-y-3">
      {/* Product Image Area */}
      <Skeleton className="w-full aspect-[4/3] sm:aspect-square rounded-2xl" />

      {/* Tags row */}
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
      </div>

      {/* Title lines */}
      <div className="space-y-1.5 py-1">
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
      </div>

      {/* Price & Action row */}
      <div className="pt-2 border-t border-[#F2EFE9] flex items-center justify-between gap-2">
        <div className="space-y-1">
          <Skeleton className="h-3 w-12 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
    </div>
  );
};

/**
 * Grid of Product Skeletons for Marketplace
 */
export const MarketplaceGridSkeleton: React.FC<{ count?: number; showFilterBar?: boolean }> = ({
  count = 8,
  showFilterBar = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Optional Search / Filter bar skeleton */}
      {showFilterBar && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/70 rounded-2xl border border-[#E8E4DC]">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: count }).map((_, idx) => (
          <ProductCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
};

/**
 * Cart Item Row Skeleton
 */
export const CartItemSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E4DC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <Skeleton className="w-5 h-5 rounded shrink-0" />
        <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      </div>
      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
        <Skeleton className="h-5 w-24 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

/**
 * Full Cart Page Skeleton
 */
export const CartSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left items stream */}
      <div className="lg:col-span-8 space-y-4">
        {/* Selection Bar */}
        <div className="h-12 bg-[#F7F3EC] rounded-2xl p-4 flex items-center justify-between">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        {/* 3 Cart Item Skeletons */}
        <CartItemSkeleton />
        <CartItemSkeleton />
        <CartItemSkeleton />
      </div>

      {/* Right Order Summary sidebar */}
      <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#E8E4DC] space-y-5">
        <Skeleton className="h-6 w-36 rounded" />
        <div className="space-y-3 py-2 border-y border-[#F7F3EC]">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-7 w-28 rounded" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Order Card Skeleton (for Rent & Thrift orders list)
 */
export const OrderCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8E4DC] shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F2EFE9]">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-4 w-36 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </div>

      {/* Order Item Body */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-5 w-44 sm:w-64 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        </div>
        <div className="text-right space-y-1 self-end sm:self-center">
          <Skeleton className="h-3 w-16 rounded ml-auto" />
          <Skeleton className="h-6 w-28 rounded" />
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="pt-4 border-t border-[#F2EFE9] flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-48 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * List of Order Card Skeletons
 */
export const OrdersListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, idx) => (
        <OrderCardSkeleton key={idx} />
      ))}
    </div>
  );
};

/**
 * Dashboard Overview Skeleton
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* User Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E4DC] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Stat Cards 4 Cols */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-white border border-[#E8E4DC] space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
            <Skeleton className="h-7 w-24 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-6 w-36 rounded" />
          <div className="p-5 rounded-2xl bg-white border border-[#E8E4DC] space-y-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
