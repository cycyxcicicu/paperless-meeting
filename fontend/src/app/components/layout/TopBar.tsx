import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { cn } from '../../../lib/utils';
import {
  Bell,
  ChevronDown,
  HelpCircle,
  User,
  Home,
  Calendar,
  Settings,
  Sliders,
  DoorOpen,
  Users,
  FileCheck,
  Library,
  BarChart3,
  Newspaper,
  LogOut,
  UserCircle,
  KeyRound,
  Mail,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TopBar = () => {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const mainModules = [
    { name: 'Trang chủ', path: '/', icon: Home },
    { name: 'Quản lý người dùng', path: '/nguoi-dung', icon: Users },
    { name: 'Phòng họp', path: '/phong-hop', icon: DoorOpen },
    { name: 'Quản lý họp', path: '/phien-hop', icon: Users },
    { name: 'Phiếu lấy ý kiến', path: '/bieu-quyet', icon: FileCheck },
    { name: 'Thư viện văn bản', path: '/tai-lieu', icon: Library },
  ];

  const notifications = [
    { id: 1, title: 'Cuộc họp mới', message: 'Họp ban Thường vụ lúc 14:00', time: '5 phút trước', unread: true },
    { id: 2, title: 'Tài liệu mới', message: 'Báo cáo tháng 4 đã được tải lên', time: '1 giờ trước', unread: true },
    { id: 3, title: 'Phê duyệt', message: 'Yêu cầu #1234 đã được phê duyệt', time: '3 giờ trước', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="h-16 bg-white border-b border-gray-200/80 fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="h-full flex items-center justify-between px-6 gap-8">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C8102E] via-[#B80F28] to-[#A90F14] flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="text-white text-base font-black tracking-tight">iC</span>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-gray-900 leading-tight tracking-tight">
              iCPV Cabinet
            </span>
            <span className="text-[10px] font-semibold text-gray-400 leading-tight tracking-wide uppercase">
              Hải Phòng City
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrol px-[38px] py-[0px]lbar-hide">
          {mainModules.map((module) => {
            // Check if current path matches or starts with module path
            // Special handling for homepage to avoid matching everything
            const isActive = module.path === '/' 
              ? location.pathname === '/'
              : location.pathname.startsWith(module.path);
            const Icon = module.icon;

            return (
              <Link
                key={module.path}
                to={module.path}
                className={cn(
                  "relative group flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 whitespace-nowrap shrink-0",
                  isActive
                    ? 'text-[#C8102E]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                )}
              >
                <Icon className={cn(
                  'h-4 w-4 transition-all duration-200',
                  isActive ? 'text-[#C8102E]' : 'text-gray-400 group-hover:text-gray-600'
                )} strokeWidth={2.2} />
                <span>{module.name}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C8102E] to-[#A90F14] rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Hover background */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-lg bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Help Button */}
          <button className="relative group p-2.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200">
            <HelpCircle className="h-5 w-5" strokeWidth={2} />
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-semibold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Trợ giúp
            </span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative group p-2.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-gradient-to-br from-[#C8102E] to-[#A90F14] text-white text-[9px] font-bold rounded-full border-2 border-white shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900">Thông báo</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-[#C8102E] bg-red-50 px-2 py-1 rounded-full">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          'p-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer',
                          notif.unread && 'bg-blue-50/30'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-2 h-2 rounded-full mt-1.5 shrink-0',
                            notif.unread ? 'bg-[#C8102E]' : 'bg-gray-300'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 mb-0.5">{notif.title}</p>
                            <p className="text-xs text-gray-600 mb-1">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                    <button className="w-full text-xs font-semibold text-[#C8102E] hover:text-[#A90F14] transition-colors">
                      Xem tất cả thông báo
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 mx-2" />

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C8102E] via-[#B80F28] to-[#A90F14] flex items-center justify-center shadow-md shadow-red-500/20">
                  <User className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-xs font-bold text-gray-900 leading-tight">Super Admin</span>
                <span className="text-[10px] font-semibold text-gray-500 leading-tight">Quản trị hệ thống</span>
              </div>
              <ChevronDown className={cn(
                'h-4 w-4 text-gray-400 transition-transform duration-200',
                showUserMenu && 'rotate-180'
              )} />
            </button>

            {/* User Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                >
                  {/* User Info Header */}
                  <div className="p-4 bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C8102E] to-[#A90F14] flex items-center justify-center shadow-lg">
                        <User className="h-6 w-6 text-white" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">Super Admin</p>
                        <p className="text-xs text-gray-500 truncate">admin@haiphong.gov.vn</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all group">
                      <UserCircle className="h-4 w-4 text-gray-400 group-hover:text-gray-600" strokeWidth={2} />
                      <span>Hồ sơ của tôi</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all group">
                      <Mail className="h-4 w-4 text-gray-400 group-hover:text-gray-600" strokeWidth={2} />
                      <span>Tin nhắn</span>
                      <span className="ml-auto text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">3</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all group">
                      <KeyRound className="h-4 w-4 text-gray-400 group-hover:text-gray-600" strokeWidth={2} />
                      <span>Đổi mật khẩu</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all group">
                      <Settings className="h-4 w-4 text-gray-400 group-hover:text-gray-600" strokeWidth={2} />
                      <span>Cài đặt</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 my-2" />

                  {/* Logout */}
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-all group">
                      <LogOut className="h-4 w-4" strokeWidth={2.5} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export { TopBar };