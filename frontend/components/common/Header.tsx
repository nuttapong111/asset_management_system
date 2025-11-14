'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  BellIcon,
  HomeIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { logout, getStoredUser } from '@/lib/auth';
import { UserRole } from '@/types/user';
import { getUnreadNotificationsCount, getNotificationsByUser, markNotificationAsRead } from '@/lib/mockData';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['owner', 'tenant', 'admin'] },
  { name: 'สัญญาเช่า', href: '/contracts', icon: DocumentTextIcon, roles: ['owner', 'tenant', 'admin'] },
  { name: 'การเงิน', href: '/finance', icon: CurrencyDollarIcon, roles: ['owner', 'tenant', 'admin'] },
  { name: 'บำรุงรักษา', href: '/maintenance', icon: WrenchScrewdriverIcon, roles: ['owner', 'tenant', 'admin'] },
  { name: 'รายงาน', href: '/reports', icon: ChartBarIcon, roles: ['owner', 'admin'] },
  { name: 'ตั้งค่า', href: '/settings', icon: Cog6ToothIcon, roles: ['owner', 'tenant', 'admin'] },
];

// Notification List Component
function NotificationList({ userId, onClose }: { userId: string; onClose: () => void }) {
  const notifications = getNotificationsByUser(userId);
  const router = useRouter();

  const handleNotificationClick = (notification: any) => {
    markNotificationAsRead(notification.id);
    onClose();
    
    // Navigate based on notification type
    if (notification.type === 'payment_proof' && notification.relatedId) {
      // Navigate to dashboard and could scroll to payment
      router.push('/dashboard');
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <BellIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">ไม่มีการแจ้งเตือน</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {notifications.slice(0, 10).map((notification) => (
        <button
          key={notification.id}
          onClick={() => handleNotificationClick(notification)}
          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
            notification.status === 'unread' ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-2 ${
              notification.status === 'unread' ? 'bg-blue-500' : 'bg-transparent'
            }`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {notification.title}
              </p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(notification.createdAt).toLocaleString('th-TH', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getStoredUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    if (isDropdownOpen || isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isNotificationOpen]);

  // Update unread notifications count
  useEffect(() => {
    if (user) {
      const updateCount = () => {
        const count = getUnreadNotificationsCount(user.id);
        setUnreadCount(count);
      };
      updateCount();
      // Update every 2 seconds
      const interval = setInterval(updateCount, 2000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) return null;

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleProfileClick = () => {
    router.push('/settings');
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="h-16 flex items-center justify-between px-6">
        {/* Left Side - Title */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-800 whitespace-nowrap">ระบบบริหารจัดการทรัพย์สิน</h1>
        </div>
        
        {/* Right Side - Notification and User Profile */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <BellIcon className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800">การแจ้งเตือน</h3>
                </div>
                <NotificationList userId={user.id} onClose={() => setIsNotificationOpen(false)} />
              </div>
            )}
          </div>
          
          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0)}
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{user.role}</p>
                </div>
                
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span>รายละเอียด Profile</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

