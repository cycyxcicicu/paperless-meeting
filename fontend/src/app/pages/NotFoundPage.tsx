import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/hp-button';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-[120px] font-bold text-[#C8102E] leading-none mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-[#111827] mb-2">
            Không tìm thấy trang
          </h2>
          <p className="text-sm text-[#6B7280] max-w-md mx-auto">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm tra lại đường dẫn.
          </p>
        </div>
        
        <Button variant="primary" onClick={() => navigate('/')}>
          <Home className="h-4 w-4" />
          Về trang chủ
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
