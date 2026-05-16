import { UserFormModal } from "@/modules/user/components/UserFormModal";
import { ChangePasswordModal } from "@/modules/user/components/ChangePasswordModal";
import {
    Bell,
    ChevronDown,
    DoorOpen,
    Home,
    KeyRound,
    LogOut,
    User,
    UserCircle,
    Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { cn } from '@/common/utils/cn';
import { LazyScrollContainer } from "@/common/components/ui/LazyScrollContainer";

const TopBar = () => {
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    
    // Modal states
    const [showProfile, setShowProfile] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);

    // Mock User Data (Sử dụng cấu trúc UserFormData)
    const currentUser: any = {
        id: 999,
        username: "admin",
        fullName: "Super Admin",
        email: "admin@haiphong.gov.vn",
        phone: "0988123456",
        department: "1", // ID của phòng ban
        position: "giam-doc", // Value của chức vụ
        status: 'active'
    };
    
    // State cho lazy load thông báo
    const [displayNotifications, setDisplayNotifications] = useState([
        { id: 1, title: "Cuộc họp mới", message: "Họp ban Thường vụ lúc 14:00", time: "5 phút trước", unread: true },
        { id: 2, title: "Tài liệu mới", message: "Báo cáo tháng 4 đã được tải lên", time: "1 giờ trước", unread: true },
        { id: 3, title: "Phê duyệt", message: "Yêu cầu #1234 đã được phê duyệt", time: "3 giờ trước", unread: false },
        { id: 4, title: "Thông báo hệ thống", message: "Hệ thống sẽ bảo trì vào 23:00 tối nay", time: "5 giờ trước", unread: false },
        { id: 5, title: "Nhắc lịch", message: "Bạn có lịch công tác vào sáng mai", time: "1 ngày trước", unread: false },
    ]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreNotifs, setHasMoreNotifs] = useState(true);

    const handleLoadMoreNotifs = () => {
        if (isLoadingMore || !hasMoreNotifs) return;
        
        setIsLoadingMore(true);
        setTimeout(() => {
            const newNotifs = [
                { id: Date.now() + 1, title: "Thông báo cũ hơn", message: "Dữ liệu được tải thêm qua Lazy Load", time: "2 ngày trước", unread: false },
                { id: Date.now() + 2, title: "Thông báo cũ hơn", message: "Tính năng này giúp giảm tải cho trình duyệt", time: "3 ngày trước", unread: false },
            ];
            setDisplayNotifications(prev => [...prev, ...newNotifs]);
            setIsLoadingMore(false);
            if (displayNotifications.length > 15) setHasMoreNotifs(false);
        }, 1000);
    };

    // Refs for click outside logic
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const mainModules = [
        { name: "Trang chủ", path: "/", icon: Home },
        { name: "Quản lý", path: "/nguoi-dung", icon: Users },
        { name: "Phòng họp", path: "/phong-hop", icon: DoorOpen },
        { name: "Quản lý họp", path: "/phien-hop", icon: Users },
    ];

    const unreadCount = displayNotifications.filter((n) => n.unread).length;

    return (
        <div className="h-16 bg-white border-b border-gray-200/80 fixed top-0 left-0 right-0 z-50 shadow-sm">
            <div className="h-full flex items-center justify-between px-6 gap-8">
                {/* Logo & Brand */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C8102E] via-[#B80F28] to-[#A90F14] flex items-center justify-center shadow-lg shadow-red-500/20">
                            <span className="text-white text-base font-black tracking-tight">
                                iC
                            </span>
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 leading-tight tracking-tight">
                            iCPV Cabinet
                        </span>
                        <span className="text-[10px] btn-primary text-gray-400 leading-tight tracking-wide uppercase">
                            Hải Phòng City
                        </span>
                    </div>
                </div>

                {/* Main Navigation */}
                <nav className="flex items-center gap-1 flex-1 overflow-x-auto px-[38px] py-[0px] scrollbar-hide">
                    {mainModules.map((module) => {
                        const isActive =
                            module.path === "/"
                                ? location.pathname === "/"
                                : location.pathname.startsWith(module.path);
                        const Icon = module.icon;

                        return (
                            <Link
                                key={module.path}
                                to={module.path}
                                className={cn(
                                    "relative group flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] btn-primary transition-all duration-200 whitespace-nowrap shrink-0",
                                    isActive
                                        ? "text-[#C8102E]"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80",
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "h-4 w-4 transition-all duration-200",
                                        isActive
                                            ? "text-[#C8102E]"
                                            : "text-gray-400 group-hover:text-gray-600",
                                    )}
                                    strokeWidth={2.2}
                                />
                                <span>{module.name}</span>

                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C8102E] to-[#A90F14] rounded-full"
                                        transition={{
                                            type: "spring",
                                            bounce: 0.2,
                                            duration: 0.6,
                                        }}
                                    />
                                )}

                                {!isActive && (
                                    <div className="absolute inset-0 rounded-lg bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Notifications */}
                    <div className="relative" ref={notificationsRef}>
                        <button
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowUserMenu(false);
                            }}
                            className={cn(
                                "relative group p-2.5 rounded-lg transition-all duration-200",
                                showNotifications 
                                    ? "text-[#C8102E] bg-red-50" 
                                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            <Bell className="h-5 w-5" strokeWidth={2} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-gradient-to-br from-[#C8102E] to-[#A90F14] text-white text-[9px] heading rounded-full border-2 border-white shadow-md">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

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
                                            <h3 className="text-sm heading text-gray-900">
                                                Thông báo
                                            </h3>
                                            {unreadCount > 0 && (
                                                <span className="text-[10px] heading text-[#C8102E] bg-red-50 px-2 py-1 rounded-full">
                                                    {unreadCount} mới
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <LazyScrollContainer
                                        className="max-h-96"
                                        onLoadMore={handleLoadMoreNotifs}
                                        hasMore={hasMoreNotifs}
                                        isLoading={isLoadingMore}
                                        itemCount={displayNotifications.length}
                                    >
                                        {displayNotifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                className={cn(
                                                    "p-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer",
                                                    notif.unread && "bg-blue-50/30",
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={cn(
                                                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                                            notif.unread ? "bg-[#C8102E]" : "bg-gray-300",
                                                        )}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm btn-primary text-gray-900 mb-0.5">
                                                            {notif.title}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mb-1">
                                                            {notif.message}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 body">
                                                            {notif.time}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </LazyScrollContainer>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-px h-8 bg-gray-200 mx-2" />

                    {/* User Profile */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => {
                                setShowUserMenu(!showUserMenu);
                                setShowNotifications(false);
                            }}
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all duration-200 group",
                                showUserMenu ? "bg-gray-100" : "hover:bg-gray-50"
                            )}
                        >
                            <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C8102E] via-[#B80F28] to-[#A90F14] flex items-center justify-center shadow-md shadow-red-500/20">
                                    <User
                                        className="h-4.5 w-4.5 text-white"
                                        strokeWidth={2.5}
                                    />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                            </div>
                            <div className="hidden lg:flex flex-col items-start text-left">
                                <span className="text-xs heading text-gray-900 leading-tight">
                                    {currentUser.fullName}
                                </span>
                                <span className="text-[10px] btn-primary text-gray-500 leading-tight">
                                    Quản trị hệ thống
                                </span>
                            </div>
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 text-gray-400 transition-transform duration-200",
                                    showUserMenu && "rotate-180",
                                )}
                            />
                        </button>

                        <AnimatePresence>
                            {showUserMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                                >
                                    <div className="p-4 bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C8102E] to-[#A90F14] flex items-center justify-center shadow-lg">
                                                <User
                                                    className="h-6 w-6 text-white"
                                                    strokeWidth={2.5}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm heading text-gray-900 truncate">
                                                    {currentUser.fullName}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {currentUser.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-2">
                                        <button 
                                            onClick={() => { setShowProfile(true); setShowUserMenu(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm body text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all group text-left"
                                        >
                                            <UserCircle className="h-4 w-4 text-gray-400 group-hover:text-gray-600" strokeWidth={2} />
                                            <span>Hồ sơ</span>
                                        </button>
                                        <button 
                                            onClick={() => { setShowChangePassword(true); setShowUserMenu(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm body text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all group text-left"
                                        >
                                            <KeyRound className="h-4 w-4 text-gray-400 group-hover:text-gray-600" strokeWidth={2} />
                                            <span>Đổi mật khẩu</span>
                                        </button>
                                    </div>

                                    <div className="h-px bg-gray-100 my-1" />

                                    <div className="p-2">
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm btn-primary text-red-600 hover:bg-red-50 transition-all group text-left">
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

            {/* Global User Modals */}
            <UserFormModal 
                isOpen={showProfile} 
                onClose={() => setShowProfile(false)} 
                mode="edit"
                initialData={currentUser}
                isSelfProfile={true}
                onSubmit={(data) => {
                    console.log("Updating self profile...", data);
                }} 
            />
            <ChangePasswordModal 
                isOpen={showChangePassword} 
                onClose={() => setShowChangePassword(false)} 
                onSubmit={(data) => {
                    console.log("Changing password...", data);
                }} 
            />
        </div>
    );
};

export { TopBar };
