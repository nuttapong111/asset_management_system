'use client';

import { useRouter, usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { logout, getStoredUser } from '@/lib/auth';
import { UserRole } from '@/types/user';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['owner', 'tenant', 'admin'] },
  { name: 'ทรัพย์สิน', href: '/assets', icon: BuildingOfficeIcon, roles: ['owner', 'admin'] },
  { name: 'สัญญาเช่า', href: '/contracts', icon: DocumentTextIcon, roles: ['owner', 'tenant', 'admin'] },
  { name: 'การเงิน', href: '/finance', icon: CurrencyDollarIcon, roles: ['owner', 'tenant', 'admin'] },
  { name: 'บำรุงรักษา', href: '/maintenance', icon: WrenchScrewdriverIcon, roles: ['owner', 'tenant', 'admin'] },
  { name: 'รายงาน', href: '/reports', icon: ChartBarIcon, roles: ['owner', 'admin'] },
  { name: 'ตั้งค่า', href: '/settings', icon: Cog6ToothIcon, roles: ['owner', 'tenant', 'admin'] },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getStoredUser();

  if (!user) return null;

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="h-full w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Asset Management</h2>
        <p className="text-xs text-gray-500 mt-1">{user.name}</p>
        <p className="text-xs text-gray-400 capitalize">{user.role}</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
}

