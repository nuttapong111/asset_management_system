'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/common/Layout';
import { Card, CardBody } from '@heroui/react';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { getStoredUser } from '@/lib/auth';
import { mockUsers, mockAssets, mockContracts } from '@/lib/mockData';

interface UserActivity {
  hour: number;
  count: number;
}

export default function AdminSummaryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalOwners: 0,
    totalTenants: 0,
    totalAssets: 0,
    userActivity: [] as UserActivity[],
  });

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);

    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login');
      return;
    }

    // Calculate stats
    const owners = mockUsers.filter(u => u.role === 'owner');
    const tenants = mockUsers.filter(u => u.role === 'tenant');
    
    // Mock user activity by hour (0-23)
    const activity: UserActivity[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * 50) + 10, // Mock data
    }));

    setStats({
      totalOwners: owners.length,
      totalTenants: tenants.length,
      totalAssets: mockAssets.length,
      userActivity: activity,
    });
  }, [router]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const statCards = [
    {
      title: 'จำนวน Owner ทั้งหมด',
      value: stats.totalOwners,
      icon: UserGroupIcon,
      color: 'blue',
    },
    {
      title: 'จำนวนผู้เช่าทั้งหมด',
      value: stats.totalTenants,
      icon: UsersIcon,
      color: 'green',
    },
    {
      title: 'จำนวนสินทรัพย์ทั้งหมด',
      value: stats.totalAssets,
      icon: BuildingOfficeIcon,
      color: 'purple',
    },
  ];

  const maxActivity = Math.max(...stats.userActivity.map(a => a.count), 1);

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ข้อมูลสรุประบบ</h1>
          <p className="text-gray-600 mt-2">ภาพรวมข้อมูลทั้งหมดในระบบ</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="shadow-lg">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                    </div>
                    <div className={`p-4 rounded-full bg-${card.color}-100`}>
                      <Icon className={`w-8 h-8 text-${card.color}-600`} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* User Activity Chart */}
        <Card className="shadow-lg">
          <CardBody className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">จำนวนผู้ใช้งานในแต่ละช่วงเวลา</h2>
              <p className="text-sm text-gray-600">แสดงจำนวนผู้ใช้งานในแต่ละชั่วโมง (24 ชั่วโมง)</p>
            </div>
            
            <div className="mt-6">
              <div className="flex items-end gap-2 h-64">
                {stats.userActivity.map((activity, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: '100%' }}>
                      <div
                        className="w-full bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors cursor-pointer relative group"
                        style={{ 
                          height: `${(activity.count / maxActivity) * 100}%`,
                          minHeight: '4px'
                        }}
                        title={`${activity.hour}:00 - ${activity.count} ผู้ใช้งาน`}
                      >
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {activity.count} ผู้ใช้งาน
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      {activity.hour}:00
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>จำนวนผู้ใช้งาน</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลสรุป Owner</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">จำนวน Owner ทั้งหมด</span>
                  <span className="text-lg font-semibold text-gray-800">{stats.totalOwners} คน</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">จำนวนสินทรัพย์เฉลี่ยต่อ Owner</span>
                  <span className="text-lg font-semibold text-gray-800">
                    {stats.totalOwners > 0 ? Math.round(stats.totalAssets / stats.totalOwners) : 0} แห่ง
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-lg">
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลสรุปผู้เช่า</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">จำนวนผู้เช่าทั้งหมด</span>
                  <span className="text-lg font-semibold text-gray-800">{stats.totalTenants} คน</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">จำนวนสัญญาเช่าทั้งหมด</span>
                  <span className="text-lg font-semibold text-gray-800">{mockContracts.length} สัญญา</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

