import React, { useEffect, useRef } from 'react';

interface LazyScrollContainerProps {
  children: React.ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  itemCount: number;
}

/**
 * Component dùng chung để xử lý Lazy Loading (Infinite Scroll).
 * Có thể áp dụng cho bất kỳ danh sách nào cần tải thêm khi cuộn.
 */
export const LazyScrollContainer: React.FC<LazyScrollContainerProps> = ({
  children,
  onLoadMore,
  hasMore,
  isLoading,
  className = "",
  loadingComponent,
  emptyComponent,
  itemCount
}) => {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (itemCount === 0 && !isLoading) {
    return <>{emptyComponent || <div className="p-8 text-center text-gray-400 text-sm">Không có dữ liệu</div>}</>;
  }

  return (
    <div className={`overflow-y-auto ${className}`}>
      {children}
      
      {/* Sentinel element to detect end of list */}
      <div ref={observerRef} className="h-4 w-full" />
      
      {isLoading && (
        loadingComponent || (
          <div className="p-4 flex justify-center">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )
      )}
    </div>
  );
};
