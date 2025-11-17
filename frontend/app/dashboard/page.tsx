'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/common/Layout';
import { Card, CardBody } from '@heroui/react';
import { 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { getStoredUser, getStoredToken } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { UserRole } from '@/types/user';
import DashboardMapComponent from '@/components/common/DashboardMapComponentV2';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalContracts: 0,
    totalIncome: 0,
    pendingMaintenance: 0,
    // New detailed stats
    assetsByType: {
      house: 0,
      condo: 0,
      apartment: 0,
      land: 0,
    },
    assetsByStatus: {
      available: 0,
      rented: 0,
      maintenance: 0,
    },
    paidCount: 0,
    overdueCount: 0,
    monthlyIncome: 0,
    collectedThisMonth: 0,
    overdueAmount: 0,
  });
  const [assets, setAssets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState<any[]>([]);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate loads
    if (hasLoadedRef.current) return;
    
    const loadData = async () => {
      try {
        const currentUser = getStoredUser();
        const token = getStoredToken();
        
        if (!currentUser || !token) {
          router.push('/login');
          return;
        }

        hasLoadedRef.current = true;
        setUser(currentUser);
        apiClient.setToken(token);

        // Load dashboard stats
        const dashboardStats = await apiClient.getDashboardStats();
        
        // Load assets
        const userAssets = await apiClient.getAssets();
        setAssets(userAssets);

        // Load maintenance
        const maintenanceData = await apiClient.getMaintenance();
        setMaintenance(maintenanceData);

        // Calculate assets by type
        const assetsByType = {
          house: userAssets.filter((a: any) => a.type === 'house').length,
          condo: userAssets.filter((a: any) => a.type === 'condo').length,
          apartment: userAssets.filter((a: any) => a.type === 'apartment').length,
          land: userAssets.filter((a: any) => a.type === 'land').length,
        };

        setStats({
          totalAssets: dashboardStats.totalAssets || userAssets.length,
          totalContracts: dashboardStats.totalContracts || 0,
          totalIncome: 0, // Will be calculated from financial records if needed
          pendingMaintenance: dashboardStats.pendingMaintenance || maintenanceData.filter((m: any) => 
            m.status === 'pending' || m.status === 'in_progress'
          ).length,
          assetsByType,
          assetsByStatus: dashboardStats.assetsByStatus || {
            available: userAssets.filter((a: any) => a.status === 'available').length,
            rented: userAssets.filter((a: any) => a.status === 'rented').length,
            maintenance: userAssets.filter((a: any) => a.status === 'maintenance').length,
          },
          paidCount: dashboardStats.paidCount || 0,
          overdueCount: dashboardStats.overdueCount || 0,
          monthlyIncome: dashboardStats.monthlyIncome || 0,
          collectedThisMonth: 0, // Can be calculated from payments if needed
          overdueAmount: 0, // Can be calculated from payments if needed
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Remove router from dependencies

  // For admin, redirect to summary page instead of showing map
  useEffect(() => {
    if (user?.role === 'admin') {
      router.push('/admin/summary');
    }
  }, [user, router]);

  if (!user || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const getDashboardTitle = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'แดชบอร์ดเจ้าของ';
      case 'tenant':
        return 'แดชบอร์ดผู้เช่า';
      case 'admin':
        return 'แดชบอร์ดผู้ดูแลระบบ';
      default:
        return 'แดชบอร์ด';
    }
  };

  const statCards = [
    {
      title: 'จำนวนทรัพย์สินทั้งหมด',
      value: stats.totalAssets,
      icon: BuildingOfficeIcon,
      color: 'blue',
      hide: user.role === 'tenant',
    },
    {
      title: 'จำนวนทรัพย์สินที่ปล่อยเช่า',
      value: stats.assetsByStatus.rented,
      icon: BuildingOfficeIcon,
      color: 'green',
      hide: user.role === 'tenant',
    },
    {
      title: 'รายได้ต่อเดือน',
      value: formatCurrency(stats.monthlyIncome),
      icon: CurrencyDollarIcon,
      color: 'yellow',
      hide: user.role === 'tenant',
    },
    {
      title: 'จำนวนรายการบำรุงรักษา',
      value: stats.pendingMaintenance,
      icon: WrenchScrewdriverIcon,
      color: 'orange',
    },
  ].filter(card => !card.hide);

  const assetsWithLocation = assets.filter(asset => asset.latitude && asset.longitude);

  if (user?.role === 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">กำลังโหลด...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative w-full" style={{ height: 'calc(100vh - 80px)', minHeight: '600px' }}>
        <DashboardMapComponent 
          assets={assetsWithLocation} 
          stats={stats}
          statCards={statCards}
          maintenance={maintenance}
        />
      </div>
    </Layout>
  );
}

