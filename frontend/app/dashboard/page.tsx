'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/common/Layout';
import { Card, CardBody } from '@heroui/react';
import { 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { getStoredUser } from '@/lib/auth';
import { 
  mockAssets, 
  mockContracts, 
  mockFinancialRecords, 
  mockMaintenance,
  mockPayments,
  getAssetsByOwner,
  getContractsByTenant 
} from '@/lib/mockData';
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
  const [assets, setAssets] = useState(mockAssets);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
    
    if (!currentUser) return;

    let userAssets = mockAssets;
    let contracts = mockContracts;
    let maintenance = mockMaintenance;
    let payments = mockPayments;

    if (currentUser.role === 'owner') {
      userAssets = getAssetsByOwner(currentUser.id);
      // Filter contracts and payments for owner's assets
      const assetIds = userAssets.map(a => a.id);
      contracts = contracts.filter(c => assetIds.includes(c.assetId));
      payments = payments.filter(p => {
        const contract = contracts.find(c => c.id === p.contractId);
        return contract && assetIds.includes(contract.assetId);
      });
    } else if (currentUser.role === 'tenant') {
      contracts = getContractsByTenant(currentUser.id);
      const contractIds = contracts.map(c => c.id);
      payments = payments.filter(p => contractIds.includes(p.contractId));
    }

    setAssets(userAssets);

    // Calculate basic stats
    const income = mockFinancialRecords
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);

    const pending = maintenance.filter(m => 
      m.status === 'pending' || m.status === 'in_progress'
    ).length;

    // Calculate assets by type
    const assetsByType = {
      house: userAssets.filter(a => a.type === 'house').length,
      condo: userAssets.filter(a => a.type === 'condo').length,
      apartment: userAssets.filter(a => a.type === 'apartment').length,
      land: userAssets.filter(a => a.type === 'land').length,
    };

    // Calculate assets by status
    const assetsByStatus = {
      available: userAssets.filter(a => a.status === 'available').length,
      rented: userAssets.filter(a => a.status === 'rented').length,
      maintenance: userAssets.filter(a => a.status === 'maintenance').length,
    };

    // Calculate payment stats
    const paidCount = payments.filter(p => p.status === 'paid').length;
    const overdueCount = payments.filter(p => {
      if (p.status === 'overdue') return true;
      if (p.status === 'pending') {
        const dueDate = new Date(p.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
      }
      return false;
    }).length;

    // Calculate monthly income (from active contracts)
    const activeContracts = contracts.filter(c => c.status === 'active');
    const monthlyIncome = activeContracts.reduce((sum, c) => sum + c.rentAmount, 0);

    // Calculate collected this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const collectedThisMonth = payments
      .filter(p => {
        if (p.status !== 'paid' || !p.paidDate) return false;
        const paidDate = new Date(p.paidDate);
        return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    // Calculate overdue amount
    const overdueAmount = payments
      .filter(p => {
        if (p.status === 'overdue') return true;
        if (p.status === 'pending') {
          const dueDate = new Date(p.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return dueDate < today;
        }
        return false;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    setStats({
      totalAssets: userAssets.length,
      totalContracts: contracts.length,
      totalIncome: income,
      pendingMaintenance: pending,
      assetsByType,
      assetsByStatus,
      paidCount,
      overdueCount,
      monthlyIncome,
      collectedThisMonth,
      overdueAmount,
    });
  }, []);

  if (!user) return null;

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

  // For admin, redirect to summary page instead of showing map
  useEffect(() => {
    if (user?.role === 'admin') {
      router.push('/admin/summary');
    }
  }, [user, router]);

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
          maintenance={mockMaintenance}
        />
      </div>
    </Layout>
  );
}

