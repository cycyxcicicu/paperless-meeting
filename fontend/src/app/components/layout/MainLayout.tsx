import React from 'react';
import { Outlet } from 'react-router';
import { TopBar } from './TopBar';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <TopBar />
      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  );
};

export { MainLayout };